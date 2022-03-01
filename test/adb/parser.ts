import Stream from 'stream';
import Chai, { expect } from 'chai';
import Bluebird from 'bluebird';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import Parser, { PrematureEOFError, UnexpectedDataError } from '../../src/adb/parser';
import Util from '../../src/adb/util';

/**
 * 
 * @param promise native or bluebird Promise;
 */
function bluebirdTest(promise: any) {
    if ((promise as Bluebird<unknown>).cancel) {
        (promise as Bluebird<unknown>).cancel();
        expect((promise as Bluebird<unknown>).isCancelled()).to.be.true;
        return true;
    } else {
        expect(promise).to.be.an.instanceOf(Promise);
        return false;
    }
}


describe('Parser', function () {
    describe('end()', function () {
        return it('should end the stream and consume all remaining data', async function () {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('F');
            stream.write('O');
            stream.write('O');
            return await parser.end();
        });
    });
    describe('readAll()', function () {
        it('should return a cancellable Promise', function (done) {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readAll();
            if (!bluebirdTest(promise))
                parser.end();
            done();
        });
        it('should read all remaining content until the stream ends', async function () {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readAll()
            stream.write('F');
            stream.write('O');
            stream.write('O');
            stream.end();
            const buf = await p;
            expect(buf.length).to.equal(3);
            expect(buf.toString()).to.equal('FOO');
            return true;
        });
        return it("should resolve with an empty Buffer if the stream has already ended and there's nothing more to read", async function () {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readAll();
            stream.end();
            const buf = await p;
            expect(buf.length).to.equal(0);
            return true;
        });
    });
    describe('readBytes(howMany)', function () {
        it('should return a cancellable Promise', function (done) {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readBytes(1);
            expect(promise).to.be.an.instanceOf(Promise);
            if (!bluebirdTest(promise))
                parser.end()
            done();
        });
        it('should read as many bytes as requested', async function () {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readBytes(4);
            stream.write('OKAYFAIL');
            const buf = await p;
            expect(buf.length).to.equal(4);
            expect(buf.toString()).to.equal('OKAY');
            const buf2 = await parser.readBytes(2);
            expect(buf2).to.have.length(2);
            expect(buf2.toString()).to.equal('FA');
            return true;
        });
        it('should wait for enough data to appear', async function () {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readBytes(5);
            await Util.delay(50);
            stream.write('BYTES');
            const buf = await p;
            expect(buf.toString()).to.equal('BYTES');
            return true;
        });
        it('should keep data waiting even when nothing has been requested', async function () {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('FOO');
            await Util.delay(50);
            const buf = await parser.readBytes(2);
            expect(buf.length).to.equal(2);
            expect(buf.toString()).to.equal('FO');
            return true;
        });

        return it('should reject with Parser.PrematureEOFError if stream ends before enough bytes can be read', function (done) {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('F');
            const p = parser.readBytes(10)
            stream.end();
            p.catch(err => {
                expect(err).to.be.an.instanceOf(Parser.PrematureEOFError);
                expect(err as PrematureEOFError).to.be.an.instanceOf(Parser.PrematureEOFError);
                done();
            })
        });
    });
    describe('readByteFlow(maxHowMany, targetStream)', () => {
        it('should return a cancellable Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const target = new Stream.PassThrough();
            const promise = parser.readByteFlow(1, target);
            if (!bluebirdTest(promise))
                parser.end()
            done();
        });
        it('should read as many bytes as requested', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const target = new Stream.PassThrough();
            parser
                .readByteFlow(4, target)
                .then(async () => {
                    expect(target.read()).to.eql(Buffer.from('OKAY'));
                    await parser.readByteFlow(2, target);
                    expect(target.read()).to.eql(Buffer.from('FA'));
                    done();
                })
                .catch(done);
            stream.write('OKAYFAIL');
        });
        return it('should progress with new/partial chunk until maxHowMany', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const target = new Stream.PassThrough();
            parser
                .readByteFlow(3, target)
                .then(function () {
                    expect(target.read()).to.eql(Buffer.from('PIE'));
                    done();
                })
                .catch(done);
            const b1 = Buffer.from('P');
            const b2 = Buffer.from('I');
            const b3 = Buffer.from('ES');
            const b4 = Buffer.from('R');
            stream.write(b1);
            stream.write(b2);
            stream.write(b3);
            stream.write(b4);
        });
    });
    describe('readAscii(howMany)', function () {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readAscii(1);
            if (!bluebirdTest(promise))
                parser.end()
            done();
        });
        it('should read as many ascii characters as requested', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.readAscii(4).then((str) => {
                expect(str.length).to.equal(4);
                expect(str).to.equal('OKAY');
                done();
            });
            stream.write('OKAYFAIL');
        });
        return it('should reject with Parser.PrematureEOFError if stream ends before enough bytes can be read', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('FOO');
            parser.readAscii(7).catch(err => {
                expect(err).to.be.an.instanceOf(Parser.PrematureEOFError);
                done();
            });
            stream.end();
        });
    });
    describe('readValue()', () => {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readValue();
            if (!bluebirdTest(promise))
                parser.end()
            done();
        });
        it('should read a protocol value as a Buffer', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.readValue().then(function (value) {
                expect(value).to.be.an.instanceOf(Buffer);
                expect(value).to.have.length(4);
                expect(value.toString()).to.equal('001f');
                done();
            });
            stream.write('0004001f');
        });
        it('should return an empty value', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readValue()
            stream.write('0000');
            const value = await p;
            expect(value).to.be.an.instanceOf(Buffer);
            expect(value).to.have.length(0);
            return true;
        });
        return it('should reject with Parser.PrematureEOFError if stream ends before the value can be read', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readValue().catch(err => {
                expect(err).to.be.an.instanceOf(Parser.PrematureEOFError);
                expect(err as PrematureEOFError).to.be.an.instanceOf(Parser.PrematureEOFError);
                done();
            });
            stream.write('00ffabc');
            stream.end();
        });
    });
    describe('readError()', () => {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readError();
            if (!bluebirdTest(promise))
                parser.end()
            done();
        });
        it('should reject with Parser.FailError using the value', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.readError().catch(err => {
                expect(err).to.be.an.instanceOf(Parser.FailError);
                done();
            })
            stream.write('000cepic failure');
        });
        return it('should reject with Parser.PrematureEOFError if stream ends before the error can be read', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readError().catch(err => {
                expect(err).to.be.an.instanceOf(Parser.PrematureEOFError);
                done();
            });
            stream.write('000cepic')
            return stream.end();
        });
    });
    describe('searchLine(re)', function () {
        it('should return a cancellable Bluebird Promise', function (done) {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.searchLine(/foo/);
            if (!bluebirdTest(promise))
                parser.end()
            done();
        });
        it('should return the re.exec match of the matching line', function (done) {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.searchLine(/za(p)/).then(function (line) {
                expect(line[0]).to.equal('zap');
                expect(line[1]).to.equal('p');
                expect(line.input).to.equal('zip zap');
                done();
            });
            return stream.write('foo bar\nzip zap\npip pop\n');
        });
        return it('should reject with Parser.PrematureEOFError if stream ends before a line is found', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.searchLine(/nope/).catch(err => {
                expect(err).to.be.an.instanceOf(Parser.PrematureEOFError);
                done();
            })
            stream.write('foo bar');
            stream.end();
        });
    });
    describe('readLine()', function () {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readLine();
            if (!bluebirdTest(promise))
                parser.end()
            done();
        });
        it('should skip a line terminated by \\n', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('foo bar\nzip zap\npip pop');
            await parser.readLine()
            const buf = await parser.readBytes(7)
            expect(buf.toString()).to.equal('zip zap');
            return true
        });
        it('should return skipped line', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('foo bar\nzip zap\npip pop');
            const buf = await parser.readLine()
            expect(buf.toString()).to.equal('foo bar');
        });
        it('should strip trailing \\r', function (done) {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.readLine().then(function (buf) {
                expect(buf.toString()).to.equal('foo bar');
                done();
            });
            stream.write('foo bar\r\n');
        });
        return it('should reject with Parser.PrematureEOFError if stream ends before a line is found', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.readLine().catch(err => {
                expect(err).to.be.an.instanceOf(Parser.PrematureEOFError);
                done();
            });
            stream.write('foo bar');
            stream.end();
        });
    });
    describe('readUntil(code)', function () {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readUntil(0xa0);
            if (!bluebirdTest(promise))
                parser.end()
            done();
        });
        it('should return any characters before given value', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.readUntil('p'.charCodeAt(0)).then(function (buf) {
                expect(buf.toString()).to.equal('foo bar\nzi');
                done();
            });
            stream.write('foo bar\nzip zap\npip pop');
        });
        return it('should reject with Parser.PrematureEOFError if stream ends before a line is found', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.readUntil('z'.charCodeAt(0)).catch(err => {
                expect(err).to.be.an.instanceOf(Parser.PrematureEOFError);
                done();
            })
            stream.write('ho ho');
            stream.end();
        });
    });
    describe('raw()', function () {
        return it('should return the resumed raw stream', function () {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const raw = parser.raw();
            expect(raw).to.equal(stream);
            raw.on('data', function () {
                // done();
            });
            return raw.write('foo');
        });
    });
    return describe('unexpected(data, expected)', function () {
        return it('should reject with Parser.UnexpectedDataError', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            parser.unexpected('foo', "'bar' or end of stream").catch(e => {
                const err = e as UnexpectedDataError;
                expect(err).to.be.an.instanceOf(Parser.UnexpectedDataError);
                expect(err.message).to.equal("Unexpected 'foo', was expecting 'bar' or end of stream");
                expect(err.unexpected).to.equal('foo');
                expect(err.expected).to.equal("'bar' or end of stream");
                done();
            })
        });
    });
});

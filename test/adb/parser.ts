import Stream from 'node:stream';
import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import Parser, { PrematureEOFError, UnexpectedDataError } from '../../src/adb/parser';
import Util from '../../src/adb/util';

/**
 * 
 * @param promise native or bluebird Promise;
 */
function bPromiseTest(promise: any) {
    expect(promise).to.be.an.instanceOf(Promise);
    return false;
}

describe('Parser', () => {
    describe('end()', () => {
        it('should end the stream and consume all remaining data', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('F');
            stream.write('O');
            stream.write('O');
            return await parser.end();
        });
    });
    describe('readAll()', () => {
        it('should return a cancellable Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readAll();
            if (!bPromiseTest(promise))
                parser.end();
            done();
        });
        it('should read all remaining content until the stream ends', async () => {
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
        it("should resolve with an empty Buffer if the stream has already ended and there's nothing more to read", async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readAll();
            stream.end();
            const buf = await p;
            expect(buf.length).to.equal(0);
            return true;
        });
    });
    describe('readBytes(howMany)', () => {
        it('should return a cancellable Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readBytes(1);
            expect(promise).to.be.an.instanceOf(Promise);
            if (!bPromiseTest(promise))
                parser.end()
            done();
        });
        it('should read as many bytes as requested', async () => {
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
        it('should wait for enough data to appear', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readBytes(5);
            await Util.delay(50);
            stream.write('BYTES');
            const buf = await p;
            expect(buf.toString()).to.equal('BYTES');
            return true;
        });
        it('should keep data waiting even when nothing has been requested', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('FOO');
            await Util.delay(50);
            const buf = await parser.readBytes(2);
            expect(buf.length).to.equal(2);
            expect(buf.toString()).to.equal('FO');
            return true;
        });

        it('should reject with Parser.PrematureEOFError if stream ends before enough bytes can be read', (done) => {
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
            if (!bPromiseTest(promise))
                parser.end()
            done();
        });
        it('should read as many bytes as requested', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const target = new Stream.PassThrough();
            stream.write('OKAYFAIL');
            await parser.readByteFlow(4, target);
            expect(target.read()).to.eql(Buffer.from('OKAY'));
            await parser.readByteFlow(2, target);
            expect(target.read()).to.eql(Buffer.from('FA'));
        });
        it('should progress with new/partial chunk until maxHowMany', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const target = new Stream.PassThrough();
            stream.write(Buffer.from('P'));
            stream.write(Buffer.from('I'));
            stream.write(Buffer.from('ES'));
            stream.write(Buffer.from('R'));
            await parser.readByteFlow(3, target);
            expect(target.read()).to.eql(Buffer.from('PIE'));
        });
    });
    describe('readAscii(howMany)', () => {
        it('should return a cancellable Bluebird Promise', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readAscii(1);
            if (!bPromiseTest(promise))
                parser.end()
        });
        it('should read as many ascii characters as requested 1', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readAscii(4);
            stream.write('OKAYFAIL');
            const str = await p;
            expect(str.length).to.equal(4);
            expect(str).to.equal('OKAY');
            return true;
        });
        it('should read as many ascii characters as requested 2', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readAscii(4);
            stream.write('OKAYFAIL');
            stream.end();
            const str = await p;
            expect(str.length).to.equal(4);
            expect(str).to.equal('OKAY');
            return true;
        });
        it('should reject with Parser.PrematureEOFError if stream ends before enough bytes can be read', (done) => {
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
        it('should return a cancellable Bluebird Promise', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readValue();
            if (!bPromiseTest(promise))
                parser.end()
        });
        it('should read a protocol value as a Buffer', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('0004001f');
            const value = await parser.readValue()
            expect(value).to.be.an.instanceOf(Buffer);
            expect(value).to.have.length(4);
            expect(value.toString()).to.equal('001f');
        });
        it('should return an empty value', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const p = parser.readValue()
            stream.write('0000');
            const value = await p;
            expect(value).to.be.an.instanceOf(Buffer);
            expect(value).to.have.length(0);
        });
        it('should reject with Parser.PrematureEOFError if stream ends before the value can be read', (done) => {
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
            if (!bPromiseTest(promise))
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
        it('should reject with Parser.PrematureEOFError if stream ends before the error can be read', (done) => {
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
    describe('searchLine(re)', () => {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.searchLine(/foo/);
            if (!bPromiseTest(promise))
                parser.end()
            done();
        });
        it('should return the re.exec match of the matching line', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('foo bar\nzip zap\npip pop\n');
            const line = await parser.searchLine(/za(p)/)
            expect(line[0]).to.equal('zap');
            expect(line[1]).to.equal('p');
            expect(line.input).to.equal('zip zap');
            return true;
        });
        it('should reject with Parser.PrematureEOFError if stream ends before a line is found', (done) => {
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
    describe('readLine()', () => {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readLine();
            if (!bPromiseTest(promise))
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
        it('should strip trailing \\r', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('foo bar\r\n');
            const buf = await parser.readLine()
            expect(buf.toString()).to.equal('foo bar');
            return true;
        });
        it('should reject with Parser.PrematureEOFError if stream ends before a line is found', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('foo bar');
            stream.end();
            try {
                await parser.readLine()
                throw Error('should throw PrematureEOFError');
            } catch (err) {
                expect(err).to.be.an.instanceOf(Parser.PrematureEOFError);
            }
        });
    });
    describe('readUntil(code)', () => {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const promise = parser.readUntil(0xa0);
            if (!bPromiseTest(promise))
                parser.end()
            done();
        });
        it('should return any characters before given value', async () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            stream.write('foo bar\nzip zap\npip pop');
            const buf = await parser.readUntil('p'.charCodeAt(0))
            expect(buf.toString()).to.equal('foo bar\nzi');
        });
        it('should reject with Parser.PrematureEOFError if stream ends before a line is found', (done) => {
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
    describe('raw()', () => {
        it('should return the resumed raw stream', () => {
            const stream = new Stream.PassThrough();
            const parser = new Parser(stream);
            const raw = parser.raw();
            expect(raw).to.equal(stream);
            raw.on('data', () => {
                // done();
            });
            return raw.write('foo');
        });
    });
    return describe('unexpected(data, expected)', () => {
        it('should reject with Parser.UnexpectedDataError', (done) => {
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

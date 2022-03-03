import Stream from 'stream';
import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import util from '../../src/adb/util';

describe('util', () => {
    return describe('readAll(stream)', () => {
        it('should return a cancellable Bluebird Promise', (done) => {
            const stream = new Stream.PassThrough();
            const promise = util.readAll(stream);
            expect(promise).to.be.an.instanceOf(Promise);
            stream.end();
            done();
        });
        it('should read all remaining content until the stream ends', async () => {
            const stream = new Stream.PassThrough();
            stream.write('F');
            stream.write('O');
            stream.write('O');
            stream.end();
            const buf = await util.readAll(stream)
            expect(buf.length).to.equal(3);
            expect(buf.toString()).to.equal('FOO');
        });
    });
});

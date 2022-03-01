import Stream from 'stream';
import Bluebird from 'bluebird';
import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import util from '../../src/adb/util';

describe('util', function () {
    return describe('readAll(stream)', function () {
        it('should return a cancellable Bluebird Promise', function (done) {
            const stream = new Stream.PassThrough();
            const promise = util.readAll(stream);
            if ((promise as any).cancel) {
                expect(promise).to.be.an.instanceOf(Bluebird);
                (promise as Bluebird<unknown>).cancel();
                expect((promise as Bluebird<unknown>).isCancelled()).to.be.true;
            } else {
                expect(promise).to.be.an.instanceOf(Promise);
                stream.end();
            }
            done();
        });
        return it('should read all remaining content until the stream ends', function (done) {
            const stream = new Stream.PassThrough();
            util.readAll(stream).then(function (buf) {
                expect(buf.length).to.equal(3);
                expect(buf.toString()).to.equal('FOO');
                done();
            });
            stream.write('F');
            stream.write('O');
            stream.write('O');
            return stream.end();
        });
    });
});

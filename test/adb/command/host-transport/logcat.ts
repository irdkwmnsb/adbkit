import Stream from 'stream';
import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import Parser from '../../../../src/adb/parser';
import LogcatCommand from '../../../../src/adb/command/host-transport/logcat';

describe('LogcatCommand', () => {
    it("should send 'echo && logcat -B *:I'", function () {
        const conn = new MockConnection();
        const cmd = new LogcatCommand(conn);
        conn.getSocket().on('write', (chunk: Buffer) => {
            return expect(chunk.toString()).to.equal(
                Protocol.encodeData('shell:echo && logcat -B *:I 2>/dev/null').toString(),
            );
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute();
    });
    it("should send 'echo && logcat -c && logcat -B *:I' if options.clear is set", () => {
        const conn = new MockConnection();
        const cmd = new LogcatCommand(conn);
        conn.getSocket().on('write', function (chunk) {
            return expect(chunk.toString()).to.equal(
                Protocol.encodeData('shell:echo && logcat -c 2>/dev/null && logcat -B *:I 2>/dev/null').toString(),
            );
        });
        setImmediate(function () {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd
            .execute({
                clear: true,
            })
    });
    it('should resolve with the logcat stream', async function () {
        const conn = new MockConnection();
        const cmd = new LogcatCommand(conn);
        setImmediate(() => {
            return conn.getSocket().causeRead(Protocol.OKAY);
        });
        const stream = await cmd.execute();
        stream.end();
        expect(stream).to.be.an.instanceof(Stream.Readable);
    });
    it('should perform CRLF transformation by default', async function () {
        const conn = new MockConnection();
        const cmd = new LogcatCommand(conn);
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead('\r\nfoo\r\n');
            return conn.getSocket().causeEnd();
        });
        const stream = await cmd.execute();
        const out = await new Parser(stream).readAll();
        expect(out.toString()).to.equal('foo\n');
    });
    return it('should not perform CRLF transformation if not needed', async function () {
        const conn = new MockConnection();
        const cmd = new LogcatCommand(conn);
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead('\nfoo\r\n');
            return conn.getSocket().causeEnd();
        });
        const stream = await cmd.execute();
        const out = await new Parser(stream).readAll();
        expect(out.toString()).to.equal('foo\r\n');
    });
});

import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import Parser from '../../../../src/adb/parser';
import ShellCommand from '../../../../src/adb/command/host-transport/shell';

describe('ShellCommand', () => {
    it('should pass String commands as-is', () => {
        const conn = new MockConnection();
        const cmd = new ShellCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData("shell:foo 'bar").toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute("foo 'bar");
    });
    it('should escape Array commands', () => {
        const conn = new MockConnection();
        const cmd = new ShellCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData(`shell:'foo' ''"'"'bar'"'"'' '"'`).toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute(['foo', "'bar'", '"']);
    });
    it('should not escape numbers in arguments', () => {
        const conn = new MockConnection();
        const cmd = new ShellCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData(`shell:'foo' 67`).toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute(['foo', 67]);
    });
    return it('should reject with FailError on ADB failure (not command failure)', (done) => {
        const conn = new MockConnection();
        const cmd = new ShellCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData(`shell:'foo'`).toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.FAIL);
            conn.getSocket().causeRead(Protocol.encodeData('mystery'));
            return conn.getSocket().causeEnd();
        });
        cmd.execute(['foo']).then(() => {}, (err) => {
            expect(err).to.be.instanceOf(Parser.FailError);
            done();
        });
    });
});

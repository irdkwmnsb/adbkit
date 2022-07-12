import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import { AdbFailError } from '../../../../src/index';
import ShellCommand from '../../../../src/adb/command/host-transport/shell';

describe('ShellCommand', () => {
    it('should pass String commands as-is', () => {
        const conn = new MockConnection();
        const cmd = new ShellCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            expect(chunk.toString()).to.equal(Protocol.encodeData("shell:foo 'bar").toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeEnd();
        });
        return cmd.execute("foo 'bar");
    });
    it('should escape Array commands', () => {
        const conn = new MockConnection();
        const cmd = new ShellCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            expect(chunk.toString()).to.equal(Protocol.encodeData(`shell:'foo' ''"'"'bar'"'"'' '"'`).toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeEnd();
        });
        return cmd.execute(['foo', "'bar'", '"']);
    });
    it('should not escape numbers in arguments', () => {
        const conn = new MockConnection();
        const cmd = new ShellCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            expect(chunk.toString()).to.equal(Protocol.encodeData(`shell:'foo' 67`).toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeEnd();
        });
        return cmd.execute(['foo', 67]);
    });
    it('should reject with FailError on ADB failure (not command failure)', async () => {
        const conn = new MockConnection();
        const cmd = new ShellCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            expect(chunk.toString()).to.equal(Protocol.encodeData(`shell:'foo'`).toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.FAIL);
            conn.getSocket().causeRead(Protocol.encodeData('mystery'));
            conn.getSocket().causeEnd();
        });
        try {
            await cmd.execute(['foo']);
            throw Error('should throw AdbFailError');
        } catch(err) {
            expect(err).to.be.instanceOf(AdbFailError);
            expect(Object.prototype.toString.call(err)).to.be.eq('[object Error]')
        }
        return true;
    });
});

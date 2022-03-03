import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import ConnectCommand from '../../../../src/adb/command/host/connect';

describe('ConnectCommand', () => {
    it("should send 'host:connect:<host>:<port>'", () => {
        const conn = new MockConnection();
        const cmd = new ConnectCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData('host:connect:192.168.2.2:5555').toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead(Protocol.encodeData('connected to 192.168.2.2:5555'));
            return conn.getSocket().causeEnd();
        });
        return cmd.execute('192.168.2.2', 5555);
    });
    it('should resolve with the new device id if connected', async () => {
        const conn = new MockConnection();
        const cmd = new ConnectCommand(conn);
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead(Protocol.encodeData('connected to 192.168.2.2:5555'));
            return conn.getSocket().causeEnd();
        });
        const val = await cmd.execute('192.168.2.2', 5555);
        expect(val).to.be.equal('192.168.2.2:5555');
    });
    it('should resolve with the new device id if already connected', async () => {
        const conn = new MockConnection();
        const cmd = new ConnectCommand(conn);
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead(Protocol.encodeData('already connected to 192.168.2.2:5555'));
            return conn.getSocket().causeEnd();
        });
        const val = await cmd.execute('192.168.2.2', 5555);
        expect(val).to.be.equal('192.168.2.2:5555');
    });
    return it('should reject with error if unable to connect', async () => {
        const conn = new MockConnection();
        const cmd = new ConnectCommand(conn);
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead(Protocol.encodeData('unable to connect to 192.168.2.2:5555'));
            return conn.getSocket().causeEnd();
        });
        try {
            return await cmd.execute('192.168.2.2', 5555);
        } catch (err) {
            expect((err as Error).message).to.eql('unable to connect to 192.168.2.2:5555');
        }
    });
});

import Stream from 'stream';
import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import LogCommand from '../../../../src/adb/command/host-transport/log';

describe('LogCommand', () => {
    it("should send 'log:<log>'", () => {
        const conn = new MockConnection();
        const cmd = new LogCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData('log:main').toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute('main');
    });
    return it('should resolve with the log stream', async () => {
        const conn = new MockConnection();
        const cmd = new LogCommand(conn);
        setImmediate(() => {
            return conn.getSocket().causeRead(Protocol.OKAY);
        });
        const stream = await cmd.execute('main');
        stream.end();
        expect(stream).to.be.an.instanceof(Stream.Readable);
    });
});

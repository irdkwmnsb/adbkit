import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import PsCommand, { PsEntry } from '../../../../src/adb/command/host-transport/ps';

describe('psCommand', function () {
    it("should send 'ps'", function () {
        const conn = new MockConnection();
        const cmd = new PsCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData('shell:ps').toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute();
    });

    it("should send 'ps -f'", function () {
        const conn = new MockConnection();
        const cmd = new PsCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData('shell:ps -f').toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute('-f');
    });

    return it('should return a list of PsEntry', async (): Promise<void> => {
        const conn = new MockConnection();
        const cmd = new PsCommand(conn);
        setImmediate(function () {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead(`UID             PID   PPID C STIME TTY          TIME CMD
shell         30941   3021 0 15:35:50 pts/3 00:00:00 sh
shell         31350  30941 21 16:18:23 pts/3 00:00:00 ps -f`);
            return conn.getSocket().causeEnd();
        });
        const processList: Partial<PsEntry>[] = await cmd.execute();
        expect(processList).to.eql([
            { UID: 'shell', PID: '30941', PPID: '3021', C: '0', STIME: '15:35:50', TTY: 'pts/3', TIME: '00:00:00', CMD: 'sh' },
            { UID: 'shell', PID: '31350', PPID: '30941', C: '21', STIME: '16:18:23', TTY: 'pts/3', TIME: '00:00:00', CMD: 'ps -f' },
        ]);
    });
});

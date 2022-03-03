import Chai from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import PsCommand from '../../../../src/adb/command/host-transport/ps';

import { testParser, testTansport } from './commonTest';

describe('psCommand', function () {
    it("should send 'ps'", () => testTansport(PsCommand, 'shell:ps'));

    it("should send 'ps -f'", () => testTansport(PsCommand, 'shell:ps -f', ['-f']));

    it('should return a list of PsEntry', () => testParser(PsCommand,
        `UID             PID   PPID C STIME TTY          TIME CMD
shell         30941   3021 0 15:35:50 pts/3 00:00:00 sh
shell         31350  30941 21 16:18:23 pts/3 00:00:00 ps -f
`, [
        { UID: 'shell', PID: '30941', PPID: '3021', C: '0', STIME: '15:35:50', TTY: 'pts/3', TIME: '00:00:00', CMD: 'sh' },
        { UID: 'shell', PID: '31350', PPID: '30941', C: '21', STIME: '16:18:23', TTY: 'pts/3', TIME: '00:00:00', CMD: 'ps -f' },
    ]))

    it('should return a list of PsEntry -A', () => testParser(PsCommand, `USER            PID   PPID     VSZ    RSS WCHAN            ADDR S NAME
root              1      0 10826728  3728 0                   0 S init
root              2      0       0      0 0                   0 S [kthreadd]`, [
        { USER: 'root', PID: '1', PPID: '0', VSZ: '10826728', RSS: '3728', WCHAN: '0', ADDR: '0', S: 'S', NAME: 'init' },
        { USER: 'root', PID: '2', PPID: '0', VSZ: '0', RSS: '0', WCHAN: '0', ADDR: '0', S: 'S', NAME: '[kthreadd]' },
    ]));
});

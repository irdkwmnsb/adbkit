import Command from '../../command';
import { Duplex } from 'stream';
import WithToString from '../../../WithToString';

export default class ShellCommand extends Command<Duplex> {
  async execute(command: string | ArrayLike<WithToString>): Promise<Duplex> {
    if (Array.isArray(command)) {
      command = command.map(this.escape).join(' ');
    }
    this._send(`shell:${command}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        return this.parser.raw();
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

import Command from '../../command';
import { Duplex } from 'stream';
import WithToString from '../../../WithToString';

export default class ShellCommand extends Command<Duplex> {
  async execute(command: string | ArrayLike<WithToString>): Promise<Duplex> {
    if (Array.isArray(command)) {
      command = command.map(this.escape).join(' ');
    }
    this._send(`shell:${command}`);
    await this.readOKAY();
    return this.parser.raw();
  }
}

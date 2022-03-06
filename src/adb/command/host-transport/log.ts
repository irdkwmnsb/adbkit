import Command from '../../command';
import { Duplex } from 'stream';

export default class LogCommand extends Command<Duplex> {
  async execute(name: string): Promise<Duplex> {
    this._send(`log:${name}`);
    await this.readOKAY();
    return this.parser.raw();
  }
}

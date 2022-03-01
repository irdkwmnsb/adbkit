import Protocol from '../../protocol';
import Command from '../../command';
import { Duplex } from 'stream';

export default class LogCommand extends Command<Duplex> {
  async execute(name: string): Promise<Duplex> {
    this._send(`log:${name}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        return this.parser.raw();
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

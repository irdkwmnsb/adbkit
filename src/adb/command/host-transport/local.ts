import Command from '../../command';
import { Duplex } from 'stream';

export default class LocalCommand extends Command<Duplex> {
  async execute(path: string): Promise<Duplex> {
    this._send(/:/.test(path) ? path : `localfilesystem:${path}`);
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

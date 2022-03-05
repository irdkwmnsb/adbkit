import Command from '../../command';
import { Duplex } from 'stream';

export default class TcpCommand extends Command<Duplex> {
  async execute(port: number, host?: string): Promise<Duplex> {
    this._send(`tcp:${port}` + (host ? `:${host}` : ''));
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

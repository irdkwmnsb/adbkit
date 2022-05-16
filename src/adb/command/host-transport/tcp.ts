import Command from '../../command';
import { Duplex } from 'node:stream';

export default class TcpCommand extends Command<Duplex> {
  async execute(port: number, host?: string): Promise<Duplex> {
    await this._send(`tcp:${port}` + (host ? `:${host}` : ''));
    await this.readOKAY();
    return this.parser.raw();
  }
}

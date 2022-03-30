import Command from '../../command';
import { Duplex } from 'node:stream';

export default class LocalCommand extends Command<Duplex> {
  async execute(path: string): Promise<Duplex> {
    this._send(/:/.test(path) ? path : `localfilesystem:${path}`);
    await this.readOKAY();
    return this.parser.raw();
  }
}

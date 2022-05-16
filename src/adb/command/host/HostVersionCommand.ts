import Command from '../../command';
import Protocol from '../../protocol';

export default class HostVersionCommand extends Command<number> {
  async execute(): Promise<number> {
    await this._send('host:version');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        const value = await this.parser.readValue();
        return this._parseVersion(value.toString());
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this._parseVersion(reply);
    }
  }

  _parseVersion(version: string): number {
    return parseInt(version, 16);
  }
}

import Command from '../../command';

export default class HostVersionCommand extends Command<number> {
  async execute(): Promise<number> {
    this._send('host:version');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        const value = await this.parser.readValue();
        return this._parseVersion(value.toString());
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this._parseVersion(reply);
    }
  }

  _parseVersion(version: string): number {
    return parseInt(version, 16);
  }
}

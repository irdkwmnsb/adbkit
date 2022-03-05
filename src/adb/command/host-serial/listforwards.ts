import Command from '../../command';
import Forward from '../../../Forward';

export default class ListForwardsCommand extends Command<Forward[]> {
  async execute(serial: string): Promise<Forward[]> {
    this._send(`host-serial:${serial}:list-forward`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        const value = await this.parser.readValue()
        return this._parseForwards(value);
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }

  private _parseForwards(value: Buffer): Forward[] {
    return value
      .toString()
      .split('\n')
      .filter((e) => e)
      .map((forward) => {
        const [serial, local, remote] = forward.split(/\s+/);
        return { serial, local, remote };
      });
  }
}

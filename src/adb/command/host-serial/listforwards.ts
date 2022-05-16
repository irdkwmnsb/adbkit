import Command from '../../command';
import Forward from '../../../models/Forward';

export default class ListForwardsCommand extends Command<Forward[]> {
  async execute(serial: string): Promise<Forward[]> {
    await this._send(`host-serial:${serial}:list-forward`);
    await this.readOKAY();
    const value = await this.parser.readValue()
    return this._parseForwards(value);
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

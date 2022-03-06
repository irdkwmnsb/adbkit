import Command from '../../command';
import Reverse from '../../../Reverse';

export default class ListReversesCommand extends Command<Reverse[]> {
  async execute(): Promise<Reverse[]> {
    this._send('reverse:list-forward');
    await this.readOKAY();
    const value = await this.parser.readValue()
    return this._parseReverses(value);
  }

  private _parseReverses(value: Buffer): Reverse[] {
    const reverses: Reverse[] = [];
    const ref = value.toString().split('\n');
    for (let i = 0, len = ref.length; i < len; i++) {
      const reverse = ref[i];
      if (reverse) {
        const [, remote, local] = reverse.split(/\s+/);
        reverses.push({ remote, local });
      }
    }
    return reverses;
  }
}

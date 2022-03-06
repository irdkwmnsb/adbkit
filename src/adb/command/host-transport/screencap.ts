import LineTransform from '../../linetransform';
import Parser from '../../parser';
import Command from '../../command';
import { Duplex } from 'stream';

export default class ScreencapCommand extends Command<Duplex> {
  async execute(): Promise<Duplex> {
    this._send('shell:echo && screencap -p 2>/dev/null');
    await this.readOKAY();
    let transform = new LineTransform();
    try {
      const chunk = await this.parser.readBytes(1);
      transform = new LineTransform({ autoDetect: true });
      transform.write(chunk);
      return this.parser.raw().pipe(transform);
    } catch (err) {
      if (err instanceof Parser.PrematureEOFError) {
        throw Error('No support for the screencap command');
      }
      throw err;
    }
  }
}

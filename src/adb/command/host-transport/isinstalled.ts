import Parser from '../../parser';
import Command from '../../command';

export default class IsInstalledCommand extends Command<boolean> {
  async execute(pkg: string): Promise<boolean> {
    this._send(`shell:pm path ${pkg} 2>/dev/null`);
    await this.readOKAY();
    try {
      const reply = await this.parser.readAscii(8);
      switch (reply) {
        case 'package:':
          return true;
        default:
          return this.parser.unexpected(reply, "'package:'");
      }
    } catch (err) {
      if (err instanceof Parser.PrematureEOFError) {
        return false;
      }
      throw err;
    }
  }
}

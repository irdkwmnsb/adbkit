import Protocol from '../../protocol';
import Command from '../../command';

export default class InstallCommand extends Command<boolean> {
  async execute(apk: string): Promise<boolean> {
    this._send(`shell:pm install -r ${this._escapeCompat(apk)}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        try {
          const match = await this.parser.searchLine(/^(Success|Failure \[(.*?)\])$/);
          if (match[1] === 'Success') {
            return true;
          } else {
            const code = match[2];
            const err = new Error(`${apk} could not be installed [${code}]`);
            (err as Error & {code: string}).code = code;
            throw err;
          }
        } finally {
          // Consume all remaining content to "naturally" close the
          // connection.
          this.parser.readAll();
        }
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

import Command from '../../command';

export default class InstallCommand extends Command<boolean> {
  async execute(apk: string): Promise<boolean> {
    this._send(`shell:pm install -r ${this.escapeCompat(apk)}`);
    await this.readOKAY();
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
  }
}

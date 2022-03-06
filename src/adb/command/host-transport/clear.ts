import Command from '../../command';

export default class ClearCommand extends Command<boolean> {
  async execute(pkg: string): Promise<boolean> {
    this._send(`shell:pm clear ${pkg}`);
    await this.readOKAY();
    try {
      const result = await this.parser.searchLine(/^(Success|Failed)$/)
      switch (result[0]) {
        case 'Success':
          return true;
        case 'Failed':
          // Unfortunately, the command may stall at this point and we
          // have to kill the connection.
          throw new Error(`Package '${pkg}' could not be cleared`);
      }
      return false;
    } finally {
      this.parser.end()
    }
  }
}

import Command from '../../command';

export default class ClearCommand extends Command<boolean> {
  async execute(pkg: string): Promise<boolean> {
    this._send(`shell:pm clear ${pkg}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
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
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

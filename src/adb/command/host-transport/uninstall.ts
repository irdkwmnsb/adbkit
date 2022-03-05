import Command from '../../command';

export default class UninstallCommand extends Command<boolean> {
  async execute(pkg: string): Promise<boolean> {
    this._send(`shell:pm uninstall ${pkg}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        try {
          const match = await this.parser.searchLine(/^(Success|Failure.*|.*Unknown package:.*)$/);
          if (match[1] === 'Success') {
            return true;
          } else {
            // Either way, the package was uninstalled or doesn't exist,
            // which is good enough for us.
            return true;
          }
        } finally {
          this.parser.readAll();
        }
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

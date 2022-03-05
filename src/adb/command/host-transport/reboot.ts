import Command from '../../command';

export default class RebootCommand extends Command<true> {
  async execute(): Promise<true> {
    this._send('reboot:');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        await this.parser.readAll();
        return true;
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

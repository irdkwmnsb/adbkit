import Command from '../../command';

export default class ForwardCommand extends Command<boolean> {
  async execute(serial: string, local: string, remote: string): Promise<boolean> {
    this._send(`host-serial:${serial}:forward:${local};${remote}`);
    let reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        reply = await this.parser.readAscii(4);
        switch (reply) {
          case this.protocol.OKAY:
            return true;
          case this.protocol.FAIL:
            return this.parser.readError();
          default:
            return this.parser.unexpected(reply, 'OKAY or FAIL');
        }
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

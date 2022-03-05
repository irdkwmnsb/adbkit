import Command from '../../command';

export default class ReverseCommand extends Command<true> {
  async execute(remote: string, local: string): Promise<true> {
    this._send(`reverse:forward:${remote};${local}`);
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

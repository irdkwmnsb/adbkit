import Protocol from '../../protocol';
import Command from '../../command';

export default class ReverseCommand extends Command<true> {
  async execute(remote: string, local: string): Promise<true> {
    this._send(`reverse:forward:${remote};${local}`);
    let reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        reply = await this.parser.readAscii(4);
        switch (reply) {
          case Protocol.OKAY:
            return true;
          case Protocol.FAIL:
            return this.parser.readError();
          default:
            return this.parser.unexpected(reply, 'OKAY or FAIL');
        }
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

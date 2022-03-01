import Protocol from '../../protocol';
import Command from '../../command';

export default class ReverseCommand extends Command<boolean> {
  async execute(remote: string, local: string): Promise<boolean> {
    this._send(`reverse:forward:${remote};${local}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        return this.parser.readAscii(4).then((reply_1) => {
          switch (reply_1) {
            case Protocol.OKAY:
              return true;
            case Protocol.FAIL:
              return this.parser.readError();
            default:
              return this.parser.unexpected(reply_1, 'OKAY or FAIL');
          }
        });
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

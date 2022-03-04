import Protocol from '../../protocol';
import Command from '../../command';

export default class RemountCommand extends Command<true> {
  async execute(): Promise<true> {
    this._send('remount:');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        return true;
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

import Protocol from '../../protocol';
import Sync from '../../sync';
import Command from '../../command';

export default class SyncCommand extends Command<Sync> {
  async execute(): Promise<Sync> {
    this._send('sync:');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        return new Sync(this.connection);
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

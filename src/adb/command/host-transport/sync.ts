import Sync from '../../sync';
import Command from '../../command';

export default class SyncCommand extends Command<Sync> {
  async execute(): Promise<Sync> {
    await this._send('sync:');
    await this.readOKAY();
    return new Sync(this.connection);
  }
}

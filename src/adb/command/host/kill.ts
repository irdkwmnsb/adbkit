import Command from '../../command';

export default class HostKillCommand extends Command<boolean> {
  async execute(): Promise<boolean> {
    this._send('host:kill');
    await this.readOKAY();
    return true;
  }
}

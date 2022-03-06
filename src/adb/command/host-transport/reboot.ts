import Command from '../../command';

export default class RebootCommand extends Command<true> {
  async execute(): Promise<true> {
    this._send('reboot:');
    await this.readOKAY();
    await this.parser.readAll();
    return true;
  }
}

import Command from '../../command';

export type RebootType = 'bootloader' | 'recovery' | 'sideload' | 'fastboot';

export default class RebootCommand extends Command<true> {
  async execute(type?: RebootType): Promise<true> {
    if (type)
      await this._send(`reboot:${type}`);
    else
      await this._send('reboot:');
    await this.readOKAY();
    await this.parser.readAll();
    return true;
  }
}

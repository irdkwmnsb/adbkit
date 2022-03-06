import Command from '../../command';

const RE_OK = /restarting in/;

export default class UsbCommand extends Command<true> {
  async execute(): Promise<true> {
    this._send('usb:');
    await this.readOKAY();
    const value = await this.parser.readAll();
    if (RE_OK.test(value.toString())) {
      return true;
    } else {
      throw new Error(value.toString().trim());
    }
  }
}

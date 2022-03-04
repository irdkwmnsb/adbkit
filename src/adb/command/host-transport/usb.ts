import Protocol from '../../protocol';
import Command from '../../command';

const RE_OK = /restarting in/;

export default class UsbCommand extends Command<true> {
  async execute(): Promise<true> {
    this._send('usb:');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        const value = await this.parser.readAll();
        if (RE_OK.test(value.toString())) {
          return true;
        } else {
          throw new Error(value.toString().trim());
        }
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

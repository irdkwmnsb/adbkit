import Protocol from '../../protocol';
import Command from '../../command';

export default class WaitForDeviceCommand extends Command<string> {
  async execute(serial: string): Promise<string> {
    this._send(`host-serial:${serial}:wait-for-any-device`);
    let reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        reply = await this.parser.readAscii(4)
        switch (reply) {
          case Protocol.OKAY:
            return serial;
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

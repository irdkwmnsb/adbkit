import Command from '../../command';

export default class WaitForDeviceCommand extends Command<string> {
  async execute(serial: string): Promise<string> {
    this._send(`host-serial:${serial}:wait-for-any-device`);
    let reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        reply = await this.parser.readAscii(4)
        switch (reply) {
          case this.protocol.OKAY:
            return serial;
          case this.protocol.FAIL:
            return this.parser.readError();
          default:
            return this.parser.unexpected(reply, 'OKAY or FAIL');
        }
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

import Command from '../../command';

// Possible replies:
// "unable to connect to 192.168.2.2:5555"
// "connected to 192.168.2.2:5555"
// "already connected to 192.168.2.2:5555"
const RE_OK = /connected to|already connected/;

export default class HostConnectCommand extends Command<string> {
  async execute(host: string, port: number): Promise<string> {
    this._send(`host:connect:${host}:${port}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        const value = await this.parser.readValue();
        if (RE_OK.test(value.toString())) {
          return `${host}:${port}`;
        } else {
          throw new Error(value.toString());
        }
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

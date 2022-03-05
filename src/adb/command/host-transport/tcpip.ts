import Command from '../../command';

const RE_OK = /restarting in/;

export default class TcpIpCommand extends Command<number> {
  async execute(port: number): Promise<number> {
    this._send(`tcpip:${port}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        const value = await this.parser.readAll()
        if (RE_OK.test(value.toString())) {
          return port;
        } else {
          throw new Error(value.toString().trim());
        }
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

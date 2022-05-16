import Command from '../../command';

// Possible replies:
// "unable to connect to 192.168.2.2:5555"
// "connected to 192.168.2.2:5555"
// "already connected to 192.168.2.2:5555"
const RE_OK = /connected to|already connected/;

export default class HostConnectCommand extends Command<string> {
  async execute(host: string, port: number): Promise<string> {
    await this._send(`host:connect:${host}:${port}`);
    await this.readOKAY();
    const value = await this.parser.readValue();
    if (RE_OK.test(value.toString())) {
      return `${host}:${port}`;
    } else {
      throw new Error(value.toString());
    }
  }
}

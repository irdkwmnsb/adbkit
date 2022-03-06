import Command from '../../command';

// Possible replies:
// "No such device 192.168.2.2:5555"
// ""
const RE_OK = /^$/;

export default class HostDisconnectCommand extends Command<string> {
  async execute(host: string, port: number): Promise<string> {
    this._send(`host:disconnect:${host}:${port}`);
    await this.readOKAY();
    const value = await this.parser.readValue()
    if (RE_OK.test(value.toString())) {
      return `${host}:${port}`;
    } else {
      throw new Error(value.toString());
    }
  }
}

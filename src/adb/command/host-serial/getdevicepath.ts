import Command from '../../command';

export default class GetDevicePathCommand extends Command<string> {
  async execute(serial: string): Promise<string> {
    this._send(`host-serial:${serial}:get-devpath`);
    await this.readOKAY();
    const value = this.parser.readValue()
    return value.toString();
  }
}

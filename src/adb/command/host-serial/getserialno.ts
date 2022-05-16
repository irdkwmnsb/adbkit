import Command from '../../command';

export default class GetSerialNoCommand extends Command<string> {
  async execute(serial: string): Promise<string> {
    await this._send(`host-serial:${serial}:get-serialno`);
    await this.readOKAY();
    const value = await this.parser.readValue();
    return value.toString();
  }
}

import Command from '../../command';

export default class GetStateCommand extends Command<string> {
  async execute(serial: string): Promise<string> {
    this._send(`host-serial:${serial}:get-state`);
    await this.readOKAY();
    const value = await this.parser.readValue();
    return value.toString();
  }
}

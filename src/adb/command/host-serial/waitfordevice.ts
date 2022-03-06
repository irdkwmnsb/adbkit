import Command from '../../command';

export default class WaitForDeviceCommand extends Command<string> {
  async execute(serial: string): Promise<string> {
    this._send(`host-serial:${serial}:wait-for-any-device`);
    await this.readOKAY();
    await this.readOKAY();
    return serial;
  }
}

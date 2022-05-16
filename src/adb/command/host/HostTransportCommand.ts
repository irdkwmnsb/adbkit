import Command from '../../command';

export default class HostTransportCommand extends Command<boolean> {
  async execute(serial: string): Promise<boolean> {
    await this._send(`host:transport:${serial}`);
    await this.readOKAY();
    return true;
  }
}

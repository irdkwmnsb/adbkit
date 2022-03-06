import Command from '../../command';

export default class ForwardCommand extends Command<boolean> {
  async execute(serial: string, local: string, remote: string): Promise<boolean> {
    this._send(`host-serial:${serial}:forward:${local};${remote}`);
    await this.readOKAY();
    await this.readOKAY();
    return true;
  }
}

import Command from '../../command';

export default class ReverseCommand extends Command<true> {
  async execute(remote: string, local: string): Promise<true> {
    this._send(`reverse:forward:${remote};${local}`);
    await this.readOKAY();
    await this.readOKAY();
    return true;
  }
}

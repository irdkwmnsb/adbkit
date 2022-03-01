import Command from '../../command';
import Protocol from '../../protocol';

export default class GetStateCommand extends Command<string> {
  async execute(serial: string): Promise<string> {
    this._send(`host-serial:${serial}:get-state`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        const value = await this.parser.readValue();
        return value.toString();
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

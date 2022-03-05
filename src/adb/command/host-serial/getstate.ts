import Command from '../../command';

export default class GetStateCommand extends Command<string> {
  async execute(serial: string): Promise<string> {
    this._send(`host-serial:${serial}:get-state`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        const value = await this.parser.readValue();
        return value.toString();
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

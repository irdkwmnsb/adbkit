import Command from '../../command';
import { KnownServices } from './servicesList';

export default class ServiceCallCommand extends Command<boolean> {
  async execute(serviceName: KnownServices | string): Promise<boolean> {
    this._send(`shell:service check ${serviceName} 2>/dev/null`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        const data = await this.parser.readAll()
        return this._parse(data.toString());
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }

  private _parse(value: string): boolean {
    if (value.includes('not found'))
      return false;
    if (value.includes('found'))
      return true;
    return false;
  }
}

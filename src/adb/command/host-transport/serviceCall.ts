import Command from '../../command';
import { KnownServices } from './servicesList';

export default class ServiceListCommand extends Command<Buffer> {
  async execute(serviceName: KnownServices | string, code: number | string): Promise<Buffer> {
    this._send(`shell:service call ${serviceName} ${code} 2>/dev/null`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        const data = await this.parser.readAll();
        return this._parse(data.toString());
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }

  private _parse(value: string): Buffer {
    const RE_HEX = /0x[0-9a-f]{8}: ([0-9a-f]{8}) ([0-9a-f ]{8})? ([0-9a-f ]{8}) ([0-9a-f ]{8}) '.{16}'/gm;
    const data: Buffer[] = [];

    for (;;) {
      const match = RE_HEX.exec(value);
      if (match) {
        for (let i = 1; i < 4; i++) {
          const chunk = match[i].trim();
          if (!chunk)
            break;
          data.push(Buffer.from(chunk, 'hex'));
        }
      } else {
        break;
      }
    }
    if (data.length === 0) {
      const m2 = value.match(/Parcel\(Error: 0x([0-9a-f]+) "(.+)"\)/);
      if (m2) {
        throw new Error(`0x${m2[1]} ${m2[2]}`);
      }
    }
    return Buffer.concat(data);
  }
}

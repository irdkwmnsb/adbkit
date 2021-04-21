import Command from '../../command';
import Protocol from '../../protocol';
import Bluebird from 'bluebird';
import { KnownServices } from './servicesList';

export default class ServiceCallCommand extends Command<boolean> {
  execute(serviceName: KnownServices | string): Bluebird<boolean> {
    this._send(`shell:service check ${serviceName} 2>/dev/null`);
    return this.parser.readAscii(4).then((reply) => {
      switch (reply) {
        case Protocol.OKAY:
          return this.parser.readAll().then((data) => {
            return this._parse(data.toString());
          });
        case Protocol.FAIL:
          return this.parser.readError();
        default:
          return this.parser.unexpected(reply, 'OKAY or FAIL');
      }
    });
  }

  private _parse(value: string): boolean {
    if (value.includes('not found'))
      return false;
    if (value.includes('found'))
      return true;
    return false;
  }
}

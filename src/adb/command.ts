import Connection from './connection';
import Protocol from './protocol';
import Parser from './parser';
import d from 'debug';
import WithToString from '../WithToString';

const debug = d('adb:command');
const RE_SQUOT = /'/g;
const RE_ESCAPE = /([$`\\!"])/g;

export default abstract class Command<T> {
  public parser: Parser;
  public protocol: Protocol;
  public connection: Connection;
  public options: {sudo: boolean};

  constructor(connection: Connection, options?: {sudo?: boolean}) {
    this.connection = connection;
    this.parser = this.connection.parser;
    this.protocol = Protocol;
    this.options = {...options || {}, ...{sudo: false}};
  }

  // FIXME(intentional any): not "any" will break it all
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public abstract execute(...args: any[]): Promise<T>;

  public _send(data: string | Buffer): Promise<void> {
    const encoded = Protocol.encodeData(data);
    if (debug.enabled) {
      debug(`Send '${encoded}'`);
    }
    return this.connection.write(encoded);
  }

  public escape(arg: number | WithToString): number | string {
    switch (typeof arg) {
      case 'number':
        return arg;
      default:
        return `'${arg.toString().replace(RE_SQUOT, "'\"'\"'")}'`;
    }
  }

  public escapeCompat(arg: number | WithToString): number | string {
    switch (typeof arg) {
      case 'number':
        return arg;
      default:
        return `"${arg.toString().replace(RE_ESCAPE, '\\$1')}"`;
    }
  }
  /**
   * called once per command, only affect shell based command.
   */
  protected sendCommand(data: string): Promise<void> {
    if (this.options.sudo && data.startsWith('shell:')) {
      data = data.replace('shell:', 'shell:su -c ');
    }
    return this._send(data);
  }

}

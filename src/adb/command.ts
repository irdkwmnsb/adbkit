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
  public readonly options: { sudo: boolean };
  private lastCmd: string;

  get lastCommand(): string {
    return this.lastCmd || '';
  }

  constructor(public connection: Connection, options = {} as { sudo?: boolean }) {
    this.parser = this.connection.parser;
    this.options = { sudo: false, ...options };
  }

  // FIXME(intentional any): not "any" will break it all
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public abstract execute(...args: any[]): Promise<T>;

  /**
   * encode message and send it to ADB socket
   * @returns byte write count
   */
  public _send(data: string): Promise<number> {
    this.parser.lastMessage = data;
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
   * @returns sent data
   */
  protected async sendCommand(data: string): Promise<string> {
    if (this.options.sudo && data.startsWith('shell:')) {
      data = data.replace('shell:', 'shell:su -c ');
    }
    this.lastCmd = data;
    await this._send(data);
    return data;
  }

  /**
   * most common action: read for Okey
   */
  protected async readOKAY(): Promise<void> {
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        return;
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

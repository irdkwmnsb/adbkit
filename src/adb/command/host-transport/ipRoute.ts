import Command from '../../command';
import Protocol from '../../protocol';
import pc from 'picocolors'
import { ShellExecError } from '.';

export default class IpRouteCommand extends Command<Array<IpRouteEntry>> {
  async execute(...args: string[]): Promise<Array<IpRouteEntry>> {
    super.sendCommand(['shell:ip', 'route', ...args].join(' ')); //  2>/dev/null
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        const data = await this.parser.readAll()
        return this.parseIpRoute(data.toString());
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }

  private parseIpRoute(value: string): Array<IpRouteEntry> {
    if (value.startsWith('Error: ')) {
      throw new ShellExecError(value.substring(7));
    }
    // const value = await this.readValue();

    const lines: string[] = value.split(/[\r\n]+/g).filter(a => a);
    const result: IpRouteEntry[] = [];
    for (const line of lines) {
      const entry: IpRouteEntry = new IpRouteEntry();
      const words = line.split(' ').filter(a => a);
      if (ValidTypesSet.has(words[0] as ValidTypesT)) {
        entry.type = words.shift() as ValidTypesT;
      }

      if (words[0] === 'default') {
        entry.dest = words.shift();
      } else if (words[0].match(/^[0-9.]+(\/\d+)?$/)) {
        // IP v4
        entry.dest = words.shift();
      } else if (words[0].match(/^[0-9a-f:]+(\/\d+)?$/)) {
        // IP v6
        entry.dest = words.shift();
      }

      while (words.length) {
        const next = words.shift();
        const value = words.shift();
        switch (next) {
          case 'dev':
          case 'via':
          case 'src':
          case 'tos':
          case 'mtu':
          case 'expires':
            entry[next] = value;
            break;
          case 'metric':
          case 'hoplimit':
            entry[next] = Number(value);
            break;
          case 'pref':
          case 'scope':
          case 'table':
          case 'proto':
            if (value.match(/^\d+$/))
              entry[next] = Number(value);
            else
              (entry[next] as string) = value;
            break;
          default:
            throw Error(`Failed to parse line:\n ${line}\n token: ${pc.yellow(next)} in ip route response, Fix me in ipRoute.ts`);
        }
      }
      result.push(entry);
    }
    return result;
  }
}

const ValidTypes = ['anycast', 'unicast', 'local', 'broadcast', 'multicast', 'throw', 'unreachable', 'prohibit', 'blackhole', 'nat'] as const;
type ValidTypesT = typeof ValidTypes[number];
const ValidTypesSet = new Set<ValidTypesT>(ValidTypes);
type CIDR = string;

/**
 * unix route model
 * ROUTE := NODE_SPEC [ INFO_SPEC ]
 *
 * NODE_SPEC := [ TYPE ] PREFIX [ tos TOS ] [ table TABLE_ID ] [ proto RTPROTO ] [ scope SCOPE ] [ metric METRIC ]
 */
export class IpRouteEntry {
  type?: ValidTypesT;
  dest?: CIDR;
  // prefix?: CIDR;
  via?: string;
  dev?: string;
  mtu?: string;
  // is a number is canned a user
  // is a mapped table name is called as root
  table?: string | number;
  // route expiration time ex: 63352sec
  expires?: string;
  // RTPROTO 
  proto?: 'kernel' | 'boot' | 'static' | number;
  // 
  scope?: 'host' | 'link' | 'global' | number;
  tos?: string;
  src?: string;
  pref?: 'medium' | number;
  metric?: number;
  /**
   * hoplimit [0-255]
   */
  hoplimit?: number;

  public toString(): string {
    const out: string[] = [];
    for (const field of ['type', 'dest'] as const) {
      if (this[field])
        out.push(this[field]);
    }
    for (const field of ['via', 'dev', 'table', 'expires', 'proto', 'scope', 'tos', 'src', 'metric', 'pref', 'mtu'] as const) {
      if (this[field] || this[field] === 0) {
        out.push(field);
        out.push(String(this[field]));
      }
    }
    return out.join(' ')
  }

  public clone(): IpRouteEntry {
    const cp = new IpRouteEntry();
    for (const key of Object.keys(this))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cp as any)[key] = (this as any)[key];
    return cp;
  }

}

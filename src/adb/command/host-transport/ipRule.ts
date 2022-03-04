import Command from '../../command';
import Protocol from '../../protocol';
import pc from 'picocolors'

/**
 * Usage: ip rule { add | del } SELECTOR ACTION
 *        ip rule { flush | save | restore }
 *        ip rule [ list [ SELECTOR ]]
 * SELECTOR := [ not ] [ from PREFIX ] [ to PREFIX ] [ tos TOS ] [ fwmark FWMARK[/MASK] ]
 *             [ iif STRING ] [ oif STRING ] [ pref NUMBER ] [ l3mdev ]
 *             [ uidrange NUMBER-NUMBER ]
 * ACTION := [ table TABLE_ID ]
 *           [ nat ADDRESS ]
 *           [ realms [SRCREALM/]DSTREALM ]
 *           [ goto NUMBER ]
 *           SUPPRESSOR
 * SUPPRESSOR := [ suppress_prefixlength NUMBER ]
 *               [ suppress_ifgroup DEVGROUP ]
 * TABLE_ID := [ local | main | default | NUMBER ]
 */
export default class IpRuleCommand extends Command<Array<IpRuleEntry>> {
  async execute(...args: string[]): Promise<Array<IpRuleEntry>> {
    this.sendCommand(['shell:ip', 'rule', ...args].join(' '));
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        const data = await this.parser.readAll()
        return this.parseIpRule(data.toString());
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }

  private parseIpRule(value: string): Array<IpRuleEntry> {
    const lines: string[] = value.split(/[\r\n]+/g).filter(a => a);
    const result: IpRuleEntry[] = [];
    for (const line of lines) {
      const words = line.split(/\s+/g).filter(a => a);
      const id = words.shift();
      const entry = new IpRuleEntry(id);
      while (words.length) {
        const next = words.shift();
        switch (next) {
          case 'from':
          case 'fwmark':
          case 'lookup':
          case 'iif':
          case 'oif':
          case 'uidrange':
            entry[next] = words.shift();
            break;
          case 'unreachable':
            entry[next] = true;
            break;
          default:
            throw Error(`Failed to parse line:\n ${line}\n token: ${pc.yellow(next)} in ip route response, Fix me in ipRule.ts`);
        }
      }
      result.push(entry);
    }
    return result;
  }
}

/**
 * unix route model
 * ROUTE := NODE_SPEC [ INFO_SPEC ]
 *
 * NODE_SPEC := [ TYPE ] PREFIX [ tos TOS ] [ table TABLE_ID ] [ proto RTPROTO ] [ scope SCOPE ] [ metric METRIC ]
 */
export class IpRuleEntry {
  constructor(id: string) {
    this.id = Number(id.replace(':', ''))
  }

  // route priority
  id: number;

  from?: string;
  fwmark?: string;
  iif?: string;
  oif?: string;
  uidrange?: string;
  lookup?: string;
  unreachable?: boolean;

  toStirng(): string {
    const opt: string[] = [];
    for (const field of ['from', 'fwmark', 'iif', 'oif', 'uidrange', 'lookup'] as const) {
      if (this[field]) {
        opt.push(field);
        opt.push(this[field]);
      }
    }
    if (this.unreachable)
      opt.push('unreachable');
    return `${this.id}:\t${opt.join(' ')}`;
  }

}

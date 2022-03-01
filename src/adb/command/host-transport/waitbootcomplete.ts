import Protocol from '../../protocol';
import Command from '../../command';

export default class WaitBootCompleteCommand extends Command<boolean> {
  async execute(): Promise<boolean> {
    this._send('shell:while getprop sys.boot_completed 2>/dev/null; do sleep 1; done');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        try {
          await this.parser.searchLine(/^1$/);
        } finally {
          this.parser.end()
        }
        return true;
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

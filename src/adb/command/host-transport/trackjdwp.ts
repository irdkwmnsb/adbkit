import Protocol from '../../protocol';
import Command from '../../command';
import JdwpTracker from '../../jdwptracker';

export default class TrackJdwpCommand extends Command<JdwpTracker> {
  async execute(): Promise<JdwpTracker> {
    this._send('track-jdwp');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        return new JdwpTracker(this);
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

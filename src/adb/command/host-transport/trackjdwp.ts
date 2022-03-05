import Command from '../../command';
import JdwpTracker from '../../jdwptracker';

export default class TrackJdwpCommand extends Command<JdwpTracker> {
  async execute(): Promise<JdwpTracker> {
    this._send('track-jdwp');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        return new JdwpTracker(this);
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

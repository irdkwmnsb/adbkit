import Command from '../../command';
import JdwpTracker from '../../jdwptracker';

export default class TrackJdwpCommand extends Command<JdwpTracker> {
  async execute(): Promise<JdwpTracker> {
    await this._send('track-jdwp');
    await this.readOKAY();
    return new JdwpTracker(this);
  }
}

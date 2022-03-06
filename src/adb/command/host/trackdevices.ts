import Tracker from '../../tracker';
import HostDevicesCommand from './devices';

export default class HostTrackDevicesCommand extends HostDevicesCommand {
  // FIXME(intentional any): correct return value: `Promise<Tracker>`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(): Promise<any> {
    this._send('host:track-devices');
    await this.readOKAY();
    return new Tracker(this);
  }
}

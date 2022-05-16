import Device from '../../../models/Device';
import Command from '../../command';
import Tracker from '../../tracker';
import DeviceClient from '../../DeviceClient';

export default class HostTrackDevicesCommand extends Command<Tracker> {
  async execute(): Promise<Tracker> {
    await this._send('host:track-devices');
    await this.readOKAY();
    return new Tracker(this);
  }

  // copy from HostDevicesCommand in devices.ts
  public async _readDevices(): Promise<Device[]> {
    const value = await this.parser.readValue();
    return this._parseDevices(value);
  }

  _parseDevices(value: Buffer): Device[] {
    return value
      .toString('ascii')
      .split('\n')
      .filter(e => e)
      .map((line: string) => {
        const [id, type] = line.split('\t');
        return {
          id,
          type: type as 'emulator' | 'device' | 'offline',
          getClient: () => new DeviceClient(this.connection.parent, id),
        };
      });
  }
}

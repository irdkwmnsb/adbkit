import Command from '../../command';
import Device, { DeviceType } from '../../../models/Device';
import DeviceClient from '../../DeviceClient';
import Tracker from '../../tracker';

export default class HostTrackDevicesCommand extends Command<Tracker> {
  async execute(): Promise<Tracker> {
    await this._send('host:track-devices');
    await this.readOKAY();
    return new Tracker(this);
  }

  // copy from HostDevicesCommand.ts
  public async _readDevices(): Promise<Device[]> {
    const value = await this.parser.readValue();
    return this._parseDevices(value);
  }

  _parseDevices(value: Buffer): Device[] {
    return value
      .toString('ascii')
      .split('\n')
      .filter((e) => e)
      .map((line: string) => {
        const [id, type] = line.split(/\s+/);
        return {
          id,
          type: type as DeviceType,
          getClient: () => new DeviceClient(this.connection.parent, id),
        };
      });
  }
}

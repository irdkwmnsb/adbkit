import Command from '../../command';
import Device from '../../../models/Device';
import DeviceClient from '../../DeviceClient';

export default class HostDevicesCommand extends Command<Device[]> {
  async execute(): Promise<Device[]> {
    this._send('host:devices');
    await this.readOKAY();
    return this._readDevices();
  }

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

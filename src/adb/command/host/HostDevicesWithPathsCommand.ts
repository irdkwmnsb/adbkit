import Command from '../../command';
import DeviceWithPath from '../../../models/DeviceWithPath';
import DeviceClient from '../../DeviceClient';

export default class HostDevicesWithPathsCommand extends Command<DeviceWithPath[]> {
  async execute(): Promise<DeviceWithPath[]> {
    await this._send('host:devices-l');
    await this.readOKAY();
    return this._readDevices();
  }

  public async _readDevices(): Promise<DeviceWithPath[]> {
    const value = await this.parser.readValue();
    return this._parseDevices(value);
  }

  private _parseDevices(value: Buffer): DeviceWithPath[] {
    return value
      .toString('ascii')
      .split('\n')
      .filter((e) => e)
      .map((line) => {
        // For some reason, the columns are separated by spaces instead of tabs
        const [id, type, path, product, model, device, transportId] = line.split(/\s+/);
        return {
          id,
          type: type as 'emulator' | 'device' | 'offline',
          path,
          product,
          model,
          device,
          transportId,
          getClient: () => new DeviceClient(this.connection.parent, id),
        };
      });
  }
}

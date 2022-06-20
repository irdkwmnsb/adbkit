import Command from '../../command';
import DeviceWithPath from '../../../models/DeviceWithPath';
import DeviceClient from '../../DeviceClient';
import { DeviceType } from '../../../models/Device';


export default class HostDevicesWithPathsCommand extends Command<DeviceWithPath[]> {
  async execute(): Promise<DeviceWithPath[]> {
    await this._send('host:devices-l');
    await this.readOKAY();
    return this._readDevices();
  }


  public async _readDevices(): Promise<DeviceWithPath[]> {
    const value = await this.parser.readValue('ascii');
    return this._parseDevices(value);
  }

  private _parseDevices(value: string): DeviceWithPath[] {
    return value
      .split('\n')
      .filter((e) => e)
      .map((line: string) => {
        // eslint-disable-next-line prefer-const
        let [id, type, path, product, model, device, transportId] = line.split(/\s+/);
        model = model.replace('model:', '');
        product = product.replace('product:', '');
        transportId = transportId.replace('transport_id:', '');
        return {
          id,
          type: type as DeviceType,
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

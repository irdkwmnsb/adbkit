import { DeviceType } from '../../../models/Device';
import Command from '../../command';

export default class GetStateCommand extends Command<string> {
  async execute(serial: string): Promise<DeviceType> {
    await this._send(`host-serial:${serial}:get-state`);
    await this.readOKAY();
    return this.parser.readValue('utf8') as Promise<DeviceType>;
  }
}

import { DeviceClient } from "..";

export type DeviceType = 'emulator' | 'device' | 'offline';

export default interface Device {
  id: string;
  type: DeviceType;
  getClient: () => DeviceClient;
}

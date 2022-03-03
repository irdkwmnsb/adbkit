import { DeviceClient } from ".";

export default interface Device {
  id: string;
  type: 'emulator' | 'device' | 'offline';
  getClient: () => DeviceClient;
}

import Command from '../../command';
import Protocol from '../../protocol';
import Device from '../../../Device';

export default class HostDevicesCommand extends Command<Device[]> {
  async execute(): Promise<Device[]> {
    this._send('host:devices');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.OKAY:
        return this._readDevices();
      case Protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }

  public _readDevices(): Promise<Device[]> {
    return this.parser.readValue().then(this._parseDevices);
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
        };
      });
  }
}

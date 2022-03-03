import { EventEmitter } from 'events';
import Connection from './connection';

import {
  HostVersionCommand,
  HostConnectCommand,
  HostDevicesCommand,
  HostDevicesWithPathsCommand,
  HostDisconnectCommand,
  HostTrackDevicesCommand,
  HostKillCommand,
} from './command/host';
import TcpUsbServer from './tcpusb/server';
import Device from '../Device';
import { ClientOptions } from '../ClientOptions';
import SocketOptions from '../SocketOptions';
import Tracker from './tracker';
import DeviceWithPath from '../DeviceWithPath';
import DeviceClient from './DeviceClient';

export default class Client extends EventEmitter {
  public readonly options: ClientOptions;
  public readonly host: string;
  public readonly port: number | string;
  public readonly bin: string;

  constructor({ host = '127.0.0.1', port = 5037, bin = 'adb' }: ClientOptions = { port: 5037 }) {
    super();
    this.host = host;
    this.port = port;
    this.bin = bin;
    this.options = { port, bin };
  }

  public createTcpUsbBridge(serial: string, options: SocketOptions): TcpUsbServer {
    return new TcpUsbServer(this, serial, options);
  }

  public connection(): Promise<Connection> {
    const connection = new Connection(this);
    // Reemit unhandled connection errors, so they can be handled externally.
    // If not handled at all, these will crash node.
    connection.on('error', (err) => this.emit('error', err));
    return connection.connect();
  }

  public async version(): Promise<number> {
    const conn = await this.connection();
    return await new HostVersionCommand(conn).execute();
  }

  public async connect(host: string, port = 5555): Promise<string> {
    if (host.indexOf(':') !== -1) {
      const [h, portString] = host.split(':', 2);
      host = h;
      const parsed = parseInt(portString, 10);
      if (!isNaN(parsed)) {
        port = parsed;
      }
    }
    const conn = await this.connection();
    return await new HostConnectCommand(conn).execute(host, port);
  }

  public async disconnect(host: string, port = 5555): Promise<DeviceClient> {
    if (host.indexOf(':') !== -1) {
      const [h, portString] = host.split(':', 2);
      host = h;
      const parsed = parseInt(portString, 10);
      if (!isNaN(parsed)) {
        port = parsed;
      }
    }
    const conn = await this.connection();
    const deviceId = await new HostDisconnectCommand(conn).execute(host, port);
    return new DeviceClient(this, deviceId);
  }

  /**
   * list connected device
   * @returns list of device serial number + types
   */
  public async listDevices(): Promise<Device[]> {
    const conn = await this.connection();
    return await new HostDevicesCommand(conn).execute();
  }

  public async listDevicesWithPaths(): Promise<DeviceWithPath[]> {
    const conn = await this.connection();
    return await new HostDevicesWithPathsCommand(conn).execute();
  }

  public async trackDevices(): Promise<Tracker> {
    const conn = await this.connection();
    return await new HostTrackDevicesCommand(conn).execute();
  }

  public async kill(): Promise<boolean> {
    const conn = await this.connection();
    return await new HostKillCommand(conn).execute();
  }

  public getDevice(serial: string): DeviceClient {
    return new DeviceClient(this, serial);
  }
}

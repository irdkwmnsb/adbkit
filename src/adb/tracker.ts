import Parser from './parser';
import EventEmitter from 'node:events';
import Device from '../models/Device';
import HostDevicesCommand from './command/host/HostDevicesCommand';
import HostDevicesWithPathsCommand from './command/host/HostDevicesWithPathsCommand';
import TrackerChangeSet from '../models/TrackerChangeSet';
import { HostTrackDevicesCommand } from './command/host';

/**
 * enforce EventEmitter typing
 */
interface IEmissions {
  end: () => void
  add: (device: Device) => void
  offline: (device: Device) => void
  remove: (device: Device) => void
  change: (newDevice: Device, oldDevice: Device) => void
  changeSet: (changeSet: TrackerChangeSet) => void
  error: (data: Error) => void
}

/**
 * emit event on Device status chage
 */
export default class Tracker extends EventEmitter {
  private deviceMap = new Map<string, Device>();
  private stoped = false;

  constructor(private readonly command: HostDevicesCommand | HostDevicesWithPathsCommand | HostTrackDevicesCommand) {
    super();
    this.readloop();
  }

  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.on(event, listener)
  public off = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.off(event, listener)
  public once = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.once(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => super.emit(event, ...args)

  private async readloop(): Promise<void> {
    try {
      for (; ;) {
        const list = await this.command._readDevices();
        this.update(list);
      }
    } catch (err) {
      if (!this.stoped) {
        this.emit('error', err as Error)
        if (err instanceof Parser.PrematureEOFError) {
          throw new Error('Connection closed');
        }
      }
    } finally {
      this.command.parser.end().catch(() => {/* drop error */ });
      this.emit('end');
    }
  }
  /**
   * should be private but need public for testing
   * @param newList updated Device list
   * @returns this
   */
  public update(newList: Device[]): this {
    const changeSet: TrackerChangeSet = {
      removed: [],
      changed: [],
      added: [],
    };
    const newMap = new Map<string, Device>();
    for (const device of newList) {
      newMap.set(device.id, device);
      const oldDevice = this.deviceMap.get(device.id);
      if (oldDevice) {
        this.deviceMap.delete(device.id);
        if (oldDevice.type !== device.type) {
          changeSet.changed.push(device);
          this.emit('change', device, oldDevice);
          if (device.type === 'offline')
            this.emit('offline', device);
        }
      } else {
        changeSet.added.push(device);
        this.emit('add', device);
      }
    }
    for (const [, deleted] of this.deviceMap) {
      changeSet.removed.push(deleted);
      this.emit('remove', deleted);
    }
    this.emit('changeSet', changeSet);
    this.deviceMap = newMap;
    return this;
  }

  public end(): void {
    this.stoped = true;
    this.command.parser.end().catch(() => {/* drop error */ });
  }
}

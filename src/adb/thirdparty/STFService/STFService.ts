// import path from "node:path";
import fs from "node:fs";
import net from 'node:net';
import Debug from 'debug';
import DeviceClient from "../../DeviceClient";
import { Utils } from "../../..";
import PromiseDuplex from "promise-duplex";
import { EventEmitter } from "node:stream";
import * as ProtoBuf from 'protobufjs';
import PromiseSocket from "promise-socket";
import ThirdUtils from "../ThirdUtils";

const version = '2.4.9';

export enum MessageType {
  DO_IDENTIFY = 1,
  DO_KEYEVENT = 2,
  DO_TYPE = 3,
  DO_WAKE = 4,
  DO_ADD_ACCOUNT_MENU = 24,
  DO_REMOVE_ACCOUNT = 20,
  GET_ACCOUNTS = 26,
  GET_BROWSERS = 5,
  GET_CLIPBOARD = 6,
  GET_DISPLAY = 19,
  GET_PROPERTIES = 7,
  GET_RINGER_MODE = 27,
  GET_SD_STATUS = 25,
  GET_VERSION = 8,
  GET_WIFI_STATUS = 23,
  GET_BLUETOOTH_STATUS = 29,
  GET_ROOT_STATUS = 31,
  SET_CLIPBOARD = 9,
  SET_KEYGUARD_STATE = 10,
  SET_RINGER_MODE = 21,
  SET_ROTATION = 12,
  SET_WAKE_LOCK = 11,
  SET_WIFI_ENABLED = 22,
  SET_BLUETOOTH_ENABLED = 30,
  SET_MASTER_MUTE = 28,
  EVENT_AIRPLANE_MODE = 13,
  EVENT_BATTERY = 14,
  EVENT_CONNECTIVITY = 15,
  EVENT_PHONE_STATE = 16,
  EVENT_ROTATION = 17,
  EVENT_BROWSER_PACKAGE = 18
}

export interface STFAirplaneModeEvent {
  enabled: boolean;
}

export interface STFBatteryEvent {
  status: string;
  health: string;
  source: string;
  level: number;
  scale: number;
  temp: number;
  voltage: number;
}

export interface STFBrowserApp {
  name: string;
  component: string;
  selected: boolean;
  system: boolean;
}

export interface STFBrowserApp {
  name: string;
  component: string;
  selected: boolean;
  system: boolean;
}

export interface STFBrowserPackageEvent {
  selected: boolean;
  apps: STFBrowserApp;
}

export interface STFConnectivityEvent {
  connected: boolean;
  type?: string;
  subtype?: string;
  failover?: boolean;
  roaming?: boolean;
}

export interface STFPhoneStateEvent {
  state: string;
  manual: boolean;
  operator?: string;
}

export interface STFRotationEvent {
  rotation: number;
}

export interface STFServiceEventEmitter {
  on(event: 'airplaneMode', listener: (data: STFAirplaneModeEvent) => void): this; // EVENT_AIRPLANE_MODE
  on(event: 'battery', listener: (data: STFBatteryEvent) => void): this; // EVENT_BATTERY
  on(event: 'connectivity', listener: (data: STFConnectivityEvent) => void): this; // EVENT_CONNECTIVITY
  on(event: 'phoneState', listener: (data: STFPhoneStateEvent) => void): this; // EVENT_PHONE_STATE
  on(event: 'rotation', listener: (data: STFRotationEvent) => void): this; // EVENT_ROTATION
  on(event: 'browerPackage', listener: (data: STFBrowserPackageEvent) => void): this; // BROWSER_PACKAGE
  on(event: 'error', listener: (error: Error) => void): this;

  off(event: 'airplaneMode', listener: (data: STFAirplaneModeEvent) => void): this;
  off(event: 'battery', listener: (data: STFBatteryEvent) => void): this;
  off(event: 'connectivity', listener: (data: STFConnectivityEvent) => void): this;
  off(event: 'phoneState', listener: (data: STFPhoneStateEvent) => void): this;
  off(event: 'rotation', listener: (data: STFRotationEvent) => void): this;
  off(event: 'browerPackage', listener: (data: STFBrowserPackageEvent) => void): this;
  off(event: 'error', listener: (error: Error) => void): this;

  once(event: 'airplaneMode', listener: (data: STFAirplaneModeEvent) => void): this;
  once(event: 'battery', listener: (data: STFBatteryEvent) => void): this;
  once(event: 'connectivity', listener: (data: STFConnectivityEvent) => void): this;
  once(event: 'phoneState', listener: (data: STFPhoneStateEvent) => void): this;
  once(event: 'rotation', listener: (data: STFRotationEvent) => void): this;
  once(event: 'browerPackage', listener: (data: STFBrowserPackageEvent) => void): this;
  once(event: 'error', listener: (error: Error) => void): this;

  emit(event: 'airplaneMode', data: STFAirplaneModeEvent): boolean; // EVENT_AIRPLANE_MODE
  emit(event: 'battery', data: STFBatteryEvent): boolean; // EVENT_BATTERY
  emit(event: 'connectivity', data: STFConnectivityEvent): boolean; // EVENT_CONNECTIVITY
  emit(event: 'phoneState', data: STFPhoneStateEvent): boolean; // EVENT_PHONE_STATE
  emit(event: 'rotation', data: STFRotationEvent): boolean; // EVENT_ROTATION
  emit(event: 'browerPackage', data: STFBrowserPackageEvent): boolean; // BROWSER_PACKAGE
  emit(event: 'error', error: Error): boolean;
}

export interface STFServiceOptions {
  /**
   * local port use for STFService
   */
  servicePort: number,
  /**
   * local port use for STFService
   */
  agentPort: number,
}

const debug = Debug('STFService');
const PKG = 'jp.co.cyberagent.stf';

let wireP: Promise<ProtoBuf.Root> | null;

export default class STFService extends EventEmitter implements STFServiceEventEmitter {
  private config: STFServiceOptions;
  private servicesSocket: PromiseSocket<net.Socket> | undefined;
  private agentSocket: PromiseSocket<net.Socket> | undefined;

  constructor(private client: DeviceClient, config = {} as Partial<STFServiceOptions>) {
    super();
    this.config = {
      agentPort: 1090,
      servicePort: 1100,
      ...config,
    }
  }

  private async getPath(): Promise<string> {

    let resp = await this.client.execOut(`pm path ${PKG}`, 'utf8');
    resp = resp.trim();
    if (resp.startsWith('package:'))
      return resp.substring(8);
    return '';
  }

  private async installApk(): Promise<void> {
    const apk = ThirdUtils.getResource(`STFService_${version}.apk`);
    try {
      await fs.promises.stat(apk);
    } catch (e) {
      throw Error(`can not find APK bin/STFService_${version}.apk`);
    }
    await this.client.install(apk);
  }

  async start(): Promise<void> {

    if (!wireP) {
      const proto = ThirdUtils.getResource('wireService.proto');
      wireP = ProtoBuf.load(proto);
    }
    await wireP;

    let setupPath = await this.getPath();
    if (!setupPath) {
      await this.installApk();
      setupPath = await this.getPath();
    }

    const currentVersion = await this.client.execOut(`export CLASSPATH='${setupPath}';exec app_process /system/bin '${PKG}.Agent' --version 2>/dev/null`, 'utf8');
    if (currentVersion.trim() !== version) {
      await this.client.uninstall(PKG);
      await this.installApk();
      setupPath = await this.getPath();
    }
    // console.log('current version is: ', currentVersion.trim());
    
    const props = await this.client.getProperties();
    const sdkLevel = parseInt(props['ro.build.version.sdk']);
    const action = `${PKG}.ACTION_START`;
    const component = `${PKG}/.Service`;
    const startServiceCmd = (sdkLevel < 26) ? 'startservice' : 'start-foreground-service'
    const duplex = new PromiseDuplex(await this.client.shell(`am ${startServiceCmd} --user 0 -a '${action}' -n '${component}'`));
    await Utils.waitforReadable(duplex);
    const msg = await (duplex.setEncoding('utf8').readAll() as Promise<string>);
    if (msg.includes('Error')) {
      throw Error(msg.trim())
    }
    // console.log(msg.trim());

    try {
      await this.client.forward(`tcp:${this.config.servicePort}`, 'localabstract:stfservice');
    } catch (e) {
      debug(`Impossible to forward port ${this.config.servicePort}:`, e);
      throw e;
    }

    try {
      await this.client.forward(`tcp:${this.config.agentPort}`, 'localabstract:stfagent');
    } catch (e) {
      debug(`Impossible to forward port ${this.config.agentPort}:`, e);
      throw e;
    }

    this.agentSocket = new PromiseSocket(new net.Socket());
    this.servicesSocket = new PromiseSocket(new net.Socket());

    try {
      await this.agentSocket.connect(this.config.agentPort, '127.0.0.1')
    } catch (e) {
      debug(`Impossible to connect agent Socket "127.0.0.1:${this.config.agentPort}":`, e);
      throw e;
    }

    try {
      await this.servicesSocket.connect(this.config.servicePort, '127.0.0.1')
    } catch (e) {
      debug(`Impossible to connect agent Socket "127.0.0.1:${this.config.servicePort}":`, e);
      throw e;
    }

    void this.startServiceStream().catch((e) => { console.log('Service failed', e); this.stop() });
    void this.startAgentStream().catch((e) => { console.log('Agent failed', e); this.stop() });
  }

  private async startServiceStream() {
    const root = await wireP;
    const typeEnvelope = root.lookupType('Envelope');
    const typeAirplaneModeEvent = root.lookupType('AirplaneModeEvent');
    const typeRotationEvent = root.lookupType('RotationEvent');
    const typeBatteryEvent = root.lookupType('BatteryEvent');
    const typeConnEvent = root.lookupType('ConnectivityEvent');
    const typePhoneEvent = root.lookupType('PhoneStateEvent');
    const typeBrowerPackage = root.lookupType('BrowserPackageEvent');

    let chunk: Buffer | null = null;
    for (; ;) {
      await Utils.waitforReadable(this.servicesSocket);
      const next = await this.servicesSocket.read() as Buffer;
      if (!next)
        continue;
      if (chunk) {
        chunk = Buffer.concat([chunk, next]);
      } else {
        chunk = next;
      }
      if (chunk) {
        if (chunk.length == 1)
          continue;
        // console.log('servicesSocket RCV: ', chunk.length);
        try {
          const eventObj = typeEnvelope.decodeDelimited(chunk) as unknown as {type: MessageType, message: Buffer};
          const enmitter = this as STFServiceEventEmitter;
          switch (eventObj.type) {
            case MessageType.EVENT_AIRPLANE_MODE:
              const airEvent = typeAirplaneModeEvent.decode(eventObj.message) as unknown as STFAirplaneModeEvent;
              enmitter.emit("airplaneMode", airEvent);
              break;
            case MessageType.EVENT_BATTERY:
              const batEvent = typeBatteryEvent.decode(eventObj.message) as unknown as STFBatteryEvent;
              enmitter.emit("battery", batEvent);
              break;
            case MessageType.EVENT_CONNECTIVITY:
              const conEvent = typeConnEvent.decode(eventObj.message) as unknown as STFConnectivityEvent;
              enmitter.emit("connectivity", conEvent);
              break;
            case MessageType.EVENT_ROTATION:
              const rotEvent = typeRotationEvent.decode(eventObj.message) as unknown as STFRotationEvent;
              enmitter.emit("rotation", rotEvent);
              break;
            case MessageType.EVENT_PHONE_STATE:
              const phoneEvent = typePhoneEvent.decode(eventObj.message) as unknown as STFPhoneStateEvent;
              enmitter.emit("phoneState", phoneEvent);
              break;
            case MessageType.EVENT_BROWSER_PACKAGE:
              const BrEvent = typeBrowerPackage.decode(eventObj.message) as unknown as STFBrowserPackageEvent;
              enmitter.emit("browerPackage", BrEvent);
              break;
            default:
              console.error('missing event Type:', eventObj.type);
          }
          chunk = null;
        } catch (e) {
          console.error(chunk.toString('hex'));
          console.error(e);
        }
      }
      await Utils.delay(0);
    }
  }

  public async getAccounts(type?: string): Promise<void> {
    const root = await wireP;
    type = 'AAAAAAAAAAAAAAAAAAAAAAA'
    const typePhoneEvent = root.lookupType('GetAccountsRequest');
    const typeEnvelope = root.lookupType('Envelope');

    const req = typePhoneEvent.create({type});
    const id = Math.floor(Math.random() * 0xFFFFFF)
    const env = typeEnvelope.create({id, type: MessageType.GET_ACCOUNTS, message: typePhoneEvent.encode(req).finish()})
    const buf = Buffer.from(typeEnvelope.encodeDelimited(env).finish());
    console.log(buf.toString('hex'))
    console.log(env.toJSON())
    this.servicesSocket.write(buf);
    // this.agentSocket.write(buf);
  }


  private async startAgentStream() {
    // const root = await wireP;
    for (; ;) {
      await Utils.waitforReadable(this.agentSocket);
      const chunk = await this.agentSocket.read() as Buffer;
      if (chunk) {
        console.log('agentSocket RCV: ', chunk.length);
        console.log(chunk.toString('hex'))
      }
      await Utils.delay(0);
    }
  }

  public stop() {
    if (this.servicesSocket) {
      this.servicesSocket.destroy();
      this.servicesSocket = undefined;
    }
    if (this.agentSocket) {
      this.agentSocket.destroy();
      this.agentSocket = undefined;
    }
    //this.minicapServer.destroy();
  }
}

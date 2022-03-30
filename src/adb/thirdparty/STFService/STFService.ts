// import path from "node:path";
import fs from "node:fs";
import net from 'node:net';
import Debug from 'debug';
import DeviceClient from "../../DeviceClient";
import { Utils } from "../../..";
import PromiseDuplex from "promise-duplex";
import { EventEmitter } from "node:stream";
import PromiseSocket from "promise-socket";
import ThirdUtils from "../ThirdUtils";
import * as STF from "./STFServiceModel";
import STFProtoBuf from "./STFProtoBuf";

const version = '2.4.9';

interface IEmissions {
  airplaneMode: (data: STF.AirplaneModeEvent) => void
  battery: (data: STF.BatteryEvent) => void
  connectivity: (data: STF.ConnectivityEvent) => void
  phoneState: (data: STF.PhoneStateEvent) => void
  rotation: (data: STF.RotationEvent) => void
  browerPackage: (data: STF.BrowserPackageEvent) => void
  error: (data: Error) => void
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

export default class STFService extends EventEmitter {
  private config: STFServiceOptions;
  private servicesSocket: PromiseSocket<net.Socket> | undefined;
  private agentSocket: PromiseSocket<net.Socket> | undefined;
  private proto!: STFProtoBuf;

  constructor(private client: DeviceClient, config = {} as Partial<STFServiceOptions>) {
    super();
    this.config = {
      agentPort: 1090,
      servicePort: 1100,
      ...config,
    }
  }

  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.on(event, listener)
  public off = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.off(event, listener)
  public once = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.once(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => super.emit(event, ...args)

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
    this.proto = await STFProtoBuf.get();

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

  private handleResponse(id: number, result: any) {
    const resolv = this.responseHook[id];
    if (resolv) {
      delete this.responseHook[id];
      resolv(result);
    }
  }

  private async startServiceStream() {
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
          const eventObj = this.proto.readEnvelope(chunk);
          const message = eventObj.message;
          // const enmitter = this as STFServiceEventEmitter;
          switch (eventObj.type) {
            case STF.MessageType.EVENT_AIRPLANE_MODE:
              this.emit("airplaneMode", this.proto.read.AirplaneModeEvent(message));
              break;
            case STF.MessageType.EVENT_BATTERY:
              this.emit("battery", this.proto.read.BatteryEvent(message));
              break;
            case STF.MessageType.EVENT_CONNECTIVITY:
              this.emit("connectivity", this.proto.read.ConnectivityEvent(message));
              break;
            case STF.MessageType.EVENT_ROTATION:
              this.emit("rotation", this.proto.read.RotationEvent(message));
              break;
            case STF.MessageType.EVENT_PHONE_STATE:
              this.emit("phoneState", this.proto.read.PhoneStateEvent(message));
              break;
            case STF.MessageType.EVENT_BROWSER_PACKAGE:
              this.emit("browerPackage", this.proto.read.BrowserPackageEvent(message));
              break;
            case STF.MessageType.GET_ACCOUNTS:
              this.handleResponse(eventObj.id, this.proto.read.GetAccountsResponse(message));
              break;
            case STF.MessageType.GET_BLUETOOTH_STATUS:
              this.handleResponse(eventObj.id, this.proto.read.GetBluetoothStatusResponse(message));
              break;

            case STF.MessageType.GET_BROWSERS:
              this.handleResponse(eventObj.id, this.proto.read.GetBrowsersResponse(message));
              break;
            case STF.MessageType.GET_CLIPBOARD:
              this.handleResponse(eventObj.id, this.proto.read.GetBluetoothStatusResponse(message));
              break;
            case STF.MessageType.GET_DISPLAY:
              this.handleResponse(eventObj.id, this.proto.read.GetBluetoothStatusResponse(message));
              break;
            case STF.MessageType.GET_PROPERTIES:
              this.handleResponse(eventObj.id, this.proto.read.GetBluetoothStatusResponse(message));
              break;

            default:
              console.error('STFService not implemented Type:', eventObj.type);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private responseHook: { [key: number]: (response: any) => void } = {}
  private reqCnt = 1;

  private pushEnvelop<T>(envelope: STF.Envelope): Promise<T> {
    // const id = Math.floor(Math.random() * 0xFFFFFF)
    const id = (this.reqCnt + 1) | 0xFFFFFF;
    this.reqCnt = id;
    envelope.id = this.reqCnt;
    let pReject: (error: Error) => void;
    const promise = new Promise<T>((resolve, reject) => {
      pReject = reject;
      this.responseHook[id] = resolve;
    });
    const buf = this.proto.write.Envelope(envelope)
    this.servicesSocket.write(buf);

    const timeout = Utils.delay(15000).then(() => {
      if (this.responseHook[id]) {
        delete this.responseHook[id];
        pReject(Error('timeout'));
      }
    });
    Promise.race([promise, timeout]);
    return promise;
  }

  public async getAccounts(type?: string): Promise<STF.GetAccountsResponse> {
    const message = this.proto.write.GetAccountsRequest({ type });
    return this.pushEnvelop<STF.GetAccountsResponse>({ type: STF.MessageType.GET_ACCOUNTS, message })
  }

  public async GetBrowsers(): Promise<STF.GetBrowsersResponse> {
    const message = this.proto.write.GetBrowsersRequest();
    return this.pushEnvelop<STF.GetBrowsersResponse>({ type: STF.MessageType.GET_BROWSERS, message })
  }

  public async GetClipboard(type: STF.ClipboardType): Promise<STF.GetClipboardResponse> {
    const message = this.proto.write.GetClipboardRequest({ type });
    return this.pushEnvelop<STF.GetClipboardResponse>({ type: STF.MessageType.GET_CLIPBOARD, message })
  }

  public async GetDisplay(id: number): Promise<STF.GetDisplayResponse> {
    const message = this.proto.write.GetDisplayRequest({ id });
    return this.pushEnvelop<STF.GetDisplayResponse>({ type: STF.MessageType.GET_DISPLAY, message })
  }

  public async GetProperties(properties: string[]): Promise<STF.GetPropertiesResponse> {
    const message = this.proto.write.GetPropertiesRequest({ properties });
    return this.pushEnvelop<STF.GetPropertiesResponse>({ type: STF.MessageType.GET_PROPERTIES, message })
  }

  public async GetRingerMode(): Promise<STF.GetRingerModeResponse> {
    const message = this.proto.write.GetRingerModeRequest();
    return this.pushEnvelop<STF.GetRingerModeResponse>({ type: STF.MessageType.GET_RINGER_MODE, message })
  }

  public async GetSdStatus(): Promise<STF.GetSdStatusResponse> {
    const message = this.proto.write.GetSdStatusRequest();
    return this.pushEnvelop<STF.GetSdStatusResponse>({ type: STF.MessageType.GET_SD_STATUS, message })
  }

  public async GetVersion(): Promise<STF.GetVersionResponse> {
    const message = this.proto.write.GetVersionRequest();
    return this.pushEnvelop<STF.GetVersionResponse>({ type: STF.MessageType.GET_VERSION, message })
  }

  public async GetWifiStatus(): Promise<STF.GetWifiStatusResponse> {
    const message = this.proto.write.GetWifiStatusRequest();
    return this.pushEnvelop<STF.GetWifiStatusResponse>({ type: STF.MessageType.GET_WIFI_STATUS, message })
  }

  public async GetBluetoothStatus(): Promise<STF.GetBluetoothStatusResponse> {
    const message = this.proto.write.GetBluetoothStatusRequest();
    return this.pushEnvelop<STF.GetBluetoothStatusResponse>({ type: STF.MessageType.GET_BLUETOOTH_STATUS, message })
  }

  public async GetRootStatus(): Promise<STF.GetRootStatusResponse> {
    const message = this.proto.write.GetRootStatusRequest();
    return this.pushEnvelop<STF.GetRootStatusResponse>({ type: STF.MessageType.GET_ROOT_STATUS, message })
  }

  public async SetClipboard(req: STF.SetClipboardRequest): Promise<STF.SetClipboardResponse> {
    const message = this.proto.write.SetClipboardRequest(req);
    return this.pushEnvelop<STF.SetClipboardResponse>({ type: STF.MessageType.SET_CLIPBOARD, message })
  }

  public async SetKeyguardState(req: STF.SetKeyguardStateRequest): Promise<STF.SetKeyguardStateResponse> {
    const message = this.proto.write.SetKeyguardStateRequest(req);
    return this.pushEnvelop<STF.SetKeyguardStateResponse>({ type: STF.MessageType.SET_KEYGUARD_STATE, message })
  }

  public async SetRingerMode(req: STF.SetRingerModeRequest): Promise<STF.SetRingerModeResponse> {
    const message = this.proto.write.SetRingerModeRequest(req);
    return this.pushEnvelop<STF.SetRingerModeResponse>({ type: STF.MessageType.SET_RINGER_MODE, message })
  }

  public async SetRotationRequest(req: STF.SetRotationRequest): Promise<any> {
    const message = this.proto.write.SetRotationRequest(req);
    return this.pushEnvelop<any>({ type: STF.MessageType.SET_ROTATION, message })
  }

  public async SetWakeLock(req: STF.SetWakeLockRequest): Promise<STF.GetWifiStatusResponse> {
    const message = this.proto.write.SetWakeLockRequest(req);
    return this.pushEnvelop<STF.GetWifiStatusResponse>({ type: STF.MessageType.SET_WAKE_LOCK, message })
  }

  public async SetWifiEnabledRequest(req: STF.SetWifiEnabledRequest): Promise<STF.SetWifiEnabledResponse> {
    const message = this.proto.write.SetWifiEnabledRequest(req);
    return this.pushEnvelop<STF.GetWifiStatusResponse>({ type: STF.MessageType.SET_WIFI_ENABLED, message })
  }

  public async SetBluetoothEnabledRequest(req: STF.SetBluetoothEnabledRequest): Promise<STF.SetBluetoothEnabledResponse> {
    const message = this.proto.write.SetBluetoothEnabledRequest(req);
    return this.pushEnvelop<STF.SetBluetoothEnabledResponse>({ type: STF.MessageType.SET_BLUETOOTH_ENABLED, message })
  }

  public async SetMasterMute(req: STF.SetMasterMuteRequest): Promise<STF.SetMasterMuteResponse> {
    const message = this.proto.write.SetMasterMuteRequest(req);
    return this.pushEnvelop<STF.SetMasterMuteResponse>({ type: STF.MessageType.SET_MASTER_MUTE, message })
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

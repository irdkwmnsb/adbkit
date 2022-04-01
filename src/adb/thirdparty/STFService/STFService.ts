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
// import * as STFAg from "./STFAgentModel";
import { Reader } from "protobufjs";
import STFServiceBuf from "./STFServiceBuf";
import STFAgentBuf from "./STFAgentBuf";

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
  /**
   * calls timeout default is 15000 ms
   */
  timeout: number,
}

const debug = Debug('STFService');
const PKG = 'jp.co.cyberagent.stf';

export default class STFService extends EventEmitter {
  private config: STFServiceOptions;
  private servicesSocket: PromiseSocket<net.Socket> | undefined;
  private agentSocket: PromiseSocket<net.Socket> | undefined;
  private protoSrv!: STFServiceBuf;
  private protoAgent!: STFAgentBuf;

  constructor(private client: DeviceClient, config = {} as Partial<STFServiceOptions>) {
    super();
    this.config = {
      agentPort: 1090,
      servicePort: 1100,
      timeout: 15000,
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
    this.protoSrv = await STFServiceBuf.get();
    this.protoAgent = await STFAgentBuf.get();

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
    let buffer: Buffer | null = null;
    for (; ;) {
      await Utils.waitforReadable(this.servicesSocket);
      const next = await this.servicesSocket.read() as Buffer;
      if (next) continue;
      if (buffer) {
        buffer = Buffer.concat([buffer, next]);
      } else {
        buffer = next;
      }
      while (buffer) {
        const reader = Reader.create(buffer);
        const envelopLen = reader.uint32();
        const bufLen = envelopLen + reader.pos;
        // need mode data to complet envelop
        if (buffer.length < envelopLen) break;
        
        let chunk: Buffer;
        if (bufLen === buffer.length) {
          // chunk len match Envelop len should speedup parsing, depending on nodeJS internal Buffer implementation, need to check Buffer.subarray implementation
          chunk = buffer.subarray(reader.pos);
          buffer = null;
        } else {
          chunk = buffer.subarray(reader.pos, bufLen);
          buffer = buffer.subarray(bufLen);
        }
        try {
          const eventObj = this.protoSrv.readEnvelope(chunk);
          const {id, message} = eventObj;
          if (id) {
            const resolv = this.responseHook[id];
            if (resolv) {
              delete this.responseHook[id];
              resolv(message);
            } else {
              console.error(`STFService RCV response to unknown QueryId:${id} Type:${eventObj.type}`);
            }
            continue;
          }
          switch (eventObj.type) {
            case STF.MessageType.EVENT_AIRPLANE_MODE: this.emit("airplaneMode", this.protoSrv.read.AirplaneModeEvent(message)); break;
            case STF.MessageType.EVENT_BATTERY: this.emit("battery", this.protoSrv.read.BatteryEvent(message)); break;
            case STF.MessageType.EVENT_CONNECTIVITY: this.emit("connectivity", this.protoSrv.read.ConnectivityEvent(message)); break;
            case STF.MessageType.EVENT_ROTATION: this.emit("rotation", this.protoSrv.read.RotationEvent(message)); break;
            case STF.MessageType.EVENT_PHONE_STATE: this.emit("phoneState", this.protoSrv.read.PhoneStateEvent(message)); break;
            case STF.MessageType.EVENT_BROWSER_PACKAGE: this.emit("browerPackage", this.protoSrv.read.BrowserPackageEvent(message)); break;
            default: console.error(`STFService Response Type (${eventObj.type}) is not implemented`);
          }
        } catch (e) {
          if (chunk)
            console.error(chunk.toString('hex'));
          console.error(e);
        }
      }
      await Utils.delay(0);
    }
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







  private responseHook: { [key: number]: (response: Uint8Array) => void } = {}
  private reqCnt = 1;

  private pushService<T>(type: STF.MessageType, message: Uint8Array, requestReader: null | ((req: Uint8Array) => T)): Promise<T> {
    const id = (this.reqCnt + 1) | 0xFFFFFF;
    this.reqCnt = id;
    const envelope = { type, message, id };
    let pReject: (error: Error) => void;
    const promise = new Promise<T>((resolve, reject) => {
      pReject = reject;
      this.responseHook[id] = (message: Uint8Array) => {
        if (requestReader) {
          const conv = requestReader(message);
          resolve(conv);
        } else {
          resolve(null);
        }
      }
    });
    const buf = this.protoSrv.write.Envelope(envelope)
    this.servicesSocket.write(buf);

    const timeout = Utils.delay(this.config.timeout).then(() => {
      if (this.responseHook[id]) {
        delete this.responseHook[id];
        pReject(Error('timeout'));
      }
    });
    Promise.race([promise, timeout]);
    return promise;
  }


  private pushAgent<T>(type: STF.MessageType, message: Uint8Array, requestReader: null | ((req: Uint8Array) => T)): Promise<T> {
    const id = (this.reqCnt + 1) | 0xFFFFFF;
    this.reqCnt = id;
    const envelope = { type, message, id };
    //let pReject: (error: Error) => void;
    const promise = new Promise<T>((resolve, reject) => {
      // pReject = reject;
      this.responseHook[id] = (message: Uint8Array) => {
        if (requestReader) {
          const conv = requestReader(message);
          resolve(conv);
        } else {
          resolve(null);
        }
      }
    });
    const buf = this.protoSrv.write.Envelope(envelope)
    // this.agentSocket.write(buf);
    this.servicesSocket.write(buf);
    // const timeout = Utils.delay(this.config.timeout).then(() => {
    //   if (this.responseHook[id]) {
    //     delete this.responseHook[id];
    //     pReject(Error('timeout'));
    //   }
    // });
    // Promise.race([promise, timeout]);
    return promise;
  }


  public async getAccounts(type?: string): Promise<STF.GetAccountsResponse> {
    const message = this.protoSrv.write.GetAccountsRequest({ type });
    return this.pushService<STF.GetAccountsResponse>(STF.MessageType.GET_ACCOUNTS, message, this.protoSrv.read.GetAccountsResponse)
  }

  public async getBrowsers(req = {} as STF.GetBrowsersRequest): Promise<STF.GetBrowsersResponse> {
    const message = this.protoSrv.write.GetBrowsersRequest(req);
    return this.pushService<STF.GetBrowsersResponse>(STF.MessageType.GET_BROWSERS, message, this.protoSrv.read.GetBrowsersResponse)
  }

  public async getClipboard(type = STF.ClipboardType.TEXT): Promise<STF.GetClipboardResponse> {
    const message = this.protoSrv.write.GetClipboardRequest({ type });
    return this.pushService<STF.GetClipboardResponse>(STF.MessageType.GET_CLIPBOARD, message, this.protoSrv.read.GetClipboardResponse)
  }

  public async getDisplay(id = 0): Promise<STF.GetDisplayResponse> {
    const message = this.protoSrv.write.GetDisplayRequest({ id });
    return this.pushService<STF.GetDisplayResponse>(STF.MessageType.GET_DISPLAY, message, this.protoSrv.read.GetDisplayResponse)
  }

  public async getProperties(properties: string[]): Promise<STF.GetPropertiesResponse> {
    const message = this.protoSrv.write.GetPropertiesRequest({ properties });
    return this.pushService<STF.GetPropertiesResponse>(STF.MessageType.GET_PROPERTIES, message, this.protoSrv.read.GetPropertiesResponse)
  }

  public async getRingerMode(req = {} as STF.GetRingerModeRequest): Promise<STF.GetRingerModeResponse> {
    const message = this.protoSrv.write.GetRingerModeRequest(req);
    return this.pushService<STF.GetRingerModeResponse>(STF.MessageType.GET_RINGER_MODE, message, this.protoSrv.read.GetRingerModeResponse)
  }

  public async getSdStatus(req = {} as STF.GetSdStatusRequest): Promise<STF.GetSdStatusResponse> {
    const message = this.protoSrv.write.GetSdStatusRequest(req);
    return this.pushService<STF.GetSdStatusResponse>(STF.MessageType.GET_SD_STATUS, message, this.protoSrv.read.GetSdStatusResponse)
  }

  // invalid response send by the service
  // public async getVersion(): Promise<STF.GetVersionResponse> {
  //   const message = this.proto.write.GetVersionRequest();
  //   return this.pushEnvelop<STF.GetVersionResponse>(STF.MessageType.GET_VERSION, message })
  // }

  public async getWifiStatus(req = {} as STF.GetWifiStatusRequest): Promise<STF.GetWifiStatusResponse> {
    const message = this.protoSrv.write.GetWifiStatusRequest(req);
    return this.pushService<STF.GetWifiStatusResponse>(STF.MessageType.GET_WIFI_STATUS, message, this.protoSrv.read.GetWifiStatusResponse)
  }

  public async getBluetoothStatus(req = {} as STF.GetBluetoothStatusRequest): Promise<STF.GetBluetoothStatusResponse> {
    const message = this.protoSrv.write.GetBluetoothStatusRequest(req);
    return this.pushService<STF.GetBluetoothStatusResponse>(STF.MessageType.GET_BLUETOOTH_STATUS, message, this.protoSrv.read.GetBluetoothStatusResponse)
  }

  public async getRootStatus(req = {} as STF.GetRootStatusRequest): Promise<STF.GetRootStatusResponse> {
    const message = this.protoSrv.write.GetRootStatusRequest(req);
    return this.pushService<STF.GetRootStatusResponse>(STF.MessageType.GET_ROOT_STATUS, message, this.protoSrv.read.GetRootStatusResponse)
  }

  public async setClipboard(req: STF.SetClipboardRequest): Promise<STF.SetClipboardResponse> {
    const message = this.protoSrv.write.SetClipboardRequest(req);
    return this.pushService<STF.SetClipboardResponse>(STF.MessageType.SET_CLIPBOARD, message, this.protoSrv.read.SetClipboardResponse)
  }

  public async setKeyguardState(req: STF.SetKeyguardStateRequest): Promise<STF.SetKeyguardStateResponse> {
    const message = this.protoSrv.write.SetKeyguardStateRequest(req);
    return this.pushService<STF.SetKeyguardStateResponse>(STF.MessageType.SET_KEYGUARD_STATE, message, this.protoSrv.read.SetKeyguardStateResponse)
  }

  public async setRingerMode(req: STF.SetRingerModeRequest): Promise<STF.SetRingerModeResponse> {
    const message = this.protoSrv.write.SetRingerModeRequest(req);
    return this.pushService<STF.SetRingerModeResponse>(STF.MessageType.SET_RINGER_MODE, message, this.protoSrv.read.SetRingerModeResponse)
  }

  public async setRotationRequest(req: STF.SetRotationRequest): Promise<void> {
    const message = this.protoSrv.write.SetRotationRequest(req);
    return this.pushService<void>(STF.MessageType.SET_ROTATION, message, null)
  }

  public async setWakeLock(req: STF.SetWakeLockRequest): Promise<STF.GetWifiStatusResponse> {
    const message = this.protoSrv.write.SetWakeLockRequest(req);
    return this.pushService<STF.GetWifiStatusResponse>(STF.MessageType.SET_WAKE_LOCK, message, this.protoSrv.read.GetWifiStatusResponse)
  }

  public async setWifiEnabledRequest(req: STF.SetWifiEnabledRequest): Promise<STF.SetWifiEnabledResponse> {
    const message = this.protoSrv.write.SetWifiEnabledRequest(req);
    return this.pushService<STF.SetWifiEnabledResponse>(STF.MessageType.SET_WIFI_ENABLED, message, this.protoSrv.read.SetWifiEnabledResponse)
  }

  public async setBluetoothEnabledRequest(req: STF.SetBluetoothEnabledRequest): Promise<STF.SetBluetoothEnabledResponse> {
    const message = this.protoSrv.write.SetBluetoothEnabledRequest(req);
    return this.pushService<STF.SetBluetoothEnabledResponse>(STF.MessageType.SET_BLUETOOTH_ENABLED, message, this.protoSrv.read.SetBluetoothEnabledResponse)
  }

  public async setMasterMute(req: STF.SetMasterMuteRequest): Promise<STF.SetMasterMuteResponse> {
    const message = this.protoSrv.write.SetMasterMuteRequest(req);
    return this.pushService<STF.SetMasterMuteResponse>(STF.MessageType.SET_MASTER_MUTE, message, this.protoSrv.read.SetMasterMuteResponse)
  }


  // Agents
  // STF.MessageType.DO_KEYEVENT
  // STF.MessageType.DO_TYPE
  // STF.MessageType.DO_WAKE
  // STF.MessageType.SET_ROTATION
  public async keyEvent(req: STF.KeyEventRequest): Promise<any> {
    const message = this.protoSrv.write.KeyEventRequest(req);
    return this.pushAgent<any>(STF.MessageType.DO_KEYEVENT, message, null);
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

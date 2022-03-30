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
import { MessageType, STFAirplaneModeEvent, STFBatteryEvent, STFBrowserPackageEvent, STFConnectivityEvent, STFPhoneStateEvent, STFRotationEvent } from "./STFServiceModel";

const version = '2.4.9';

interface IEmissions {
  airplaneMode: (data: STFAirplaneModeEvent) => void
  battery: (data: STFBatteryEvent) => void
  connectivity: (data: STFConnectivityEvent) => void
  phoneState: (data: STFPhoneStateEvent) => void
  rotation: (data: STFRotationEvent) => void
  browerPackage: (data: STFBrowserPackageEvent) => void
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

let wireP: Promise<ProtoBuf.Root> | null;

export default class STFService extends EventEmitter {
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

  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.on(event, listener)
  public off = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => this.off(event, listener)
  public once = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => this.once(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => this.emit(event, ...args)

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
          // const enmitter = this as STFServiceEventEmitter;
          switch (eventObj.type) {
            case MessageType.EVENT_AIRPLANE_MODE:
              const airEvent = typeAirplaneModeEvent.decode(eventObj.message) as unknown as STFAirplaneModeEvent;
              this.emit("airplaneMode", airEvent);
              break;
            case MessageType.EVENT_BATTERY:
              const batEvent = typeBatteryEvent.decode(eventObj.message) as unknown as STFBatteryEvent;
              this.emit("battery", batEvent);
              break;
            case MessageType.EVENT_CONNECTIVITY:
              const conEvent = typeConnEvent.decode(eventObj.message) as unknown as STFConnectivityEvent;
              this.emit("connectivity", conEvent);
              break;
            case MessageType.EVENT_ROTATION:
              const rotEvent = typeRotationEvent.decode(eventObj.message) as unknown as STFRotationEvent;
              this.emit("rotation", rotEvent);
              break;
            case MessageType.EVENT_PHONE_STATE:
              const phoneEvent = typePhoneEvent.decode(eventObj.message) as unknown as STFPhoneStateEvent;
              this.emit("phoneState", phoneEvent);
              break;
            case MessageType.EVENT_BROWSER_PACKAGE:
              const BrEvent = typeBrowerPackage.decode(eventObj.message) as unknown as STFBrowserPackageEvent;
              this.emit("browerPackage", BrEvent);
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

import path from "node:path";
import fs from "node:fs";
import net from 'node:net';
import Debug from 'debug';
import DeviceClient from "../DeviceClient";
import { Utils } from "../..";
import PromiseDuplex from "promise-duplex";
import { EventEmitter } from "node:stream";
import * as ProtoBuf from 'protobufjs';
import PromiseSocket from "promise-socket";

const version = '2.4.9';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface STFServiceEventEmitter {
  //
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

let wireP: Promise<ProtoBuf.Root> | null;
// .build()

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
    const duplex = new PromiseDuplex(await this.client.shell('pm path jp.co.cyberagent.stf'));
    await Utils.waitforReadable(duplex);
    let resp = await (duplex.setEncoding('utf8').readAll() as Promise<string>);
    resp = resp.trim();
    if (resp.startsWith('package:'))
      return resp.substring(8);
    return '';
  }

  async start(): Promise<void> {
    const apk = path.resolve(__dirname, '..', '..', '..', 'bin', `STFService_${version}.apk`);
    if (!wireP)
      wireP = ProtoBuf.load(path.join(__dirname, '..', '..', '..', 'bin', 'wireService.proto'));
    await wireP;
    try {
      await fs.promises.stat(apk);
    } catch (e) {
      throw Error(`can not find APK bin/STFService_${version}.apk`);
    }

    let setupPath = await this.getPath();
    if (!setupPath) {
      await this.client.install(apk);
      setupPath = await this.getPath();
    }

    let duplex = new PromiseDuplex(await this.client.shell(`export CLASSPATH='${setupPath}';exec app_process /system/bin 'jp.co.cyberagent.stf.Agent' --version 2>/dev/null`));
    await Utils.waitforReadable(duplex);
    const currentVersion = await (duplex.setEncoding('utf8').readAll() as Promise<string>);
    console.log('current version is: ', currentVersion);


    const props = await this.client.getProperties();
    const sdkLevel = parseInt(props['ro.build.version.sdk']);
    const action = 'jp.co.cyberagent.stf.ACTION_START';
    const component = 'jp.co.cyberagent.stf/.Service';
    const startServiceCmd = (sdkLevel < 26) ? 'startservice' : 'start-foreground-service'
    duplex = new PromiseDuplex(await this.client.shell(`am ${startServiceCmd} --user 0 -a '${action}' -n '${component}'`));
    await Utils.waitforReadable(duplex);
    const msg = await (duplex.setEncoding('utf8').readAll() as Promise<string>);
    if (msg.includes('Error')) {
      throw Error(msg.trim())
    }
    console.log(msg.trim());

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
    // return devutil.waitForLocalSocket(adb, options.serial, service.sock)
  }


  private async startServiceStream() {
    const root = await wireP;
    const type = root.lookupType('Envelope');
    for (; ;) {
      await Utils.waitforReadable(this.servicesSocket);
      const chunk = await this.servicesSocket.read() as Buffer;
      if (chunk) {
        console.log('servicesSocket RCV: ', chunk.length);
        try {
          const obj = type.decodeDelimited(chunk);
          console.log(obj.toJSON())
          // console.log(obj)
        } catch (e) {
          console.error(chunk.toString('hex'));
          console.error(e);
        }
      }
      // root.
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
      // root.
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

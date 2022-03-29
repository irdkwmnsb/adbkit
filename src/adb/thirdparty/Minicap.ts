import { Duplex, EventEmitter } from "stream";
import DeviceClient from "../DeviceClient";
import PromiseDuplex from 'promise-duplex';
import Debug from 'debug';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import ExtraUtils from "./ExtraUtils";
import { Utils } from "../..";
import Util from "../util";
import PromiseSocket from "promise-socket";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MinicapEventEmitter {
  on(event: 'data', listener: (data: Buffer) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  off(event: 'data', listener: (data: Buffer) => void): this;
  off(event: 'error', listener: (error: Error) => void): this;
  once(event: 'data', listener: (data: Buffer) => void): this;
  once(event: 'error', listener: (error: Error) => void): this;
}

export interface MinicapOptions {
  /**
   * local port use for minicap
   */
  port: number,

  /**
   * {RealWidth}x{RealHeight}@{VirtualWidth}x{VirtualHeight}/{Orientation}
   */
  dimention: string;

  tunnelDelay: number,
}

const debug = Debug('minicap');

export default class Minicap extends EventEmitter implements MinicapEventEmitter {
  private config: MinicapOptions;
  private videoSocket: PromiseSocket<net.Socket> | undefined;
  private minicapServer: PromiseDuplex<Duplex>;

  /** 0=255 */
  private _version: Promise<number>;
  private _pid: Promise<number>;
  private _realWidth: Promise<number>;
  private _realHigth: Promise<number>;
  private _virtualWidth: Promise<number>;
  private _virtualHigth: Promise<number>;
  private _orientation: Promise<number>;
  private _bitflags: Promise<number>;

  private setVersion: (version: number) => void;
  private setPid: (version: number) => void;
  private setRealWidth: (width: number) => void;
  private setRealHigth: (height: number) => void;
  private setVirtualWidth: (width: number) => void;
  private setVirtualHigth: (height: number) => void;
  private setOrientation: (height: number) => void;
  private setBitflags: (height: number) => void;

  constructor(private client: DeviceClient, config = {} as Partial<MinicapOptions>) {
    super();
    this.config = {
      port: 1313,
      tunnelDelay: 1000,
      dimention: '',
      ...config,
    }
    this._version = new Promise<number>((resolve) => this.setVersion = resolve);
    this._pid = new Promise<number>((resolve) => this.setPid = resolve);
    this._realWidth = new Promise<number>((resolve) => this.setRealWidth = resolve);
    this._realHigth = new Promise<number>((resolve) => this.setRealHigth = resolve);
    this._virtualWidth = new Promise<number>((resolve) => this.setVirtualWidth = resolve);
    this._virtualHigth = new Promise<number>((resolve) => this.setVirtualHigth = resolve);
    this._orientation = new Promise<number>((resolve) => this.setOrientation = resolve);
    this._bitflags = new Promise<number>((resolve) => this.setBitflags = resolve);
  }

  get version(): Promise<number> { return this._version; }
  get pid(): Promise<number> { return this._pid; }
  get realwidth(): Promise<number> { return this._realWidth; }
  get realheight(): Promise<number> { return this._realHigth; }
  get vitualWidth(): Promise<number> { return this._virtualWidth; }
  get vitualHeight(): Promise<number> { return this._virtualHigth; }
  /**
   * return virtual width
   */
  get width(): Promise<number> { return this._virtualWidth; }
  /**
   * return virtual heigth
   */
  get height(): Promise<number> { return this._virtualHigth; }

  get orientation(): Promise<number> { return this._orientation; }
  /**
   * return full bitflags, QuickDumb, QuickAlwaysUpright and QuickTear can be used.
   */
  get bitflags(): Promise<number> { return this._bitflags; }
  /**
   * Frames will get sent even if there are no changes from the previous frame. Informative, doesn't require any actions on your part. You can limit the capture rate by reading frame data slower in your own code if you wish.
   */
  get QuickDumb(): Promise<boolean> { return this.bitflags.then(v => !!(v & 1)); }
  /**
   * 	The frame will always be in upright orientation regardless of the device orientation. This needs to be taken into account when rendering the image.
   */
  get QuickAlwaysUpright(): Promise<boolean> { return this.bitflags.then(v => !!(v & 2)); }
  /**
   * Frame tear might be visible. Informative, no action required. Neither of our current two methods exhibit this behavior.
   */
  get QuickTear(): Promise<boolean> { return this.bitflags.then(v => !!(v & 4)); }

  async start(): Promise<void> {
    const props = await this.client.getProperties();
    const abi = props['ro.product.cpu.abi'];
    const sdkLevel = parseInt(props['ro.build.version.sdk']);
    const minicapName = (sdkLevel >= 16) ? 'minicap' : 'minicap-nopie';
    const prebuildRoot = path.resolve(__dirname, '..', '..', '..', 'node_modules', '@devicefarmer', 'minicap-prebuilt', 'prebuilt');
    
    try {
      await fs.promises.stat(prebuildRoot);
    } catch (e) {
      throw Error('please install @devicefarmer/minicap-prebuilt to use minicap');
    }
    const binFile = path.resolve(prebuildRoot, abi, 'bin', minicapName);
    const soFile = path.resolve(prebuildRoot, abi, 'lib', `android-${sdkLevel}`, 'minicap.so');
    // const apkFile = path.resolve(prebuildRoot, 'noarch', 'minicap.apk');

    try {
      await this.client.push(binFile, '/data/local/tmp/minicap', 0o755);
    } catch (e) {
      // allready running ?
    }
    try {
      await this.client.push(soFile, '/data/local/tmp/minicap.so', 0o755);
    } catch (e) {
      // allready running ?
    }
    // await this.client.push(apkFile, '/data/local/tmp/minicap.apk', 0o755);
    // adb push libs/$ABI/minicap /data/local/tmp/

    const args = ['LD_LIBRARY_PATH=/data/local/tmp/', 'exec', '/data/local/tmp/minicap']
    {
      args.push('-P')
      if (!this.config.dimention) {
        const str = await this.client.execOut('wm size', 'utf8');
        const m = str.match(/(\d+)x(\d+)/);
        if (!m) throw Error('can not gewt device size info');
        const dim = m[0];
        args.push(`${dim}@${dim}/0`);
      } else {
        args.push(this.config.dimention)
      }
    }
    this.minicapServer = new PromiseDuplex(await this.client.shell(args.map(a => a.toString()).join(' ')));
    ExtraUtils.dumpReadable(this.minicapServer, 'minicap');
    try {
      await this.client.forward(`tcp:${this.config.port}`, 'localabstract:minicap');
    } catch (e) {
      debug(`Impossible to forward port ${this.config.port}:`, e);
      throw e;
    }

    if (!Utils.waitforReadable(this.minicapServer, this.config.tunnelDelay)) {
      // try to read error
      const out = await this.minicapServer.setEncoding('utf8').readAll();
      console.log('read out:', out);
    }
    // Wait 1 sec to forward to work
    await Util.delay(this.config.tunnelDelay);
    this.videoSocket = new PromiseSocket(new net.Socket());


    // Connect videoSocket
    try {
      await this.videoSocket.connect(this.config.port, '127.0.0.1')
    } catch (e) {
      debug(`Impossible to connect video Socket "127.0.0.1:${this.config.port}":`, e);
      throw e;
    }

    void this.startStream().catch(() => this.stop());
  }

  private async startStream() {
    // first chunk 24
    try {
      await Utils.waitforReadable(this.videoSocket);
      let firstChunk = await this.videoSocket.read(2) as Buffer;
      if (!firstChunk) {
        throw Error('fail to read firstChunk, inclease tunnelDelay for this device.');
      }
      this.setVersion(firstChunk[0]); // == 1
      const len = firstChunk[1]; // == 24
      firstChunk = await this.videoSocket.read(len - 2) as Buffer;
      this.setPid(firstChunk.readUint32LE(0));
      this.setRealWidth(firstChunk.readUint32LE(4));
      this.setRealHigth(firstChunk.readUint32LE(8));
      this.setVirtualWidth(firstChunk.readUint32LE(12));
      this.setVirtualHigth(firstChunk.readUint32LE(16));
      this.setOrientation(firstChunk.readUint8(20));
      this.setBitflags(firstChunk.readUint8(21));
    } catch (e) {
      debug('Impossible to read first chunk:', e);
      throw e;
    }
    for (; ;) {
      await Utils.waitforReadable(this.videoSocket);
      let chunk = this.videoSocket.stream.read(4) as Buffer;
      let len = chunk.readUint32LE(0);
      // len -= 4;
      let streamChunk: Buffer | null = null;
      while (streamChunk === null) {
        await Utils.waitforReadable(this.videoSocket);
        chunk = this.videoSocket.stream.read(len) as Buffer;
        if (chunk) {
          len -= chunk.length;
          if (!streamChunk)
            streamChunk = chunk;
          else {
            streamChunk = Buffer.concat([streamChunk, chunk]);
          }
          if (streamChunk[0] !== 0xFF || streamChunk[1] !== 0xD8) {
            console.error('Frame body does not start with JPG header');
            return;
          }  
        }
        if (len === 0) {
          this.emit('data', streamChunk);
          break;
        } else {
          await Utils.delay(0);
        }
      }
    }
  }

  public stop() {
    if (this.videoSocket) {
      this.videoSocket.destroy();
      this.videoSocket = undefined;
    }
    this.minicapServer.destroy();
  }
}

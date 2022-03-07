import EventEmitter from 'events';
import path from 'path';
import net from 'net';
import PromiseSocket from 'promise-socket';
import PromiseDuplex from 'promise-duplex';

import Debug from 'debug';
import DeviceClient from './DeviceClient';
import Util from './util';
import { Duplex } from 'stream';

const debug = Debug('scrcpy');
/**
 * by hand start:
 * 
 * adb push scrcpy-server-v1.8.jar /data/local/tmp/scrcpy-server.jar
 * 
 * CLASSPATH=/data/local/tmp/scrcpy-server.jar app_process / com.genymobile.scrcpy.Server 600 1000 true 9999:9999:0:0 true 
 * 
 * adb forward tcp:8099 localabstract:scrcpy
 */

const scrcpyServerVersion = 8;

export interface ScrcpyOptions {
  /**
   * local port use for scrcpy
   */
  port: number,
  /**
   * maxSize         (integer, multiple of 8) 0
   */
  maxSize: number,
  bitrate: number,
  /**
   * use "adb forward" instead of "adb tunnel"
   */
  tunnelForward: boolean,
  tunnelDelay: number,
  /**
   * cropZone formatyed as "width:height:x:y"
   */
  crop: string,
  sendFrameMeta: boolean,
  /**
   * set Control added in scrcpy 1.9
   */
   control: boolean;
}

/**
 * How scrcpy works?
 * 
 * Its a jar file that runs on an adb shell. It records the screen in h264 and offers it in a given tcp port.
 * 
 * scrcpy params
 *   maxSize         (integer, multiple of 8) 0
 *   bitRate         (integer)
 *   tunnelForward   (optional, bool) use "adb forward" instead of "adb tunnel"
 *   crop            (optional, string) "width:height:x:y"
 *   sendFrameMeta   (optional, bool) 
 * 
 * The video stream contains raw packets, without time information. If sendFrameMeta is enabled a meta header is added
 * before each packet.
 * The "meta" header length is 12 bytes
 * [. . . . . . . .|. . . .]. . . . . . . . . . . . . . . ...
 *  <-------------> <-----> <-----------------------------...
 *        PTS         size      raw packet (of size len)
 * 
 */
export default class Scrcpy extends EventEmitter {
  private config: ScrcpyOptions;
  private socket: PromiseSocket<net.Socket> | undefined;
  private scrcpyServer: PromiseDuplex<Duplex>;
  private _name = '';
  private _width = 0;
  private _height = 0;

  constructor(private client: DeviceClient, config: Partial<ScrcpyOptions>) {
    super();
    this.config = {
      port: 8099,
      maxSize: 600,
      bitrate: 999999999,
      tunnelForward: true,
      tunnelDelay: 3000,
      crop: '9999:9999:0:0',
      sendFrameMeta: true,
      control: true,
      ...config
    };
  }


  get name(): string { return this._name; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }

  async dumpScrcpyServer() {
    if (this.scrcpyServer) {
      this.scrcpyServer.readable.stream.on('readable', async () => {
        const data = await this.scrcpyServer.read();
        if (data) {
          const msg = data.toString();
          if (msg.includes('ERROR'))
            console.error('scrcpyServer:', msg);
          else
            console.log('scrcpyServer:', msg);
        }
      });
    }
  }

  /**
   * Will connect to the android device, send & run the server and return deviceName, width and height.
   * After that data will be offered as a 'data' event.
   */
  async start(): Promise<{ name: string, width: number, height: number }> {
    const jarDest = '/data/local/tmp/scrcpy-server.jar';
    // Transfer server...
    try {
      const transfer = await this.client.push(path.join(__dirname, '..', '..', 'bin', `scrcpy-server-v1.${scrcpyServerVersion}.jar`), jarDest);
      await transfer.waitForEnd();
    } catch (e) {
      debug('Impossible to transfer server file:', e);
      throw e;
    }

    // Run server
    try {
      const args: string[] = [];

      args.push(`CLASSPATH=${jarDest}`);
      args.push('app_process');
      args.push('/');
      args.push('com.genymobile.scrcpy.Server');
      args.push(this.config.maxSize.toString()); // maxSize (arg 0)
      args.push(this.config.bitrate.toString()); // bitRate (arg 1)
      args.push(this.config.tunnelForward.toString());
      args.push(this.config.crop.toString());
      args.push(this.config.sendFrameMeta.toString());
      if (scrcpyServerVersion > 8)
        args.push(this.config.control.toString());
      const duplex = await this.client.shell(args.join(' '));
      this.scrcpyServer = new PromiseDuplex(duplex);
      this.dumpScrcpyServer();
      // this.scrcpyServer.read().then(data => console.log('scrcpyServer return ', data.toString()))
    } catch (e) {
      debug('Impossible to run server:', e);
      throw e;
    }

    try {
      await this.client.forward(`tcp:${this.config.port}`, 'localabstract:scrcpy');
    } catch (e) {
      debug(`Impossible to forward port ${this.config.port}:`, e);
      throw e;
    }

    this.socket = new PromiseSocket(new net.Socket());

    // Wait 1 sec to forward to work
    await Util.delay(this.config.tunnelDelay);

    // Connect
    try {
      await this.socket.connect(this.config.port, '127.0.0.1')
      console.log('soket connected');
    } catch (e) {
      debug(`Impossible to connect "127.0.0.1:${this.config.port}":`, e);
      throw e;
    }

    // First chunk is 69 bytes length -> 1 dummy byte, 64 bytes for deviceName, 2 bytes for width & 2 bytes for height
    try {
      const firstChunk = await this.socket.read(69) as Buffer;
      if (!firstChunk)
        throw Error(`Failed to read the first Chunk from port ${this.config.port}`);
      this._name = firstChunk.slice(1, 65).toString('utf8');
      this._width = firstChunk.readUInt16BE(65);
      this._height = firstChunk.readUInt16BE(67);
    } catch (e) {
      debug('Impossible to read first chunk:', e);
      throw e;
    }

    if (this.config.sendFrameMeta) {
      this.startStreamWithMeta();
    } else {
      this.startStreamRaw();
    }

    return { name: this._name, width: this._width, height: this._height};
  }

  public stop() {
    if (this.socket) {
      this.socket.destroy();
    }
  }

  private startStreamRaw() {
    this.socket.stream.on('data', d => this.emit('data', d));
  }

  private startStreamWithMeta() {
    this.socket.stream.pause();
    let pts: Buffer | null = null;
    let len = 0;
    this.socket.stream.on('readable', () => {
      debug('Readeable');
      for (; ;) {
        if (pts === null) {
          const chunk = this.socket.stream.read(12) as Buffer;
          if (!chunk) {
            // regular end condition
            return;
          }
          pts = chunk.slice(0, 8);
          len = chunk.readUInt32BE(8);
          debug(`\tHeader:PTS =`, pts);
          debug(`\tHeader:len =`, len);
        }
        const chunk = this.socket.stream.read(len);
        if (!chunk) {
          // shounld not stop Here
          return;
        }
        debug('\tPacket length:', chunk.length);
        this.emit('data', pts, chunk);
        pts = null;
      }
    });
  }
}

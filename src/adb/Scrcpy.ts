import EventEmitter from 'events';
import path from 'path';
import net from 'net';
import PromiseSocket from 'promise-socket';
import PromiseDuplex from 'promise-duplex';

import Debug from 'debug';
import DeviceClient from './DeviceClient';
import Util from './util';
import { Duplex } from 'stream';

import { MotionEvent, Orientation, ControlMessage } from './ScrcpyConst';
import { KeyCodes, Utils } from '..';
import { Point, ScrcpyOptions } from './ScrcpyModel';

const debug = Debug('scrcpy');
/**
 * by hand start:
 * 
 * adb push scrcpy-server-v1.8.jar /data/local/tmp/scrcpy-server.jar
 * adb push scrcpy-server-v1.20.jar /data/local/tmp/scrcpy-server.jar
 * 
 * CLASSPATH=/data/local/tmp/scrcpy-server.jar app_process / com.genymobile.scrcpy.Server 600 1000 true 9999:9999:0:0 true 
 * 
 * adb forward tcp:8099 localabstract:scrcpy
 */

// supported version 8 and 20
// eslint-disable-next-line prefer-const
let scrcpyServerVersion = 20;

interface ScrcpyEventEmitter {
  on(event: 'data', listener: (pts: BigInt, data: Buffer) => void): this;
  off(event: 'data', listener: (pts: BigInt, data: Buffer) => void): this;
  once(event: 'data', listener: (pts: BigInt, data: Buffer) => void): this;
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
export default class Scrcpy extends EventEmitter implements ScrcpyEventEmitter {  
  private config: ScrcpyOptions;
  private videoSocket: PromiseSocket<net.Socket> | undefined;
  private controlSocket: PromiseSocket<net.Socket> | undefined;
  /**
   * used to recive Process Error
   */
  private scrcpyServer: PromiseDuplex<Duplex>;
  private _name = '';
  private _width = 0;
  private _height = 0;

  constructor(private client: DeviceClient, config: Partial<ScrcpyOptions>) {
    super();
    this.config = {
      port: 8099,
      maxSize: 600,
      maxFps: 0,
      flip: false,
      bitrate: 999999999,
      lockedVideoOrientation: Orientation.LOCK_VIDEO_ORIENTATION_UNLOCKED,
      tunnelForward: true,
      tunnelDelay: 1000,
      crop: '-', //'9999:9999:0:0',
      sendFrameMeta: true, // send PTS so that the client may record properly
      control: true,
      displayId: 0,
      showTouches: false,
      stayAwake: true,
      codecOptions: '-',
      encoderName: '-',
      powerOffScreenOnClose: false,
      ...config
    };
  }

  get name(): string { return this._name; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }

  /**
   * Debugging only
   * @param duplex 
   * @param name 
   * @returns 
   */
  async dumpReadable(duplex: PromiseDuplex<Duplex>, name: string) {
    try {
      for (; ;) {
        await Utils.waitforReadable(duplex);
        const data = await duplex.read();
        if (data) {
          const msg = data.toString();
          console.log(name, ':', msg);
        }
      }
    } catch (e) {
      // End
      return;
    }
  }

  /**
   * Read a message from the contoler Duplex
   * 
   * @param duplex only supoport clipboard
   * @returns 
   */
  async readOneMessage(duplex: PromiseDuplex<Duplex>): Promise<string> {
    if (!duplex)
      return;
    // const waitforReadable = () => new Promise<void>((resolve) => duplex.readable.stream.once('readable', resolve));
    await Utils.waitforReadable(duplex);
    let chunk = (await duplex.read(1)) as Buffer;
    const type = chunk.readUInt8();
    switch (type) {
      case 0: // clipboard
        await Utils.waitforReadable(duplex);
        chunk = (await duplex.read(4)) as Buffer;
        await Utils.waitforReadable(duplex);
        const len = chunk.readUint32BE();
        await Utils.waitforReadable(duplex);
        chunk = (await duplex.read(len)) as Buffer;
        const text = chunk.toString('utf8');
        return text;
      default:
        throw Error(`Unsupported message type:${type}`);
    }
  }

  /**
   * Will connect to the android device, send & run the server and return deviceName, width and height.
   * After that data will be offered as a 'data' event.
   */
  async start(): Promise<void> {
    const jarDest = '/data/local/tmp/scrcpy-server.jar';
    // Transfer server...
    try {
      const transfer = await this.client.push(path.join(__dirname, '..', '..', 'bin', `scrcpy-server-v1.${scrcpyServerVersion}.jar`), jarDest);
      await transfer.waitForEnd();
    } catch (e) {
      debug('Impossible to transfer server file:', e);
      throw e;
    }

    // Start server
    try {
      const args: Array<string | number | boolean> = [];
      const {
        maxSize, bitrate, maxFps, lockedVideoOrientation, tunnelForward, crop,
        sendFrameMeta, control, displayId, showTouches, stayAwake, codecOptions,
        encoderName, powerOffScreenOnClose
      } = this.config;
      args.push(`CLASSPATH=${jarDest}`);
      args.push('app_process');
      args.push('/');
      args.push('com.genymobile.scrcpy.Server');

      if (scrcpyServerVersion == 20) {
        // Version 11 => 20
        args.push(`1.${scrcpyServerVersion}`); // arg 0 Scrcpy server version
        args.push("info"); // Log level: info, verbose...
        args.push(maxSize); // Max screen width (long side)
        args.push(bitrate); // Bitrate of video
        args.push(maxFps); // Max frame per second
        args.push(lockedVideoOrientation); // Lock screen orientation: LOCK_SCREEN_ORIENTATION
        args.push(tunnelForward); // Tunnel forward
        args.push(crop); //    Crop screen
        args.push(sendFrameMeta); // Send frame rate to client
        args.push(control); //  Control enabled
        args.push(displayId); //     Display id
        args.push(showTouches); // Show touches
        args.push(stayAwake); //  if self.stay_awake else "false",  Stay awake
        args.push(codecOptions); //     Codec (video encoding) options
        args.push(encoderName); //     Encoder name
        args.push(powerOffScreenOnClose); // Power off screen after server closed
      }
      const duplex = await this.client.shell(args.map(a => a.toString()).join(' '));
      this.scrcpyServer = new PromiseDuplex(duplex);
      // debug only
      // this.dumpReadable(this.scrcpyServer, 'scrcpyServer');
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

    if (Utils.waitforReadable(this.scrcpyServer, this.config.tunnelDelay)) {
      await this.scrcpyServer.read();
      // const buffer = await this.scrcpyServer.read();
      //const info = buffer.toString();
      // console.log(info);
      //throw Error()
    }

    // Wait 1 sec to forward to work
    await Util.delay(this.config.tunnelDelay);
    this.videoSocket = new PromiseSocket(new net.Socket());
    this.controlSocket = new PromiseSocket(new net.Socket());

    // Connect videoSocket
    try {
      await this.videoSocket.connect(this.config.port, '127.0.0.1')
    } catch (e) {
      debug(`Impossible to connect video Socket "127.0.0.1:${this.config.port}":`, e);
      throw e;
    }

    // Connect videoSocket
    try {
      await this.controlSocket.connect(this.config.port, '127.0.0.1')
    } catch (e) {
      debug(`Impossible to connect control Socket "127.0.0.1:${this.config.port}":`, e);
      throw e;
    }

    // First chunk is 69 bytes length -> 1 dummy byte, 64 bytes for deviceName, 2 bytes for width & 2 bytes for height
    try {
      await Utils.waitforReadable(this.videoSocket);
      const firstChunk = await this.videoSocket.read(1) as Buffer;
      if (!firstChunk) {
        throw Error('fail to read firstChunk, inclease tunnelDelay for this device.');
      }

      // old protocol
      const control = firstChunk.at(0);
      if (firstChunk.at(0) !== 0) {
        throw Error(`Control code should be 0x00, receves: 0x${control.toString(16).padStart(2, '0')}`);
      }
    } catch (e) {
      debug('Impossible to read first chunk:', e);
      throw e;
    }

    if (this.config.sendFrameMeta) {
      void this.startStreamWithMeta();
    } else {
      void this.startStreamRaw();
    }
    // await Util.delay(1500);
    // const text = await this.getClipboard();
    // console.log(text);
    // await Util.delay(1500);
    //await this.rotateDevice();
    //await Util.delay(1500);
    //await this.rotateDevice();
    await Util.delay(1500);
    await this.rotateDevice();
    //await Util.delay(1500);
    //await this.injectKeycodeEvent(MotionEvent.ACTION_DOWN, KeyCodes.KEYCODE_D, 1, 0);
    //await this.injectKeycodeEvent(MotionEvent.ACTION_UP, KeyCodes.KEYCODE_D, 1, 0);
    //await this.injectKeycodeEvent(MotionEvent.ACTION_DOWN, KeyCodes.KEYCODE_D, 1, 0);
    //await this.injectKeycodeEvent(MotionEvent.ACTION_UP, KeyCodes.KEYCODE_D, 1, 0);
  }

  public stop() {
    if (this.videoSocket) {
      this.videoSocket.destroy();
    }
  }

  private startStreamRaw() {
    this.videoSocket.stream.on('data', d => this.emit('data', d));
  }

  private async startStreamWithMeta() {
    this.videoSocket.stream.pause();
    //if (scrcpyServerVersion > 8) {
    await Utils.waitforReadable(this.videoSocket);
    const chunk = this.videoSocket.stream.read(68) as Buffer;
    this._name = chunk.toString('utf8', 0, 64).trim();
    this._width = chunk.readUint16BE(64);
    this._height = chunk.readUint16BE(66);
    //}

    let pts = BigInt(0);// Buffer.alloc(0);
    for (; ;) {
      await Utils.waitforReadable(this.videoSocket);
      let len: number| undefined = undefined;
      if (this.config.sendFrameMeta) {
        const frameMeta = this.videoSocket.stream.read(12) as Buffer;
        if (!frameMeta) {
          // regular end condition
          return;
        }
        pts = frameMeta.readBigUint64BE();
        len = frameMeta.readUInt32BE(8);
        if (pts === 0xFFFFFFFFFFFFFFFFn){
          // non-media data packet
          pts = -1n;
        }
        // else {bufferInfo.presentationTimeUs - ptsOrigin}
        // debug(`\tHeader:PTS =`, pts);
        // debug(`\tHeader:len =`, len);
      }
      let streamChunk: Buffer | null = null;
      while (streamChunk === null) {
        await Utils.waitforReadable(this.videoSocket);
        streamChunk = this.videoSocket.stream.read(len) as Buffer;
        if (streamChunk) {
          // debug('\tPacket length:', streamChunk.length);
          this.emit('data', pts, streamChunk);
        } else {
          // large chunk.
          // console.log('fail to streamChunk len:', len);
          await Utils.delay(0);
        }
      }
    }
  }

  // ControlMessages

  // TYPE_INJECT_KEYCODE
  /**
   * // will be convert in a android.view.KeyEvent
   * https://android.googlesource.com/platform/frameworks/base/+/master/core/java/android/view/KeyEvent.java
   * @param action 
   * @param keyCode 
   * @param repeat 
   * @param metaState  combinaison of KeyEventMeta
   */
  async injectKeycodeEvent(action: MotionEvent, keyCode: KeyCodes, repeatCount: number, metaState: number): Promise<void> {
    const chunk = Buffer.alloc(14);
    chunk.writeUInt8(ControlMessage.TYPE_INJECT_KEYCODE, 0);
    chunk.writeUInt8(action, 1);

    chunk.writeUInt32BE(keyCode, 2);
    chunk.writeUint32BE(repeatCount, 6);
    chunk.writeUint32BE(metaState, 10);
    await this.controlSocket.write(chunk);
  }

  // TYPE_INJECT_TEXT
  async injectText(text: string): Promise<void> {
    const textData = Buffer.from(text, 'utf8');
    const prefix = Buffer.alloc(5);
    prefix.writeUInt8(ControlMessage.TYPE_INJECT_TEXT, 0);
    prefix.writeUInt32BE(textData.length, 1);
    const chunk = Buffer.concat([prefix, textData], prefix.length + textData.length);
    await this.controlSocket.write(chunk);
  }

  /**
   * android.view.MotionEvent;
   * https://android.googlesource.com/platform/frameworks/base/+/master/core/java/android/view/MotionEvent.java
   * @param action 
   * @param pointerId 
   * @param position 
   * @param screenSize 
   * @param pressure 
   */
  async injectTouchEvent(action: MotionEvent, pointerId: bigint, position: Point, screenSize: Point, pressure = 0xffff): Promise<void> {
    const chunk = Buffer.alloc(28);
    chunk.writeUInt8(ControlMessage.TYPE_INJECT_TOUCH_EVENT);
    chunk.writeUInt8(action);
    // Writes a long to the underlying output stream as eight bytes, high byte first.
    chunk.writeBigUint64BE(pointerId);
    chunk.writeUint32BE(position.x);
    chunk.writeUint32BE(position.y);
    chunk.writeUint16BE(screenSize.x);
    chunk.writeUint16BE(screenSize.y);
    chunk.writeUint16BE(pressure);
    chunk.writeInt32BE(MotionEvent.BUTTON_PRIMARY);
    await this.controlSocket.write(chunk);
  }

  async injectScrollEvent(position: Point, screenSize: Point, HScroll: number, VScroll: number): Promise<void> {
    const chunk = Buffer.alloc(20);
    chunk.writeUInt8(ControlMessage.TYPE_INJECT_SCROLL_EVENT);
    // Writes a long to the underlying output stream as eight bytes, high byte first.
    chunk.writeUint32BE(position.x);
    chunk.writeUint32BE(position.y);
    chunk.writeUint16BE(screenSize.x);
    chunk.writeUint16BE(screenSize.y);
    chunk.writeUint16BE(HScroll);
    chunk.writeInt32BE(VScroll);
    chunk.writeInt32BE(MotionEvent.BUTTON_PRIMARY);
    await this.controlSocket.write(chunk);
  }


  // TYPE_BACK_OR_SCREEN_ON
  async injectBackOrScreenOn(): Promise<void> {
    const chunk = Buffer.alloc(2);
    chunk.writeUInt8(ControlMessage.TYPE_BACK_OR_SCREEN_ON);
    chunk.writeUInt8(MotionEvent.ACTION_UP);
    await this.controlSocket.write(chunk);
  }

  // TYPE_EXPAND_NOTIFICATION_PANEL
  async expandNotificationPanel(): Promise<void> {
    const chunk = Buffer.alloc(1);
    chunk.writeUInt8(ControlMessage.TYPE_EXPAND_NOTIFICATION_PANEL);
    await this.controlSocket.write(chunk);
  }

  // TYPE_COLLAPSE_PANELS
  async collapsePannels(): Promise<void> {
    const chunk = Buffer.alloc(1);
    chunk.writeUInt8(ControlMessage.TYPE_EXPAND_SETTINGS_PANEL);
    await this.controlSocket.write(chunk);
  }

  // TYPE_GET_CLIPBOARD
  async getClipboard(): Promise<string> {
    const chunk = Buffer.alloc(1);
    chunk.writeUInt8(ControlMessage.TYPE_GET_CLIPBOARD);
    await this.controlSocket.write(chunk);
    return this.readOneMessage(this.controlSocket);
  }

  // TYPE_SET_CLIPBOARD
  async setClipboard(text: string): Promise<void> {
    const textData = Buffer.from(text, 'utf8');
    const prefix = Buffer.alloc(6);
    prefix.writeUInt8(ControlMessage.TYPE_SET_CLIPBOARD);
    prefix.writeUInt8(1, 1);
    prefix.writeUInt8(2, textData.length);
    const chunk = Buffer.concat([prefix, textData], prefix.length + textData.length);
    await this.controlSocket.write(chunk);
  }

  // TYPE_SET_SCREEN_POWER_MODE
  async setScreenPowerMode(): Promise<void> {
    const chunk = Buffer.alloc(1);
    chunk.writeUInt8(ControlMessage.TYPE_SET_SCREEN_POWER_MODE);
    await this.controlSocket.write(chunk);
  }

  // TYPE_ROTATE_DEVICE
  async rotateDevice(): Promise<void> {
    const chunk = Buffer.alloc(1);
    chunk.writeUInt8(ControlMessage.TYPE_ROTATE_DEVICE);
    await this.controlSocket.write(chunk);
  }
}

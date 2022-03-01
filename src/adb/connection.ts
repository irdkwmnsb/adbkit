import * as Net from 'net';
import { EventEmitter } from 'events';
import { execFile } from 'child_process';
import Parser from './parser';
import dump from './dump';
import d from 'debug';
import { Socket } from 'net';
import { promisify } from 'util';
import { ClientOptions } from '../ClientOptions';
// import PromiseSocket from 'promise-socket';

const debug = d('adb:connection');

export default class Connection extends EventEmitter {
  public socket!: Socket;
  public parser!: Parser;
  private triedStarting: boolean;
  public options: ClientOptions;

  constructor(options?: ClientOptions) {
    super();
    this.options = options || { port: 0 };
    // this.socket = null;
    // this.parser = null;
    this.triedStarting = false;
  }

  public async connect(): Promise<Connection> {
    this.socket = Net.connect(this.options);
    this.socket.setNoDelay(true);
    this.parser = new Parser(this.socket);
    this.socket.on('connect', () => this.emit('connect'));
    this.socket.on('end', () => this.emit('end'));
    this.socket.on('drain', () => this.emit('drain'));
    this.socket.on('timeout', () => this.emit('timeout'));
    this.socket.on('close', (hadError: boolean) => this.emit('close', hadError));

    try {
      await new Promise((resolve, reject) => {
        this.socket.once('connect', resolve);
        this.socket.once('error', reject);
      });
    } catch (err) {
      if ((err as any).code === 'ECONNREFUSED' && !this.triedStarting) {
        debug("Connection was refused, let's try starting the server once");
        this.triedStarting = true;
        await this.startServer();
        return this.connect();
      } else {
        this.end();
        throw err;
      }
    }

    // Emit unhandled error events, so that they can be handled on the client.
    // Without this, they would just crash node unavoidably.
    if (this.socket) {
      this.socket.on('error', (err) => {
        if (this.socket && this.socket.listenerCount('error') === 1) {
          this.emit('error', err);
        }
      });
    }
    return this;
  }

  /**
   * added for Mock testing
   */
  public getSocket(): unknown {
    return this.socket;
  }

  public async waitForDrain(): Promise<void> {
    let drainListener!: () => void;
    try {
      return await new Promise<any>((resolve) => {
        drainListener = () => { resolve(undefined); };
        this.on('drain', drainListener);
      });
    } finally {
      this.removeListener('drain', drainListener);
    }
  }

  public end(): this {
    if (this.socket) {
      this.socket.end();
    }
    return this;
  }

  public write(data: Buffer, callback?: (err?: Error) => void): this {
    this.socket.write(dump(data), callback);
    return this;
  }

  public startServer(): Promise<{ stdout: string; stderr: string; }> {
    let port = 0;
    if ('port' in this.options) {
      port = this.options.port;
    }
    const args: string[] = port ? ['-P', String(port), 'start-server'] : ['start-server'];
    debug(`Starting ADB server via '${this.options.bin} ${args.join(' ')}'`);
    return this._exec(args, {});
  }

  private _exec(args: string[], options: {}): Promise<{ stdout: string; stderr: string; }> {
    if (!this.options.bin)
      throw new Error('No bin specified');
    debug(`CLI: ${this.options.bin} ${args.join(' ')}`);
    return promisify(execFile)(this.options.bin, args, options);
  }

  // _handleError(err) {}
}

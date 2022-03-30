import fs from 'node:fs';
import Path from 'node:path';
import EventEmitter from 'node:events';
import d from 'debug';
import Parser from './parser';
import Protocol from './protocol';
import Stats from './sync/stats';
import Entry from './sync/entry';
import PushTransfer from './sync/pushtransfer';
import PullTransfer from './sync/pulltransfer';
import Connection from './connection';
import { Readable } from 'node:stream';

const TEMP_PATH = '/data/local/tmp';
const DEFAULT_CHMOD = 0o644;
const DATA_MAX_LENGTH = 65536;
const debug = d('adb:sync');

export interface ENOENT extends Error {
  errno: 34;
  code: 'ENOENT';
  path: string;
}

/**
 * enforce EventEmitter typing
 */
 interface IEmissions {
  error: (data: Error) => void
}

export default class Sync extends EventEmitter {
  private parser: Parser;

  public static temp(path: string): string {
    return `${TEMP_PATH}/${Path.basename(path)}`;
  }

  constructor(private connection: Connection) {
    super();
    this.parser = this.connection.parser as Parser;
  }

  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.on(event, listener)
  public off = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.off(event, listener)
  public once = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.once(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => super.emit(event, ...args)

  public async stat(path: string): Promise<Stats> {
    await this.sendCommandWithArg(Protocol.STAT, path);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case Protocol.STAT:
        const stat = await this.parser.readBytes(12);
        const mode = stat.readUInt32LE(0);
        const size = stat.readUInt32LE(4);
        const mtime = stat.readUInt32LE(8);
        if (mode === 0) {
          return this.enoent(path);
        } else {
          return new Stats(mode, size, mtime);
        }
      case Protocol.FAIL:
        return this.readError();
      default:
        return this.parser.unexpected(reply, 'STAT or FAIL');
    }
  }

  public async readdir(path: string): Promise<Entry[]> {
    const files: Entry[] = [];
    await this.sendCommandWithArg(Protocol.LIST, path);
    for (; ;) {
      const reply = await this.parser.readAscii(4);
      switch (reply) {
        case Protocol.DENT:
          const stat = await this.parser.readBytes(16);
          const mode = stat.readUInt32LE(0);
          const size = stat.readUInt32LE(4);
          const mtime = stat.readUInt32LE(8);
          const namelen = stat.readUInt32LE(12);
          const name = await this.parser.readBytes(namelen);
          const nameString = name.toString();
          // Skip '.' and '..' to match Node's fs.readdir().
          if (!(nameString === '.' || nameString === '..')) {
            files.push(new Entry(nameString, mode, size, mtime));
          }
          continue;
        case Protocol.DONE:
          await this.parser.readBytes(16)
          return files;
        case Protocol.FAIL:
          return this.readError();
        default:
          return this.parser.unexpected(reply, 'DENT, DONE or FAIL');
      }
    }
  }

  public async push(contents: string | Readable, path: string, mode?: number): Promise<PushTransfer> {
    if (typeof contents === 'string') {
      return this.pushFile(contents, path, mode);
    } else {
      return this.pushStream(contents, path, mode);
    }
  }

  public async pushFile(file: string, path: string, mode = DEFAULT_CHMOD): Promise<PushTransfer> {
    mode || (mode = DEFAULT_CHMOD);
    return this.pushStream(fs.createReadStream(file), path, mode);
  }

  public async pushStream(stream: Readable, path: string, mode = DEFAULT_CHMOD): Promise<PushTransfer> {
    mode |= Stats.S_IFREG;
    await this.sendCommandWithArg(Protocol.SEND, `${path},${mode}`);
    return this._writeData(stream, Math.floor(Date.now() / 1000));
  }

  public async pull(path: string): Promise<PullTransfer> {
    await this.sendCommandWithArg(Protocol.RECV, `${path}`);
    return this.readData();
  }

  public end(): Sync {
    this.connection.end();
    return this;
  }

  public tempFile(path: string): string {
    return Sync.temp(path);
  }

  private _writeData(stream: Readable, timeStamp: number): PushTransfer {
    const transfer = new PushTransfer();

    let readableListener: () => void;
    let connErrorListener: (err: Error) => void;
    let endListener: () => void;
    let errorListener: (err: Error) => void;

    const writeData = (): Promise<unknown> => new Promise((resolve, reject) => {

      const writer = Promise.resolve();
      endListener = () => {
        writer.then(async () => {
          await this.sendCommandWithLength(Protocol.DONE, timeStamp);
          return resolve(undefined);
        });
      };
      stream.on('end', endListener);

      // const track = () => transfer.pop();
      const writeAll = async (): Promise<void> => {
        for (; ;) {
          const chunk = stream.read(DATA_MAX_LENGTH) || stream.read();
          if (!chunk) return;
          await this.sendCommandWithLength(Protocol.DATA, chunk.length);
          transfer.push(chunk.length);
          await this.connection.write(chunk);
          transfer.pop();
        }
      };

      readableListener = () => writer.then(writeAll);
      stream.on('readable', readableListener);
      errorListener = (err) => reject(err);
      stream.on('error', errorListener);
      connErrorListener = (err: Error) => {
        stream.destroy(err);
        this.connection.end();
        reject(err);
      };
      this.connection.on('error', connErrorListener);
    })
      .finally(() => {
        stream.removeListener('end', endListener);
        stream.removeListener('readable', readableListener);
        stream.removeListener('error', errorListener);
        this.connection.removeListener('error', connErrorListener);
        // writer.cancel();
      });


    const readReply = async (): Promise<boolean> => {
      // may be replace by Command.readOKAY()
      const reply = await this.parser.readAscii(4);
      switch (reply) {
        case Protocol.OKAY:
          await this.parser.readBytes(4);
          return true;
        case Protocol.FAIL:
          return this.readError();
        default:
          return this.parser.unexpected(reply, 'OKAY or FAIL');
      }
    };
    // While I can't think of a case that would break this double-Promise
    // writer-reader arrangement right now, it's not immediately obvious
    // that the code is correct and it may or may not have some failing
    // edge cases. Refactor pending.
    // const writer = 
    writeData().catch(err => {
      transfer.emit('error', err);
    })

    // const reader: Promise<any> = 
    readReply()
      .catch((err: Error): void => {
        transfer.emit('error', err);
      }).finally(() => {
        transfer.end();
      });
    return transfer;
  }

  private readData(): PullTransfer {
    const transfer = new PullTransfer();
    const readAll = async (): Promise<boolean> => {
      for (; ;) {
        const reply = await this.parser.readAscii(4);
        switch (reply) {
          case Protocol.DATA:
            const lengthData = await this.parser.readBytes(4)
            const length = lengthData.readUInt32LE(0);
            await this.parser.readByteFlow(length, transfer)
            continue;
          case Protocol.DONE:
            await this.parser.readBytes(4)
            return true;
          case Protocol.FAIL:
            return this.readError();
          default:
            return this.parser.unexpected(reply, 'DATA, DONE or FAIL');
        }
      }
    };

    // const reader = 
    readAll().catch(err => {
      transfer.emit('error', err as Error)
    }).finally(() => {
      return transfer.end();
    });
    return transfer;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async readError(): Promise<never> {
    try {
      const length = await this.parser.readBytes(4);
      const buf = await this.parser.readBytes(length.readUInt32LE(0));
      return Promise.reject(new Parser.FailError(buf.toString()));
    } finally {
      await this.parser.end();
    }
  }
  /**
   * 
   * @param cmd 
   * @param length 
   * @returns byte write count
   */
  private sendCommandWithLength(cmd: string, length: number): Promise<number> {
    if (cmd !== Protocol.DATA) {
      debug(cmd);
    }
    const payload = Buffer.alloc(cmd.length + 4);
    payload.write(cmd, 0, cmd.length);
    payload.writeUInt32LE(length, cmd.length);
    return this.connection.write(payload);
  }

  /**
   * 
   * @param cmd 
   * @param arg 
   * @returns byte write count
   */
  private sendCommandWithArg(cmd: string, arg: string): Promise<number> {
    debug(`${cmd} ${arg}`);
    const arglen = Buffer.byteLength(arg, 'utf-8');
    const payload = Buffer.alloc(cmd.length + 4 + arglen);
    let pos = 0;
    payload.write(cmd, pos, cmd.length);
    pos += cmd.length;
    payload.writeUInt32LE(arglen, pos);
    pos += 4;
    payload.write(arg, pos);
    return this.connection.write(payload);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private enoent(path: string): Promise<any> {
    const err: ENOENT = new Error(`ENOENT, no such file or directory '${path}'`) as ENOENT;
    err.errno = 34;
    err.code = 'ENOENT';
    err.path = path;
    return Promise.reject(err);
  }
}

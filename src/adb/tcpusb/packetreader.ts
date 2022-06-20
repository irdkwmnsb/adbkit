import EventEmitter from 'events';
import Packet from './packet';
import ReadableStream = NodeJS.ReadableStream;

class ChecksumError extends Error {
  constructor(public packet: Packet) {
    super();
    Object.setPrototypeOf(this, ChecksumError.prototype);
    this.name = 'ChecksumError';
    this.message = 'Checksum mismatch';
    Error.captureStackTrace(this, PacketReader.ChecksumError);
  }
}

class MagicError extends Error {
  constructor(public packet: Packet) {
    super();
    Object.setPrototypeOf(this, MagicError.prototype);
    this.name = 'MagicError';
    this.message = 'Magic value mismatch';
    Error.captureStackTrace(this, PacketReader.MagicError);
  }
}

/**
 * enforce EventEmitter typing
 */
 interface IEmissions {
  end: () => void
  error: (data: Error) => void
  packet: (packet: Packet) => void
}

export default class PacketReader extends EventEmitter {
  public static ChecksumError = ChecksumError;
  public static MagicError = MagicError;

  private inBody = false;
  private buffer?: Buffer;
  private packet?: Packet;

  constructor(private stream: ReadableStream) {
    super();
    this.stream.on('readable', this._tryRead.bind(this));
    this.stream.on('error', (err) => { this.emit('error', err); });
    this.stream.on('end', () => { this.emit('end'); });
    setImmediate(this._tryRead.bind(this));
  }

  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.on(event, listener)
  public off = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.off(event, listener)
  public once = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.once(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => super.emit(event, ...args)

  private _tryRead(): void {
    while (this._appendChunk()) {
      while (this.buffer) {
        if (this.inBody) {
          if (!this.packet) {
            throw Error('invalid stat packet is missing');
          }
          if (!(this.buffer.length >= this.packet.length)) {
            break;
          }
          this.packet.data = this._consume(this.packet.length);
          if (!this.packet.verifyChecksum()) {
            this.emit('error', new PacketReader.ChecksumError(this.packet));
            return;
          }
          this.emit('packet', this.packet);
          this.inBody = false;
        } else {
          if (!(this.buffer.length >= 24)) {
            break;
          }
          const header = this._consume(24);
          this.packet = new Packet(
            header.readUInt32LE(0),
            header.readUInt32LE(4),
            header.readUInt32LE(8),
            header.readUInt32LE(12),
            header.readUInt32LE(16),
            header.readUInt32LE(20),
            Buffer.alloc(0),
          );
          if (!this.packet.verifyMagic()) {
            this.emit('error', new PacketReader.MagicError(this.packet));
            return;
          }
          if (this.packet.length === 0) {
            this.emit('packet', this.packet);
          } else {
            this.inBody = true;
          }
        }
      }
    }
  }

  private _appendChunk(): Buffer | null {
    const chunk = this.stream.read() as Buffer;
    if (chunk) {
      if (this.buffer) {
        return (this.buffer = Buffer.concat([this.buffer, chunk], this.buffer.length + chunk.length));
      } else {
        return (this.buffer = chunk);
      }
    } else {
      return null;
    }
  }

  private _consume(length: number): Buffer {
    if (!this.buffer)
      return Buffer.from([]);
    const chunk = this.buffer.slice(0, length);
    this.buffer = length === this.buffer.length ? undefined : this.buffer.slice(length);
    return chunk;
  }
}

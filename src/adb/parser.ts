import Protocol from './protocol';
import { Duplex } from 'stream';

class FailError extends Error {
  constructor(message: string) {
    super(`Failure: '${message}'`);
    Object.setPrototypeOf(this, FailError.prototype);
    this.name = 'FailError';
    Error.captureStackTrace(this, FailError);
  }
}

export class PrematureEOFError extends Error {
  public missingBytes: number;
  constructor(howManyMissing: number) {
    super(`Premature end of stream, needed ${howManyMissing} more bytes`);
    Object.setPrototypeOf(this, PrematureEOFError.prototype);
    this.name = 'PrematureEOFError';
    this.missingBytes = howManyMissing;
    Error.captureStackTrace(this, PrematureEOFError);
  }
}

export class UnexpectedDataError extends Error {
  constructor(public unexpected: string, public expected: string) {
    super(`Unexpected '${unexpected}', was expecting ${expected}`);
    Object.setPrototypeOf(this, UnexpectedDataError.prototype);
    this.name = 'UnexpectedDataError';
    Error.captureStackTrace(this, UnexpectedDataError);
  }
}

export default class Parser {
  public static FailError = FailError;
  public static PrematureEOFError = PrematureEOFError;
  public static UnexpectedDataError = UnexpectedDataError;
  private ended = false;

  constructor(public stream: Duplex) {
    // empty
  }

  public async end(): Promise<boolean> {
    if (this.ended) {
      return true;
    }
    let tryRead: () => void;
    let errorListener: (error: Error) => void;
    let endListener: () => void;
    return new Promise<boolean>((resolve, reject) => {
      tryRead = () => {
        while (this.stream.read()) {
          // read and drop
        }
      };
      errorListener = (err) => reject(err);
      endListener = () => {
        this.ended = true;
        return resolve(true);
      };
      this.stream.on('readable', tryRead);
      this.stream.on('error', errorListener);
      this.stream.on('end', endListener);
      this.stream.read(0);
      this.stream.end();
    }).finally(() => {
      this.stream.removeListener('readable', tryRead);
      this.stream.removeListener('error', errorListener);
      this.stream.removeListener('end', endListener);
    })
  }

  public raw(): Duplex {
    return this.stream;
  }

  public async readAll(): Promise<Buffer> {
    let all = Buffer.alloc(0);

    let tryRead: () => void;
    let errorListener: (error: Error) => void;
    let endListener: () => void;

    return new Promise<Buffer>((resolve, reject) => {
      tryRead = () => {
        let chunk: Buffer;
        while ((chunk = this.stream.read())) {
          all = Buffer.concat([all, chunk]);
        }
        if (this.ended) {
          return resolve(all);
        }
      };
      errorListener = function (err) {
        return reject(err);
      };
      endListener = () => {
        this.ended = true;
        return resolve(all);
      };
      this.stream.on('readable', tryRead);
      this.stream.on('error', errorListener);
      this.stream.on('end', endListener);
      tryRead();
    }).finally(() => {
      this.stream.removeListener('readable', tryRead);
      this.stream.removeListener('error', errorListener);
      this.stream.removeListener('end', endListener);
    })
  }

  public async readAscii(howMany: number): Promise<string> {
    const chunk = await this.readBytes(howMany);
    return chunk.toString('ascii');
  }

  public async readBytes(howMany: number): Promise<Buffer> {
    let tryRead: () => void;
    let errorListener: (error: Error) => void;
    let endListener: () => void;
    return new Promise<Buffer>((resolve, reject) => {
      tryRead = () => {
        if (howMany) {
          const chunk = this.stream.read(howMany);
          if (chunk) {
            // If the stream ends while still having unread bytes, the read call
            // will ignore the limit and just return what it's got.
            howMany -= chunk.length;
            if (howMany === 0) {
              return resolve(chunk);
            }
          }
          if (this.ended) {
            return reject(new Parser.PrematureEOFError(howMany));
          }
        } else {
          return resolve(Buffer.alloc(0));
        }
      };
      endListener = () => {
        this.ended = true;
        return reject(new Parser.PrematureEOFError(howMany));
      };
      errorListener = (err) => {
        reject(err)
      };
      this.stream.on('readable', tryRead);
      this.stream.on('error', errorListener);
      this.stream.on('end', endListener);
      tryRead();
    }).finally(() => {
      this.stream.removeListener('readable', tryRead);
      this.stream.removeListener('error', errorListener);
      this.stream.removeListener('end', endListener);
    });
  }

  public async readByteFlow(howMany: number, targetStream: Duplex): Promise<void> {
    let tryRead: () => void;
    let errorListener: (error: Error) => void;
    let endListener: () => void;
    return new Promise<void>((resolve, reject) => {
      tryRead = () => {
        if (howMany) {
          const chunk = this.stream.read(howMany);
          // Try to get the exact amount we need first. If unsuccessful, take
          // whatever is available, which will be less than the needed amount.
          while (chunk || this.stream.read()) {
            howMany -= chunk.length;
            targetStream.write(chunk);
            if (howMany === 0) {
              return resolve();
            }
          }
          if (this.ended) {
            return reject(new Parser.PrematureEOFError(howMany));
          }
        } else {
          return resolve();
        }
      };
      endListener = () => {
        this.ended = true;
        return reject(new Parser.PrematureEOFError(howMany));
      };
      errorListener = function (err) {
        return reject(err);
      };
      this.stream.on('readable', tryRead);
      this.stream.on('error', errorListener);
      this.stream.on('end', endListener);
      tryRead();
    }).finally(() => {
      this.stream.removeListener('readable', tryRead);
      this.stream.removeListener('error', errorListener);
      this.stream.removeListener('end', endListener);
    });
  }

  public async readError(): Promise<never> {
    const value = await this.readValue();
    throw new Parser.FailError(value.toString());
  }

  public async readValue(): Promise<Buffer> {
    const value = await this.readAscii(4);
    const length = Protocol.decodeLength(value);
    return await this.readBytes(length);
  }

  public readUntil(code: number): Promise<Buffer> {
    let skipped = Buffer.alloc(0);
    const read = async (): Promise<Buffer> => {
      const chunk = await this.readBytes(1);
      if (chunk[0] === code) {
        return skipped;
      } else {
        skipped = Buffer.concat([skipped, chunk]);
        return read();
      }
    };
    return read();
  }

  async searchLine(re: RegExp): Promise<RegExpExecArray> {
    const line = await this.readLine();
    const match = re.exec(line.toString());
    if (match) {
      return match;
    } else {
      return this.searchLine(re);
    }
  }

  public async readLine(): Promise<Buffer> {
    const line = await this.readUntil(10);
    // '\n'
    if (line[line.length - 1] === 13) {
      // '\r'
      return line.slice(0, -1);
    } else {
      return line;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unexpected(data: string, expected: string): Promise<never> {
    return Promise.reject(new Parser.UnexpectedDataError(data, expected));
  }
}

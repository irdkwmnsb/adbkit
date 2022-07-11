import Protocol from './protocol';
import { Duplex } from 'stream';

export class FailError extends Error {
  constructor(message: string, lastMessage: string) {
    super(`Failure: '${message}' lastMessage:${lastMessage}`);
    Object.setPrototypeOf(this, FailError.prototype);
    this.name = 'FailError';
    Error.captureStackTrace(this, FailError);
  }
}

export class AdbPrematureEOFError extends Error {
  public missingBytes: number;
  constructor(howManyMissing: number, lastMessage: string) {
    super(`Premature end of stream, needed ${howManyMissing} more bytes lastMessage:${lastMessage}`);
    Object.setPrototypeOf(this, AdbPrematureEOFError.prototype);
    this.name = 'AdbPrematureEOFError';
    this.missingBytes = howManyMissing;
    Error.captureStackTrace(this, AdbPrematureEOFError);
  }
}

export class UnexpectedDataError extends Error {
  constructor(public unexpected: string, public expected: string, lastMessage: string) {
    super(`Unexpected '${unexpected}', was expecting ${expected} lastMessage:${lastMessage}`);
    Object.setPrototypeOf(this, UnexpectedDataError.prototype);
    this.name = 'UnexpectedDataError';
    Error.captureStackTrace(this, UnexpectedDataError);
  }
}

/**
 * helper to read in Duplex stream
 */
export default class Parser {
  public static FailError = FailError;
  public static UnexpectedDataError = UnexpectedDataError;
  private ended = false;
  public lastMessage = '';

  constructor(public stream: Duplex) {
    // empty
  }

  /**
   * read and drop all remaining data in stream
   * @returns 
   */
  public async end(): Promise<true> {
    if (this.ended) {
      return true;
    }
    const stream = this.stream;
    let tryRead: () => void;
    let errorListener: (error: Error) => void;
    let endListener: () => void;
    return new Promise<true>((resolve, reject) => {
      tryRead = () => {
        while (stream.read()) {
          // read and drop
        }
      };
      errorListener = (err) => reject(err);
      endListener = () => {
        this.ended = true;
        return resolve(true);
      };
      stream.on('readable', tryRead);
      stream.on('error', errorListener);
      stream.on('end', endListener);
      stream.read(0);
      stream.end();
    }).finally(() => {
      stream.removeListener('readable', tryRead);
      stream.removeListener('error', errorListener);
      stream.removeListener('end', endListener);
    })
  }
  /**
   * @returns the internal Duplex
   */
  public raw(): Duplex {
    return this.stream;
  }

  public async readAll(): Promise<Buffer> {
    let all = Buffer.alloc(0);
    const stream = this.stream;

    let tryRead: () => void;
    let errorListener: (error: Error) => void;
    let endListener: () => void;

    return new Promise<Buffer>((resolve, reject) => {
      tryRead = () => {
        let chunk: Buffer;
        while ((chunk = stream.read())) {
          all = Buffer.concat([all, chunk]);
        }
        if (this.ended) {
          resolve(all);
        }
      };
      errorListener = (err) => {
        reject(err);
      };
      endListener = () => {
        this.ended = true;
        resolve(all);
      };
      stream.on('readable', tryRead);
      stream.on('error', errorListener);
      stream.on('end', endListener);
      tryRead();
    }).finally(() => {
      stream.removeListener('readable', tryRead);
      stream.removeListener('error', errorListener);
      stream.removeListener('end', endListener);
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
            return reject(new AdbPrematureEOFError(howMany, this.lastMessage));
          }
        } else {
          return resolve(Buffer.alloc(0));
        }
      };
      endListener = () => {
        this.ended = true;
        return reject(new AdbPrematureEOFError(howMany, this.lastMessage));
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

  /**
   * pipe howMany bytes to targetStream
   * @param howMany bytes to transfer
   * @param targetStream destination stream
   * @returns Promise that resolves when all bytes are transferred
   */
  public async readByteFlow(howMany: number, targetStream: Duplex): Promise<void> {
    let tryRead: () => void;
    let errorListener: (error: Error) => void;
    let endListener: () => void;
    const stream = this.stream;
    // TODO add cancellable
    // const controller = new AbortController();

    const promise = new Promise<void>((resolve, reject) => {
      tryRead = () => {
        if (howMany) {
          let chunk: Buffer;
          // Read timeout
          // stream = addAbortSignal(controller.signal, this.stream);
          // const tm = setTimeout(() => controller.abort(), 10_000); // set a timeout

          // Try to get the exact amount we need first. If unsuccessful, take
          // whatever is available, which will be less than the needed amount.
          while ((chunk = stream.read(howMany) || stream.read())) {
            howMany -= chunk.length;
            // TODO fix missing backpressuring handling
            targetStream.write(chunk);
            if (howMany === 0) {
              // clearTimeout(tm)
              return resolve();
            }
          }
          if (this.ended) {
            // TODO add cancellable
            //clearTimeout(tm)
            return reject(new AdbPrematureEOFError(howMany, this.lastMessage));
          }
        } else {
          // TODO add cancellable
          // clearTimeout(tm)
          return resolve();
        }
      };
      endListener = () => {
        this.ended = true;
        return reject(new AdbPrematureEOFError(howMany, this.lastMessage));
      };
      errorListener = (err) => {
        return reject(err);
      };
      stream.on('readable', tryRead);
      stream.on('error', errorListener);
      stream.on('end', endListener);
      tryRead();
    }).finally(() => {
      stream.removeListener('readable', tryRead);
      stream.removeListener('error', errorListener);
      stream.removeListener('end', endListener);
    });
    // TODO add cancellable
    // (promise as any).cancel = () => {
    //   controller.abort();
    // }
    return promise;
  }

  public async readError(): Promise<never> {
    let error = 'unknown Error';
    try {
      error = await this.readValue('utf8');
    } catch (e) {
      // keep localy generated error
      if (e instanceof FailError) {
        throw e;
      } else if (e instanceof AdbPrematureEOFError) {
        throw e;
      } else if (e instanceof UnexpectedDataError) {
        throw e;
      }
    }
    throw new Parser.FailError(error, this.lastMessage);
  }

  /**
   * @returns read a 4-ASCII digits length-prefixed data block
   */
  public async readValue(): Promise<Buffer>;
  public async readValue(encoding: BufferEncoding): Promise<string>;
  public async readValue(encoding?: BufferEncoding): Promise<Buffer | string> {
    const value = await this.readAscii(4);
    const length = Protocol.decodeLength(value);
    const buf = await this.readBytes(length);
    if (encoding) {
      return buf.toString(encoding);
    }
    return buf;
  }

  /**
   * read stream byte per byte until a delimiter is found
   * @param code delimiter
   * @returns buffer wothout delimiter
   */
  public async readUntil(code: number): Promise<Buffer> {
    let skipped = Buffer.alloc(0);
    for (;;) {
      const chunk = await this.readBytes(1);
      if (chunk[0] === code) {
        return skipped;
      } else {
        skipped = Buffer.concat([skipped, chunk]);
      }
    }
  }

  async searchLine(re: RegExp): Promise<RegExpExecArray> {
    for (;;) {
      const line = await this.readLine();
      const match = re.exec(line);
      if (match) {
        return match;
      }
    }
  }

  /**
   * read socket until \r\n
   * @returns 
   */
  public async readLine(encoding?: BufferEncoding): Promise<string> {
    // read until \n
    const line = await this.readUntil(10);
    // drop tailing \r if present
    if (line[line.length - 1] === 13) {
      return line.slice(0, -1).toString(encoding);
    } else {
      return line.toString(encoding);
    }
  }

  public unexpected(data: string, expected: string): Promise<never> {
    return Promise.reject(new Parser.UnexpectedDataError(data, expected, this.lastMessage));
  }
}

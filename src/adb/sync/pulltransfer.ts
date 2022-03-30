import { Stream } from 'node:stream';

export default class PullTransfer extends Stream.PassThrough {
  public stats = {
    bytesTransferred: 0,
  };

  public cancel(): boolean {
    return this.emit('cancel');
  }

  write(
    chunk: Buffer,
    encoding?: BufferEncoding | typeof callback,
    callback?: (error: Error | null | undefined) => void,
  ): boolean {
    this.stats.bytesTransferred += chunk.length;
    this.emit('progress', this.stats);
    if (typeof encoding === 'function') {
      return super.write(chunk, encoding);
    }
    return super.write(chunk, encoding, callback);
  }

  promiseWrite(
    chunk: Buffer,
    encoding?: BufferEncoding
  ): Promise<void> {
    this.stats.bytesTransferred += chunk.length;
    this.emit('progress', this.stats);
    return new Promise<void>((accept, reject) => {
      super.write(chunk, encoding, (err) => {
        if (err) reject(err);
        else accept();
      });
    })
  }

  /**
   * get end notification using Promise
   */
  public waitForEnd(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const unReg = (cb: () => void) => {
        this.off('end', resolve);
        this.off('error', reject);
        cb();
      }
      this.on('end', () => unReg(resolve));
      this.on('error', () => unReg(reject));
    })
  }
}

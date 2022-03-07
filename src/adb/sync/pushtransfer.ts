import { EventEmitter } from 'events';

export default class PushTransfer extends EventEmitter {
  private stack: number[] = [];
  public stats = {
    bytesTransferred: 0,
  };

  public cancel(): boolean {
    return this.emit('cancel');
  }

  public push(byteCount: number): number {
    return this.stack.push(byteCount);
  }

  public pop(): boolean {
    const byteCount = this.stack.pop();
    if (byteCount) {
      this.stats.bytesTransferred += byteCount;
    }
    return this.emit('progress', this.stats);
  }

  public end(): boolean {
    return this.emit('end');
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

import EventEmitter from 'node:events';

/**
 * enforce EventEmitter typing
 */
 interface IEmissions {
  end: () => void
  cancel: () => void
  progress: (stats: { bytesTransferred: number}) => void
  error: (data: Error) => void
}

export default class PushTransfer extends EventEmitter {
  private stack: number[] = [];
  public stats = {
    bytesTransferred: 0,
  };

  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.on(event, listener)
  public off = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.off(event, listener)
  public once = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.once(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => super.emit(event, ...args)

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

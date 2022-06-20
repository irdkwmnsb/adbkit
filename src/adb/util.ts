import Parser from './parser';
import Auth from './auth';
import ExtendedPublicKey from '../models/ExtendedPublicKey';
import { Duplex } from 'stream';
import PromiseDuplex from 'promise-duplex';

export default class Util {
  public static readAll(stream: Duplex): Promise<Buffer> {
    return new Parser(stream).readAll();
  }

  public static parsePublicKey(keyString: string): Promise<ExtendedPublicKey> {
    return Auth.parsePublicKey(keyString);
  }

  public static delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public static async waitforReadable(duplex?: Duplex | PromiseDuplex<Duplex>, timeout = 0): Promise<boolean> {
    if (!duplex)
      return false
    const waitRead = new Promise<void>((resolve) => {
      if (duplex instanceof Duplex) {
        duplex.once('readable', resolve)
      } else {
        duplex.readable.stream.once('readable', resolve)
      }
    });
    if (timeout) {
      let readable = true;
      const timeOut = Util.delay(timeout).then(() => readable = false);
      await Promise.race([waitRead, timeOut]);
      return readable;
    }
    await waitRead;
    return true;
  }

  public static async waitforText(duplex: PromiseDuplex<Duplex>, expected: string, timeout = 0): Promise<void> {
    for (;;) {
      await this.waitforReadable(duplex, timeout);
      const buf = await duplex.read();
      const text = buf.toString();
      if (text.includes(expected))
        return;
    }
  }
}

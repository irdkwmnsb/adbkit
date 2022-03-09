import Parser from './parser';
import Auth from './auth';
import ExtendedPublicKey from '../ExtendedPublicKey';
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

  public static async waitforReadable(duplex: Duplex | PromiseDuplex<Duplex>, timeout = 0): Promise<boolean> {
    const waitRead = new Promise<void>((resolve) => {
      if (duplex instanceof Duplex) {
        duplex.once('readable', resolve)
      } else {
        duplex.readable.stream.once('readable', resolve)
      }
    });
    if (timeout) {
      let redable = true;
      const timeOut = Util.delay(timeout).then(() => redable = false);
      await Promise.race([waitRead, timeOut]);
      return redable;
    }
    await waitRead;
    return true;
  }
}

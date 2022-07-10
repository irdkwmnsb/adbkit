import Parser from './parser';
import Auth from './auth';
import ExtendedPublicKey from '../models/ExtendedPublicKey';
import { Duplex } from 'stream';
import PromiseDuplex from 'promise-duplex';

export default class Util {
  /**
   * Takes a [`Stream`][node-stream] and reads everything it outputs until the stream ends. Then it resolves with the collected output. Convenient with `client.shell()`.
   * 
   * @param stream The [`Stream`][node-stream] to read.
   * @returns All the output as a [`Buffer`][node-buffer]. Use `output.toString('utf-8')` to get a readable string from it.
   */
  public static readAll(stream: Duplex): Promise<Buffer> {
    return new Parser(stream).readAll();
  }
  /**
   * Parses an Android-formatted mincrypt public key (e.g. `~/.android/adbkey.pub`).
   * 
   * @param keyString The key String or [`Buffer`][node-buffer] to parse. Not a filename.
   * @returns The key as a [forge.pki](https://github.com/digitalbazaar/forge#rsa) public key. You may need [node-forge](https://github.com/digitalbazaar/forge) for complicated operations.
   */
  public static parsePublicKey(keyString: string): Promise<ExtendedPublicKey> {
    return Auth.parsePublicKey(keyString);
  }

  /**
   * A delay promise
   * 
   * @param ms time to wait im ms
   * @returns void
   */
  public static delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  /**
   * Promise waiter for a Duplex to be readable
   * 
   * @param duplex a vanilla Duplex of a PromiseDuplex
   * @param timeout do not wait more than timeout
   * @returns is the true is duplex is readable
   */
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

  /**
   * Wait for a spesific text in the Duplex
   * 
   * @param duplex 
   * @param expected 
   * @param timeout 
   * @returns 
   */
  public static async waitforText(duplex: PromiseDuplex<Duplex>, expected: string, timeout = 0): Promise<void> {
    for (; ;) {
      await this.waitforReadable(duplex, timeout);
      const buf = await duplex.read();
      const text = buf.toString();
      if (text.includes(expected))
        return;
    }
  }
}

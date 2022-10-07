import Parser from './parser';
import Auth from './auth';
import ExtendedPublicKey from '../models/ExtendedPublicKey';
import { Duplex } from 'stream';
import PromiseDuplex from 'promise-duplex';
import Debug from 'debug';

export default class Utils {
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
    let theResolve: (() => void) = () => { /** dummy */ };
    const waitRead = new Promise<void>((resolve) => {
      theResolve = resolve;
      if (duplex instanceof Duplex) {
        duplex.once('readable', resolve)
      } else {
        duplex.readable.stream.once('readable', resolve)
      }
    });
    if (timeout) {
      let readable = true;
      const timeOut = Utils.delay(timeout).then(() => readable = false);
      await Promise.race([waitRead, timeOut]);
      if (!readable) {
        if (duplex instanceof Duplex) {
          duplex.off('readable', theResolve)
        } else {
          duplex.readable.stream.off('readable', theResolve)
        }
      }
      return readable;
    }
    await waitRead;
    return true;
  }

  /**
   * Wait for a spesific text in the Duplex
   * all text will be concatened in a single string to dean with segments.
   * 
   * @param duplex 
   * @param expected regexp to match
   * @returns matched text
   */
  public static async waitforText(duplex: PromiseDuplex<Duplex>, expected: RegExp, timeout = 10000): Promise<string> {
    let allText = '';
    const t0 = Date.now();
    let nextTimeout = timeout;
    for (; ;) {
      await this.waitforReadable(duplex, timeout);
      const buf = await duplex.read();
      if (buf) {
        const text = buf.toString();
        allText += text;
        if (expected.test(allText))
          return text;
        // console.log('RCV Non matching DATA:', text);
      }
      if (timeout) {
        const timeSpend = Date.now() - t0;
        if (nextTimeout <= 0)
          throw Error(`timeout waiting for ${expected}, receved: ${allText}`);
        nextTimeout = timeout - timeSpend;
      }
    }
  }

  public static debug(name: string) {
    const debug = Debug(name);
    debug.log = console.log.bind(console);
    return debug;
  }
}

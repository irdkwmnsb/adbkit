import Parser from './parser';
import Auth from './auth';
import ExtendedPublicKey from '../ExtendedPublicKey';
import { Duplex } from 'stream';

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
}

/**
 * utils only used by third party
 */

import PromiseDuplex from "promise-duplex";
import { Duplex } from 'node:stream';
import { Utils } from "../..";
import path from "node:path";

export default class ThirdUtils {
  /**
   * use to debug external apk output
   * @param duplex process IO
   * @param name for display only
   * @returns resolve on stream closed
   */
  static async dumpReadable(duplex: PromiseDuplex<Duplex>, name: string): Promise<void> {
    try {
      const prefix = name + ':';
      for (; ;) {
        await Utils.waitforReadable(duplex);
        const data = await duplex.read();
        if (data) {
          const msg = data.toString();
          console.log(prefix, msg.trim());
        }
      }
    } catch (e) {
      // End
      return;
    }
  }

  static get resourceDir() {
    return path.join(__dirname, '..', '..', '..', 'bin');
  }

  static getResource(fileName: string) : string {
    const fullPath = path.join(ThirdUtils.resourceDir, fileName);
    return fullPath;
  }
}
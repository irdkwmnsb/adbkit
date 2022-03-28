/**
 * utils only used by third party
 */

import PromiseDuplex from "promise-duplex";
import { Duplex } from "stream";
import { Utils } from "../..";

export default class ExtraUtils {
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

}
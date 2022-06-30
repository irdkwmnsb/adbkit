/**
 * An array of reverse objects
 */
export default interface Reverse {
  /**
   * The remote endpoint on the device. Same format as `client.reverse()`'s `remote` argument.
   */
  remote: string;
  /**
   * The local endpoint on the host. Same format as `client.reverse()`'s `local` argument.
   */
  local: string;
}

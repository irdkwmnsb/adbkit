import ExtendedPublicKey from './ExtendedPublicKey';

export default interface SocketOptions {
  auth?: (key: ExtendedPublicKey) => Promise<void | boolean>;
}

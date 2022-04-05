import { TcpNetConnectOpts } from 'node:net';

export interface ClientOptions extends TcpNetConnectOpts {
  bin?: string;
}

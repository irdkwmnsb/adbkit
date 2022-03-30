import Net from 'node:net';
import Socket from './socket';
import EventEmitter from 'node:events';
import Client from '../client';
import SocketOptions from '../../SocketOptions';

/**
 * enforce EventEmitter typing
 */
 interface IEmissions {
  listening: () => void
  close: () => void
  connection: (socket: Socket) => void
  error: (data: Error) => void
}

export default class Server extends EventEmitter {
  private readonly server: Net.Server;
  private connections: Socket[] = [];

  constructor(
    private readonly client: Client,
    private readonly serial: string,
    private readonly options: SocketOptions,
  ) {
    super();
    this.server = Net.createServer({
      allowHalfOpen: true,
    });
    this.server.on('error', (err) => this.emit('error', err));
    this.server.on('listening', () => this.emit('listening'));
    this.server.on('close', () => this.emit('close'));
    this.server.on('connection', (conn) => {
      const socket = new Socket(this.client, this.serial, conn, this.options);
      this.connections.push(socket);
      socket.on('error', (err) => {
        // 'conn' is guaranteed to get ended
        return this.emit('error', err);
      });
      socket.once('end', () => {
        // 'conn' is guaranteed to get ended
        return (this.connections = this.connections.filter((val) => val !== socket));
      });
      return this.emit('connection', socket);
    });
  }

  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.on(event, listener)
  public off = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => this.off(event, listener)
  public once = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => this.once(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => this.emit(event, ...args)

  public listen(...args: Parameters<Net.Server['listen']>): Server {
    this.server.listen(...args);
    return this;
  }

  public close(): Server {
    this.server.close();
    return this;
  }

  public end(): Server {
    const ref = this.connections;
    for (let i = 0, len = ref.length; i < len; i++) {
      ref[i].end();
    }
    return this;
  }
}

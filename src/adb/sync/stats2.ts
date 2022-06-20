import Stats from './stats';

export default class Stats2 extends Stats {
  public readonly error: number;

  constructor(mode: number, size: number, mtime: number,
    error: number,
    dev: number,
    ino: number,
    nlink: number,
    uid: number,
    gid: number,
    atime: number,
    ctime: number,
  ) {
    super(mode, size, mtime);
    this.error = error;
    this.dev = dev;
    this.ino = ino;
    this.nlink = nlink;
    this.uid = uid;
    this.gid = gid;
    this.atime = new Date(atime * 1000);
    this.ctime = new Date(ctime * 1000);
  }
}

import Entry from './entry';

export default class Entry2 extends Entry {
  public readonly error: number;

  constructor(name: string, mode: number, size: number, mtime: number,
    error: number,
    dev: number,
    ino: number,
    nlink: number,
    uid: number,
    gid: number,
    atime: number,
    ctime: number,
  ) {
    super(name, mode, size, mtime);
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

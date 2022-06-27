import Stats from './stats';
import fs from 'fs';

export default class Stats64 implements fs.BigIntStats {
  isFile(): boolean {
    return !!(Number(this.mode) & Stats.S_IFREG);
  }
  isDirectory(): boolean {
    return !!(Number(this.mode) & Stats.S_IFDIR);
  }
  isBlockDevice(): boolean {
    return !!(Number(this.mode) & Stats.S_IFBLK);
  }
  isCharacterDevice(): boolean {
    return !!(Number(this.mode) & Stats.S_IFCHR);
  }
  isSymbolicLink(): boolean {
    return !!(Number(this.mode) & Stats.S_IFLNK);
  }
  isFIFO(): boolean {
    return !!(Number(this.mode) & Stats.S_IFIFO);
  }
  isSocket(): boolean {
    return !!(Number(this.mode) & Stats.S_IFSOCK);
  }

  get atimeMs(): bigint {
    return this.atimeNs / 1000n;
  }
  get mtimeMs(): bigint {
    return this.mtimeNs / 1000n;
  }
  get ctimeMs(): bigint {
    return this.ctimeNs / 1000n;
  }
  get birthtimeMs(): bigint {
    return this.birthtimeMs / 1000n;
  }

  rdev: bigint = 0n;
  blksize: bigint = 0n;
  blocks: bigint = 0n;

  get atime(): Date {
    return new Date(Number(this.atimeMs))
  }

  get mtime(): Date {
    return new Date(Number(this.mtimeMs))
  }

  get ctime(): Date {
    return new Date(Number(this.ctimeMs))
  }

  get birthtimeNs(): bigint {
    return this.ctimeNs;
  }
  get birthtime(): Date {
    return this.ctime;
  }

  constructor(
    public readonly error: number,
    public readonly dev: bigint,
    public readonly ino: bigint,
    public readonly mode: bigint,
    public readonly nlink: bigint,
    public readonly uid: bigint,
    public readonly gid: bigint,
    public readonly size: bigint,
    public readonly atimeNs: bigint,
    public readonly mtimeNs: bigint,
    public readonly ctimeNs: bigint) { }
}

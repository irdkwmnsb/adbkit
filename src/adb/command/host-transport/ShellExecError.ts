
export default class ShellExecError extends Error {
  constructor(message: string) {
    super(`Failure: '${message}'`);
    Object.setPrototypeOf(this, ShellExecError.prototype);
    this.name = 'ShellExecError';
    Error.captureStackTrace(this, ShellExecError);
  }
}
  
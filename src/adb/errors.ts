
/**
 * AdbError is the common parent class for all ADB Exceptions:
 * AdbFailError AdbPrematureEOFError and AdbUnexpectedDataError
 */
export class AdbError extends Error {
  constructor(message: string, public lastMessage: string) {
    super(message + ' lastMessage:' + lastMessage);
  }
}

/**
 * a command call respond an Error
 */
export class AdbFailError extends AdbError {
  constructor(message: string, lastMessage: string) {
    super(`Failure: '${message}'`, lastMessage);
    Object.setPrototypeOf(this, AdbFailError.prototype);
    this.name = 'AdbFailError';
    Error.captureStackTrace(this, AdbFailError);
  }
}

/**
 * the connection get interupt before the end of expected response
 */
export class AdbPrematureEOFError extends AdbError {
  constructor(public missingBytes: number, lastMessage: string) {
    super(`Premature end of stream, needed ${missingBytes} more bytes`, lastMessage);
    Object.setPrototypeOf(this, AdbPrematureEOFError.prototype);
    this.name = 'AdbPrematureEOFError';
    Error.captureStackTrace(this, AdbPrematureEOFError);
  }
}

export class AdbUnexpectedDataError extends AdbError {
  constructor(public unexpected: string, public expected: string, lastMessage: string) {
    super(`Unexpected '${unexpected}', was expecting ${expected}`, lastMessage);
    Object.setPrototypeOf(this, AdbUnexpectedDataError.prototype);
    this.name = 'AdbUnexpectedDataError';
    Error.captureStackTrace(this, AdbUnexpectedDataError);
  }
}
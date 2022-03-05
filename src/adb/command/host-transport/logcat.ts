import LineTransform from '../../linetransform';
import Command from '../../command';

export default class LogcatCommand extends Command<LineTransform> {
  async execute(options: { clear?: boolean } = {}): Promise<LineTransform> {
    // For some reason, LG G Flex requires a filter spec with the -B option.
    // It doesn't actually use it, though. Regardless of the spec we always get
    // all events on all devices.
    let cmd = 'logcat -B *:I 2>/dev/null';
    if (options.clear) {
      cmd = `logcat -c 2>/dev/null && ${cmd}`;
    }
    this._send(`shell:echo && ${cmd}`);
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        return this.parser.raw().pipe(
          new LineTransform({
            autoDetect: true,
          }));
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }
}

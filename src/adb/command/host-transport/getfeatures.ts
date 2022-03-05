import Command from '../../command';
import { Features } from '../../../Features';

const RE_FEATURE = /^feature:(.*?)(?:=(.*?))?\r?$/gm;

export default class GetFeaturesCommand extends Command<Features> {
  async execute(): Promise<Features> {
    this._send('shell:pm list features 2>/dev/null');
    const reply = await this.parser.readAscii(4);
    switch (reply) {
      case this.protocol.OKAY:
        const data = await this.parser.readAll();
        return this._parseFeatures(data.toString());
      case this.protocol.FAIL:
        return this.parser.readError();
      default:
        return this.parser.unexpected(reply, 'OKAY or FAIL');
    }
  }

  private _parseFeatures(value: string): Features {
    const features: Features = {};
    let match: RegExpExecArray | null;
    while ((match = RE_FEATURE.exec(value))) {
      features[match[1]] = match[2] || true;
    }
    return features;
  }
}

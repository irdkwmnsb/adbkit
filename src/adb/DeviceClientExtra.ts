import DeviceClient from "./DeviceClient";
import xpath from 'xpath';
import { DOMParser } from 'xmldom';

export default class DeviceClientExtra {
  constructor(private deviceClient: DeviceClient) { }
  /**
   * rootless version of enable usb tethering
   * @param enable
   */
  async usbTethering(enable: boolean): Promise<boolean> {
    await this.deviceClient.startActivity({ component: 'com.android.settings/.TetherSettings', wait: true });
    const xml = await this.deviceClient.execOut('uiautomator dump /dev/tty', 'utf8');
    const doc = new DOMParser().parseFromString(xml)
    // https://gist.github.com/LeCoupa/8c305ec8c713aad07b14
    const nodes = xpath.select('//*[contains(@text,"USB")]/../..', doc) as Element[];
    if (!nodes.length)
      throw Error('can not find USB labeled node');
    const switch_widget = xpath.select('./*/node[@class="android.widget.Switch"]', nodes[0]) as Element[];
    if (!switch_widget.length)
      throw Error('can not find android.widget.Switch linked to USB label');
    const [checkBox] = switch_widget;
    console.log(checkBox.toString());
    const checked = checkBox.getAttribute('checked') === 'true';
    const bounds = checkBox.getAttribute('bounds');
    if (checked === enable) {
      return false;
    }
    const m = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/)
    if (!m)
      throw Error('failed to parse Switch bounds');
    const [, x1, y1 ] = m; // , x2, y2
    await this.deviceClient.exec('input tap ' + x1 + ' ' + y1);
    return true;
  }


  /**
   * rootless version of enable usb tethering
   * @param enable
   */
  async airPlainMode(enable: boolean): Promise<boolean> {
    await this.deviceClient.startActivity({ action: 'android.settings.AIRPLANE_MODE_SETTINGS', wait: true });
    const xml = await this.deviceClient.execOut('uiautomator dump /dev/tty', 'utf8');

    const doc = new DOMParser().parseFromString(xml)
    // https://gist.github.com/LeCoupa/8c305ec8c713aad07b14
    // "Airplane mode"
    const nodes = xpath.select('//*[contains(@text,"mode")]/../..', doc) as Element[]
    if (!nodes.length)
      throw Error('can not find mode labeled node');
    console.log(nodes[0].toString());
    const switch_widget = xpath.select('./*/node[@class="android.widget.Switch"]', nodes[0]) as Element[];
    if (!switch_widget.length)
      throw Error('can not find android.widget.Switch linked to USB label');
    const [checkBox] = switch_widget;
    console.log(checkBox.toString());
    const checked = checkBox.getAttribute('checked') === 'true';
    const bounds = checkBox.getAttribute('bounds');
    if (checked === enable) {
      return false;
    }
    const m = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/)
    if (!m)
      throw Error('failed to parse Switch bounds');
    const [, x1, y1, x2, y2] = m;
    await this.deviceClient.exec('input tap ' + x1 + ' ' + y1);
    return true;
  }


}
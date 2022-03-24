/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeviceClient, KeyCodes, Utils } from '../src';
import adb from '../src/adb';
import { IpRouteEntry, IpRuleEntry } from '../src/adb/command/host-transport';
import Parser from '../src/adb/parser';
import { MotionEvent } from '../src/adb/ScrcpyConst';

function print(list: Array<IpRouteEntry | IpRuleEntry>) {
  for (const route of list) console.log(route.toString());
}

function fmtSize(trData: number): string {
  let str = '';
  if (trData > 1024 * 1024) {
    str = (trData / (1024 * 1024)).toFixed(1) + 'MB';
  } else if (trData > 1024) {
    str = (trData / 1024).toFixed(1) + 'KB';
  } else {
    str = trData + 'B';
  }
  return str;
}

const testScrcpy = async (deviceClient: DeviceClient) => {
  const scrcpy = deviceClient.scrcpy({port: 8099});
  let nbPkg = 0;
  let trData = 0;
  setInterval(() => {
    if (!nbPkg)
      return;
    console.log(`${nbPkg} packet Transfered for a total of ${fmtSize(trData)}`);
    nbPkg = 0;
    trData = 0;
  }, 1000);
  // const mille: BigInt = 1000n;
  scrcpy.on('data', (pts, data) => {
    nbPkg++;
    trData += data.length;
    const asFloat = parseFloat(pts.toString())
    const sec = asFloat / 1000000;
    console.log(`[${sec.toFixed(1)}] Data:  ${fmtSize(data.length)}`)
  });
  try {
    await scrcpy.start();
    console.log(`Started`);
  } catch(e) {
    console.error('Impossible to start', e);
  }
}

const testScrcpyTextInput = async (deviceClient: DeviceClient) => {
  const scrcpy = deviceClient.scrcpy({port: 8099});
  try {
    await scrcpy.start();
    console.log(`Started`);
    await Utils.delay(100);
    console.log(`delay ok`);
    await Utils.delay(100);
    await scrcpy.injectText('foo bar')
    await Utils.delay(100);
    await scrcpy.injectKeycodeEvent(MotionEvent.ACTION_DOWN, KeyCodes.KEYCODE_D, 1, 0);
    await scrcpy.injectKeycodeEvent(MotionEvent.ACTION_UP, KeyCodes.KEYCODE_D, 1, 0);
    await scrcpy.injectKeycodeEvent(MotionEvent.ACTION_DOWN, KeyCodes.KEYCODE_D, 1, 0);
    await scrcpy.injectKeycodeEvent(MotionEvent.ACTION_UP, KeyCodes.KEYCODE_D, 1, 0);
    await Utils.delay(1000);
    console.log(`stop`);
    scrcpy.stop();
    console.log(`done`);
  } catch(e) {
    console.error('Impossible to start', e);
  }
}

const testScrcpyswap = async (deviceClient: DeviceClient) => {
  const scrcpy = deviceClient.scrcpy({port: 8099});
  try {
    const pointerId = BigInt('0xFFFFFFFFFFFFFFFF');
    await scrcpy.start();
    console.log(`Started`);
    await Utils.delay(100);
    const width = await scrcpy.width;
    const height = await scrcpy.height;
    const position = { x: width/2, y: height * 0.2 };
    const bottom = height * 0.8;
    await scrcpy.injectTouchEvent(MotionEvent.ACTION_DOWN, pointerId, position, {x:width, y: height}, 0xFFFF);
    console.log('start position', position);
    while (position.y < bottom) {
      await Utils.delay(2);
      await scrcpy.injectTouchEvent(MotionEvent.ACTION_MOVE, pointerId, position, {x:width, y: height}, 0xFFFF);
      position.y += 5;
    }
    console.log('end position', position);
    await scrcpy.injectTouchEvent(MotionEvent.ACTION_UP, pointerId, position, {x:width, y: height}, 0x0000);
    await Utils.delay(1000);
    scrcpy.stop();
    console.log(`done`);
  } catch(e) {
    console.error('Impossible to start', e);
  }
}

const testRouting = async (deviceClient: DeviceClient) => {
  deviceClient.sudo = true;
  const rules = await deviceClient.ipRule('list');
  const routes = await deviceClient.ipRoute('list', 'table', 'all');
  const routesWifi = await deviceClient.ipRoute('show table wlan0');
  const routes4G = await deviceClient.ipRoute('show table rmnet_data2');
  const defaultWifi = routesWifi.find(r => r.dest === 'default')
  const default4G = routes4G.find(r => r.dest === 'default')
  console.log(`default Wifi is: ${defaultWifi}`);
  console.log(`default   4G is: ${default4G}`);
  // double rules
  // try {
  //   console.log(`ip route add ${defaultWifi.toString()} table wlan0`);
  //   await deviceClient.getIpRoute(`add ${defaultWifi.toString()} table wlan0`);
  // } catch (e) {
  //   if (e instanceof Error)
  //     console.log(e.message);
  // }
  await deviceClient.ipRoute(`del ${defaultWifi.toString()} table wlan0`);
  await deviceClient.ipRoute(`add ${default4G.toString()} table wlan0`);
  const toWifi = defaultWifi.clone()
  toWifi.dest = '212.129.20.0/24';
  await deviceClient.ipRoute(`add ${toWifi.toString()} table wlan0`);
  // rool back:
  // console.log(`rool back:`);
  // await deviceClient.ipRoute(`ip route add ${defaultWifi.toString()} table wlan0`);
  // await deviceClient.ipRoute(`ip route del ${default4G.toString()} table wlan0`);
  // await deviceClient.ipRoute(`ip route del ${toWifi.toString()} table wlan0`);
  //ip route add default via 10.38.199.10 dev rmnet_data2 proto static mtu 1500 table 1021
  //const transport = await deviceClient.transport();
  //const rules2 = await new IpRuleCommand(transport, {sudo: true}).execute('list');
  //for (const rule of rules2)
  //  console.log(rule.toStirng());
}

const testUiautomator = async (deviceClient: DeviceClient) => {
  const duplex = await deviceClient.shell('uiautomator dump /dev/tty');
  const result = await new Parser(duplex).readAll();
  console.log(result.toString('utf8'));
}

const main = async () => {
  const adbClient = adb.createClient();
  const devices = await adbClient.listDevices();
  if (!devices.length) {
    console.error('Need at least one connected android device');
    return;
  }
  const deviceClient = devices[0].getClient();
  // testScrcpy(deviceClient);
  // testUiautomator(deviceClient);
  // testScrcpyTextInput(deviceClient);
  testScrcpyswap(deviceClient);
}

main();
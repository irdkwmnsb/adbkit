/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeviceClient } from '../src';
import adb from '../src/adb';
import { IpRouteEntry, IpRuleEntry } from '../src/adb/command/host-transport';

function print(list: Array<IpRouteEntry | IpRuleEntry>) {
  for (const route of list) console.log(route.toString());
}


const main = async () => {
  const adbClient = adb.createClient();
  const devices = await adbClient.listDevices();
  if (!devices.length) {
    console.error('Need at least one connected android device');
    return;
  }
  const deviceClient = devices[0].getClient();
  const scrcpy = deviceClient.scrcpy({});
  scrcpy.on('data', (pts: Buffer, data: Buffer) => {
    if (data.length > 1024)
      console.log(`[${pts.length}] Data: ${(data.length/1024).toFixed(1)}Kb`)
    else
      console.log(`[${pts.length}] Data: ${data.length}b`)
  });
  scrcpy.start()
    .then(info => console.log(`Started -> ${info.name} at ${info.width}x${info.height}`))
    .catch(e => console.error('Impossible to start', e));
}

const testRouting = async (deviceClient: DeviceClient) => {
  deviceClient.sudo = true;
  const rules = await deviceClient.ipRule('list');
  // print(rules)
  const routes = await deviceClient.ipRoute('list', 'table', 'all');
  // print(routes)

  const routesWifi = await deviceClient.ipRoute('show table wlan0');
  // print(routesWifi)

  //console.log('4g');
  const routes4G = await deviceClient.ipRoute('show table rmnet_data2');
  // print(routes4G)

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

main();
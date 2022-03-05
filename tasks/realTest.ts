/* eslint-disable @typescript-eslint/no-unused-vars */
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
}

main();
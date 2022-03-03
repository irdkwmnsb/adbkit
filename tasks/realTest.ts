import adb from '../src/adb';

const main = async () => {
  const adbClient = adb.createClient();
  const devices = await adbClient.listDevices();
  if (!devices.length) {
    console.error('Need at least one connected android device');
    return;
  }
  const client = devices[0].getClient();
  const rules = await client.getIpRule('list');
  for (const rule of rules)
    console.log(rule.toStirng());

  const routes = await client.getIpRoute('list', 'table', 'all');
  for (const route of routes)
    console.log(route.toString());
}

main();
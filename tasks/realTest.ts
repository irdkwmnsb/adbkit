import adb from '../src/adb';

const main = async () => {
  const adbClient = adb.createClient();
  const devices = await adbClient.listDevices();
  if (!devices.length) {
    console.error('Need at least one connected android device');
    return;
  }
  const client = devices[0].getClient();
  const routes = await client.getIpRoute('list', 'table', 'all');
  console.log(routes);
}

main();
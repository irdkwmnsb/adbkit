import { program } from 'commander';
import DeviceClient from './adb/DeviceClient';
import Utils from './adb/utils';
import { getClientDevice } from './cli-common';

program
  .command('usb-tethering-off [serials...]')
  .description('Disable USB tethering.')
  .action(async (serials: string[]) => {
    const devices = await getClientDevice(serials);
    const process = async (device: DeviceClient) => {
      if (await device.extra.usbTethering(false)) {
        console.log(`[${device.serial}] tethering enabled`);
        await Utils.delay(100)
        await device.extra.back();
      } else {
        console.log(`[${device.serial}] failed or already enabled`);
      }
    }
    await Promise.all(devices.map(process));
  });

program
  .command('usb-tethering-on [serials...]')
  .description('Enable USB tethering.')
  .action(async (serials: string[]) => {
    const devices = await getClientDevice(serials);
    const process = async (device: DeviceClient) => {
      if (await device.extra.usbTethering(true)) {
        console.log(`[${device.serial}] tethering enabled`);
        await Utils.delay(100)
        await device.extra.back();
      } else {
        console.log(`[${device.serial}] failed or already enabled`);
      }
    }
    await Promise.all(devices.map(process));
  });


import fs from 'fs';
import { program } from 'commander';
import forge from 'node-forge';
import { createClient } from './adb';
import Auth from './adb/auth';
import PacketReader from './adb/tcpusb/packetreader';
import path from 'path';
import Device from './models/Device';
import DeviceClient from './adb/DeviceClient';
import Utils from './adb/utils';

const pkg: { version: string } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), { encoding: 'utf-8' }));

program.version(pkg.version);

async function getClientDevice(serials: string[]): Promise<DeviceClient[]> {
  const adb = createClient();
  if (!serials || !serials.length) {
    const devices: Device[] = await adb.listDevices();
    if (devices.length == 0) {
      console.error('no Android devices found');
      process.exit(1);
      return [];
    }
    if (devices.length == 1) {
      return [devices[0].getClient()];
    }
    console.error('Multiple devices avaliable provide a serial number to choose one');
    console.error(devices.map(d => `- ${d.id}`).join('\n'));
    process.exit(1);
  }
  if (serials.length === 1 && (serials[0] === 'all' || serials[0] === '*')) {
    serials = (await adb.listDevices()).map((d: Device) => d.id);
  }

  return serials.map(serial => adb.getDevice(serial))
}

program
  .command('pubkey-convert <file>')
  .option('-f, --format <format>', 'format (pem or openssh)', String, 'pem')
  .description('Converts an ADB-generated public key into PEM format.')
  .action(async (file, options): Promise<void> => {
    const key = await Auth.parsePublicKey(fs.readFileSync(file).toString('utf8'));
    switch (options.format.toLowerCase()) {
      case 'pem':
        return console.log(forge.pki.publicKeyToPem(key).trim());
      case 'openssh':
        return console.log(forge.ssh.publicKeyToOpenSSH(key, 'adbkey').trim());
      default:
        console.error("Unsupported format '" + options.format + "'");
        return process.exit(1);
    }
  });

program
  .command('pubkey-fingerprint <file>')
  .description('Outputs the fingerprint of an ADB-generated public key.')
  .action(async (file: string) => {
    const key = await Auth.parsePublicKey(fs.readFileSync(file).toString('utf8'));
    return console.log('%s %s', key.fingerprint, key.comment);
  });

program
  .command('usb-device-to-tcp <serial>')
  .option('-p, --port <port>', 'port number', (value: string) => String(value), '6174')
  .description('Provides an USB device over TCP using a translating proxy.')
  .action((serial: string, options: { port: string }) => {
    const adb = createClient();
    const server = adb
      .createTcpUsbBridge(serial, {
        auth: () => Promise.resolve(),
      })
      .on('listening', () => console.info('Connect with `adb connect localhost:%d`', options.port))
      .on('error', (err) => console.error('An error occured: ' + err.message));
    server.listen(options.port);
  });

program
  .command('parse-tcp-packets <file>')
  .description('Parses ADB TCP packets from the given file.')
  .action((file: string) => {
    const reader = new PacketReader(fs.createReadStream(file));
    reader.on('packet', (packet) => console.log(packet.toString()));
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
  .command('airplane-mode-on [serials...]')
  .description('Enable airplane.')
  .action(async (serials: string[]) => {
    const devices = await getClientDevice(serials);
    const process = async (device: DeviceClient) => {
      if (await device.extra.airPlainMode(true)) {
        console.log(`[${device.serial}] airplane enabled`);
        await Utils.delay(100)
        await device.extra.back();
      } else {
        console.log(`[${device.serial}] airplane or already enabled`);
      }
    }
    await Promise.all(devices.map(process));
  });

program
  .command('airplane-mode-off [serials...]')
  .description('Disable airplane.')
  .action(async (serials: string[]) => {
    const devices = await getClientDevice(serials);
    const process = async (device: DeviceClient) => {
      if (await device.extra.airPlainMode(false)) {
        console.log(`[${device.serial}] airplane disabled`);
        await Utils.delay(100)
        await device.extra.back();
      } else {
        console.log(`[${device.serial}] airplane or already enabled`);
      }
    }
    await Promise.all(devices.map(process));
  });

program
  .command('airplane-mode-on-off [serials...]')
  .description('Enable then Disable airplane.')
  .action(async (serials: string[]) => {
    const devices = await getClientDevice(serials);
    const process = async (device: DeviceClient) => {
      if (await device.extra.airPlainMode(false, 200)) {
        console.log(`[${device.serial}] airplane on-off`);
        await Utils.delay(100)
        await device.extra.back();
      } else {
        console.log(`[${device.serial}] airplane or already enabled`);
      }
    }
    await Promise.all(devices.map(process));
  });


for (const type of ['bluetooth', 'data', 'wifi'] as const) {
  program
    .command(`${type}-off [serials...]`)
    .description('Disable bluetooth.')
    .action(async (serials: string[]) => {
      const devices = await getClientDevice(serials);
      const process = async (device: DeviceClient) => {
        if (await device.extra.setSvc(type, false)) {
          console.log(`[${device.serial}] ${type} disabled`);
        } else {
          console.log(`[${device.serial}] failed ${type} already disabled`);
        }
      }
      await Promise.all(devices.map(process));
    });

  program
    .command(`${type}-on [serials...]`)
    .description('Enable bluetooth.')
    .action(async (serials: string[]) => {
      const devices = await getClientDevice(serials);
      const process = async (device: DeviceClient) => {
        if (await device.extra.setSvc(type, true)) {
          console.log(`[${device.serial}] ${type} enabled`);
        } else {
          console.log(`[${device.serial}] failed ${type} already enabled`);
        }
      }
      await Promise.all(devices.map(process));
    });
}


program
  .command('capture dest [serials...]')
  .description('capture screen of one or many device as png.')
  .action(async (dest: string, serials: string[]) => {
    const devices = await getClientDevice(serials);
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      let out = dest;
      if (devices.length > 1) {
        out = path.join(path.dirname(out), device.serial + '-' + path.basename(out));
      }
      const stream = await device.screencap();
      const capture = await Utils.readAll(stream);
      fs.writeFileSync(dest, capture);
    }
  });

program.parse(process.argv);

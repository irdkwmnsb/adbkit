import fs from 'fs';
import { program } from 'commander';
import forge from 'node-forge';
import Adb from './adb';
import Auth from './adb/auth';
import PacketReader from './adb/tcpusb/packetreader';
import path from 'path';
import Device from './models/Device';
import DeviceClient from './adb/DeviceClient';

const pkg: { version: string } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), { encoding: 'utf-8' }));

program.version(pkg.version);

async function getClientDevice(serial?: string): Promise<DeviceClient> {
  const adb = Adb.createClient();
  if (!serial) {
    const devices: Device[] = await adb.listDevices();
    if (devices.length == 0) {
      console.error('no Android devices found');
      process.exit(1);
      return;
    }
    if (devices.length == 1) {
      return devices[0].getClient();
    }
    console.error('Multiple devices avaliable provide a serial number to choose one');
    console.error(devices.map(d => `- ${d.id}`).join('\n'));
    process.exit(1);
    return;
  }
  return adb.getDevice(serial)
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
    const adb = Adb.createClient();
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
  .command('usb-tethering-on [serial]')
  .description('Enable USB tethering.')
  .action(async (serial?: string) => {
    const device = await getClientDevice(serial);
    if (await device.extra.usbTethering(true)) {
      console.log('tethering enabled');
      await device.extra.back();
    } else {
      console.log('failed or already enabled');
    }
  });

program
  .command('usb-tethering-off [serial]')
  .description('Enable USB tethering.')
  .action(async (serial?: string) => {
    const device = await getClientDevice(serial);
    if (await device.extra.usbTethering(false)) {
      console.log('tethering enabled');
      await device.extra.back();
    } else {
      console.log('failed or already enabled');
    }
  });

program
  .command('airplane-mode-on [serial]')
  .description('Enable airplane.')
  .action(async (serial?: string) => {
    const device = await getClientDevice(serial);
    if (await device.extra.airPlainMode(true)) {
      console.log('airplane enabled');
      await device.extra.back();
    } else {
      console.log('airplane or already enabled');
      process.exit(1);
    }
  });

program
  .command('airplane-mode-off [serial]')
  .description('Disable airplane.')
  .action(async (serial?: string) => {
    const device = await getClientDevice(serial);
    if (await device.extra.airPlainMode(false)) {
      console.log('airplane disabled');
      await device.extra.back();
    } else {
      console.log('airplane or already enabled');
      process.exit(1);
    }
  });

program
  .command('airplane-mode-on-off [serial]')
  .description('Enable then Disable airplane.')
  .action(async (serial?: string) => {
    const device = await getClientDevice(serial);
    await device.extra.airPlainMode(true)
    await device.extra.back();
    if (await device.extra.airPlainMode(false)) {
      console.log('airplane disabled');
      await device.extra.back();
    } else {
      console.log('airplane or already enabled');
      process.exit(1);
    }
  });

program.parse(process.argv);

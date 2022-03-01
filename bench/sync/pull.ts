/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { spawn } from 'child_process';
import Adb from '../../src/adb';
const Bench = require('bench');

const deviceId = process.env.DEVICE_ID || '';

const deviceParams = deviceId ? [ '-s', deviceId ] : [];

module.exports = {
  compareCount: 3,
  compare: {
    'pull /dev/graphics/fb0 using ADB CLI'(done: () => void) {
      const proc = spawn('adb', [...deviceParams, 'pull', '/dev/graphics/fb0', '/dev/null']);
      return proc.stdout.on('end', done);
    },
    async 'pull /dev/graphics/fb0 using client.pull()'(done: () => void) {
      const client = Adb.createClient();
      const stream = await client
        .getDevice(deviceId)
        .pull('/dev/graphics/fb0');
      stream.resume();
      return stream.on('end', done);
    },
  },
};

Bench.runMain();

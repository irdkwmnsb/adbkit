# adbkit

[![NPM Version](https://img.shields.io/npm/v/@u4/adbkit.svg?style=flat)](https://www.npmjs.org/package/@u4/adbkit)

**adbkit** is a pure [Node.js][nodejs] client for the [Android Debug Bridge][adb-site] server. It can be used either as a library in your own application, or simply as a convenient utility for playing with your device.

Most of the `adb` command line tool's functionality is supported (including pushing/pulling files, installing APKs and processing logs), with some added functionality such as being able to generate touch/key events and take screenshots. Some shims are provided for older devices, but we have not and will not test anything below Android 2.3.

Internally, we use this library to drive a multitude of Android devices from a variety of manufacturers, so we can say with a fairly high degree of confidence that it will most likely work with your device(s), too.

## Requirements

*   [Node.js][nodejs] >= 14
*   The `adb` command line tool

Please note that although it may happen at some point, **this project is NOT an implementation of the ADB *server***. The target host (where the devices are connected) must still have ADB installed and either already running (e.g. via `adb start-server`) or available in `$PATH`. An attempt will be made to start the server locally via the aforementioned command if the initial connection fails. This is the only case where we fall back to the `adb` binary.

When targeting a remote host, starting the server is entirely your responsibility.

Alternatively, you may want to consider using the Chrome [ADB][chrome-adb] extension, as it includes the ADB server and can be started/stopped quite easily.

For Linux users, adb need `plugdev` group acess, So you may need to add your current user to `plugdev` group.
`sudo usermod -a -G plugdev $USER`

## Getting started

Install via NPM:

```bash
npm install --save @u4/adbkit
```

We use [debug][node-debug], and our debug namespace is `adb`. Some of the dependencies may provide debug output of their own. To see the debug output, set the `DEBUG` environment variable. For example, run your program with `DEBUG=adb:* node app.js`.

### Examples

The examples may be a bit verbose, but that's because we're trying to keep them as close to real-life code as possible, with flow control and error handling taken care of.

#### List devices withPath

```typescript
import Adb from '@u4/adbkit';
const client = Adb.createClient();
const devices = client.listDevicesWithPaths();
devices.then((devices) => {
    devices.forEach(function (d) {
        console.log('id: ' + d.id);
        console.log('type: ' + d.type);
        console.log('model ' + d.model);
        console.log('path: ' + d.path);
        console.log('product: ' + d.product);
        console.log('transportId: ' + d.transportId + '\n');
    });
});
```

#### Checking for NFC support

```typescript
import Bluebird from 'bluebird';
import Adb from '@u4/adbkit';

const client = Adb.createClient();

const test = async () => {
    try {
        const devices = await client.listDevices();
        const supportedDevices = await Bluebird.filter(devices, async (device) => {
            const features = await client.getFeatures(device.id);
            return features['android.hardware.nfc'];
        });
        console.log('The following devices support NFC:', supportedDevices);
    } catch (err) {
        console.error('Something went wrong:', err.stack);
    }
};
```

#### Installing an APK

```typescript
import Bluebird from 'bluebird';
import Adb from '@u4/adbkit';

const client = Adb.createClient();
const apk = 'vendor/app.apk';

const test = async () => {
    try {
        const devices = await client.listDevices();
        await Bluebird.map(devices, (device) => client.install(device.id, apk));
        console.log(`Installed ${apk} on all connected devices`);
    } catch (err) {
        console.error('Something went wrong:', err.stack);
    }
};
```

#### Tracking devices

```typescript
import Adb from '@u4/adbkit';

const client = Adb.createClient();
const test = async () => {
    try {
        const tracker = await client.trackDevices();
        tracker.on('add', (device) => console.log('Device %s was plugged in', device.id));
        tracker.on('remove', (device) => console.log('Device %s was unplugged', device.id));
        tracker.on('end', () => console.log('Tracking stopped'));
    } catch (err) {
        console.error('Something went wrong:', err.stack);
    }
};
```

#### Pulling a file from all connected devices

```typescript
import Bluebird from 'bluebird';
import fs from 'fs';
import Adb from '@u4/adbkit';
const client = Adb.createClient();

const test = async () => {
    try {
        const devices = await client.listDevices();
        await Bluebird.map(devices, async (device) => {
            const transfer = await client.pull(device.id, '/system/build.prop');
            const fn = `/tmp/${device.id}.build.prop`;
            await new Bluebird((resolve, reject) => {
                transfer.on('progress', (stats) =>
                    console.log(`[${device.id}] Pulled ${stats.bytesTransferred} bytes so far`),
                );
                transfer.on('end', () => {
                    console.log(`[${device.id}] Pull complete`);
                    resolve(device.id);
                });
                transfer.on('error', reject);
                transfer.pipe(fs.createWriteStream(fn));
            });
        });
        console.log('Done pulling /system/build.prop from all connected devices');
    } catch (err) {
        console.error('Something went wrong:', err.stack);
    }
};
```

#### Pushing a file to all connected devices

```typescript
import Bluebird from 'bluebird';
import Adb from '@u4/adbkit';
const client = Adb.createClient();

const test = async () => {
    try {
        const devices = await client.listDevices();
        await Bluebird.map(devices, async (device) => {
            const transfer = await client.push(device.id, 'temp/foo.txt', '/data/local/tmp/foo.txt');
            await new Bluebird(function (resolve, reject) {
                transfer.on('progress', (stats) =>
                    console.log(`[${device.id}] Pushed ${stats.bytesTransferred} bytes so far`),
                );
                transfer.on('end', () => {
                    console.log('[${device.id}] Push complete');
                    resolve();
                });
                transfer.on('error', reject);
            });
        });
        console.log('Done pushing foo.txt to all connected devices');
    } catch (err) {
        console.error('Something went wrong:', err.stack);
    }
};
```

#### List files in a folder

```typescript
import Bluebird from 'bluebird';
import Adb from '@u4/adbkit';
const client = Adb.createClient();

const test = async () => {
    try {
        const devices = await client.listDevices();
        await Bluebird.map(devices, async (device) => {
            const files = await client.readdir(device.id, '/sdcard');
            // Synchronous, so we don't have to care about returning at the
            // right time
            files.forEach((file) => {
                if (file.isFile()) {
                    console.log(`[${device.id}] Found file "${file.name}"`);
                }
            });
        });
        console.log('Done checking /sdcard files on connected devices');
    } catch (err) {
        console.error('Something went wrong:', err.stack);
    }
};
```

## ADB

### adb.createClient(\[options])

Creates a client instance with the provided options. Note that this will not automatically establish a connection, it will only be done when necessary.

*   **options** An object compatible with [Net.connect][net-connect]'s options:
    *   **port** The port where the ADB server is listening. Defaults to `5037`.
    *   **host** The host of the ADB server. Defaults to `'127.0.0.1'`.
    *   **bin** As the sole exception, this option provides the path to the `adb` binary, used for starting the server locally if initial connection fails. Defaults to `'adb'`.
*   Returns: The client instance.

### adb

see [docs/adb.md](https://github.com/UrielCh/adbkit/blob/master/docs/adb.md)


### adb.util

see [docs/Client.md](https://github.com/UrielCh/adbkit/blob/master/docs/Util.md)

### Client

see [docs/Client.md](https://github.com/UrielCh/adbkit/blob/master/docs/Client.md)

### Sync

see [docs/Sync.md](https://github.com/UrielCh/adbkit/blob/master/docs/Sync.md)

### PushTransfer

see [docs/PushTransfer.md](https://github.com/UrielCh/adbkit/blob/master/docs/PushTransfer.md)

### PullTransfer

see [docs/PullTransfer.md](https://github.com/UrielCh/adbkit/blob/master/docs/PullTransfer.md)

`PullTransfer` is a [`Stream`][node-stream]. Use [`fs.createWriteStream()`][node-fs] to pipe the stream to a file if necessary.

List of events:

*   **progress** **(stats)** Emitted when a new chunk is received.
    *   **stats** An object with the following stats about the transfer:
        *   **bytesTransferred** The number of bytes transferred so far.
*   **error** **(err)** Emitted on error.
    *   **err** An `Error`.
*   **end** Emitted when the transfer has successfully completed.


# Incompatible changes in version 3.x

- Previously, adbKit was based on Bluebird, It's now based on native Promise some Bluebird Promise cannelation is not compatible with ES6 Promises.
- v4 is Object oriented functions taking a serial as first parameter had been moved to DeviceClient

## More information

*   [Android Debug Bridge][adb-site]
    *   [SERVICES.TXT][adb-services] (ADB socket protocol)
*   [Android ADB Protocols][adb-protocols] (a blog post explaining the protocol)
*   [adb.js][adb-js] (another Node.js ADB implementation)
*   [ADB Chrome extension][chrome-adb]

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE).

Copyright © The OpenSTF Project. All Rights Reserved.

[nodejs]: http://nodejs.org/

[npm]: https://npmjs.org/

[adb-js]: https://github.com/flier/adb.js

[adb-site]: http://developer.android.com/tools/help/adb.html

[adb-services]: https://github.com/android/platform_system_core/blob/master/adb/SERVICES.TXT

[adb-protocols]: http://blogs.kgsoft.co.uk/2013_03_15_prg.htm

[file_sync_service.h]: https://github.com/android/platform_system_core/blob/master/adb/file_sync_service.h

[chrome-adb]: https://chrome.google.com/webstore/detail/adb/dpngiggdglpdnjdoaefidgiigpemgage

[node-debug]: https://npmjs.org/package/debug

[net-connect]: http://nodejs.org/api/net.html#net_net_connect_options_connectionlistener

[node-events]: http://nodejs.org/api/events.html

[node-stream]: http://nodejs.org/api/stream.html

[node-buffer]: http://nodejs.org/api/buffer.html

[node-net]: http://nodejs.org/api/net.html

[node-fs]: http://nodejs.org/api/fs.html

[node-fs-stats]: http://nodejs.org/api/fs.html#fs_class_fs_stats

[adbkit-logcat]: https://npmjs.org/package/@u4/adbkit-logcat

[adbkit-monkey]: https://npmjs.org/package/@u4/adbkit-monkey

[@yume-chan/adb](https://www.npmjs.com/package/@yume-chan/adb) a browser adb implementation

# CHANGELOG

## v3.1.7

* thirdparty starts function retuns Promise<this>
* thirdparty starts function get resolved once fully initalized
* add host-serial:killforward command
* improve error messages
* add some exception catchs

## v3.1.6 (2022-04-01)

* fix STFService localisation code
* fix STFService message parsing
* add STFService agent
* add STFService minitouchagent
* drop port fowarding from thirdparty apis
* expose STFService options

## v3.1.5 (2022-03-29)

* add DeviceClient.exec()
* add DeviceClient.execOut()
* add build-in minicap, relating on @devicefarmer/minicap-prebuilt depencency, see DeviceClient.minicap()
* add build-in STFService see DeviceClient.STFService()
* export Scrcpy const enums

## v3.1.4 (2022-03-24)

* fix scrcpy-server jar location
* refactor dist folder
* foward scrcpyServer error to emit('error')

## v3.1.3 (2022-03-24)

* fix scrcpy-server ControlMessages
* Improve ProcStat typing (add events)
* add parameter to reboot command

## v3.1.2 (2022-03-07)

* upgrade scrcpy-server to V 1.20
* add scrcpy controller commandes, see DeviceClient.scrcpy()

## v3.1.1 (2022-03-07)

* fix error in package.json dependences

## v3.1.0 (2022-03-02)

* add ip route command
* add ip rule command
* add scrcpy from [node-scrcpy-client](https://github.com/jvictorsoto/node-scrcpy-client) directly in DeviceClient
* fix event registration leaks.
* add waitForEnd() in transfert Object.
* add sudo flag in command
* DeviceClient can be obtain from a Device object using getClient()
* drop all bluebird references, use only native Promise.
* bump all depencences
* replace @devicefarmer/adbkit-monkey by @u4/adbkit-monkey
* replace @devicefarmer/adbkit-logcat by @u4/adbkit-logcat
* lint codebase
* sync 2 changes from @devicefarmer/adbkit

## v3.0.3 (2021-04-22)

* add `service` functions (list, check and call) will be improve in next versions.

## v3.0.2 (2021-04-06)

* add `ps` function.

## v3.0.1 (2021-02-17)

* add Utils in exports.

## v3.0.0 (2021-02-01)

* forked first release

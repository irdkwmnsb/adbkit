export { createClient, type AdbOptions } from './adb';
export type { ClientOptions } from './models/ClientOptions';
export type { DeviceClientOptions } from './models/DeviceClientOptions';

export type { CpuStats, Loads } from './models/CpuStats';
export type { default as Device, DeviceType } from './models/Device';

export type { default as DeviceWithPath } from './models/DeviceWithPath';
export type { default as ExtendedPublicKey } from './models/ExtendedPublicKey';
export type { Features } from './models/Features';
export type { default as Forward } from './models/Forward';
export type { default as FramebufferMeta } from './models/FramebufferMeta';
export type { default as FramebufferStreamWithMeta } from './models/FramebufferStreamWithMeta';
export type { Properties } from './models/Properties';
export type { default as Reverse } from './models/Reverse';
export type { default as SocketOptions } from './models/SocketOptions';
export type { default as StartActivityOptions } from './models/StartActivityOptions';
export type { default as StartServiceOptions, ExtraValue, ExtraObject, Extra } from './models/StartServiceOptions';
export type { default as TrackerChangeSet } from './models/TrackerChangeSet';
export type { default as WithToString } from './models/WithToString';
export type { ColorFormat } from './models/FramebufferMeta'

export { default as Service, PrematurePacketError, LateTransportError } from './adb/tcpusb/service';
export { default as ServiceMap } from './adb/tcpusb/servicemap';
export { default as RollingCounter } from './adb/tcpusb/rollingcounter';
export { default as Packet } from './adb/tcpusb/packet';
export { default as Socket, AuthError, UnauthorizedError } from './adb/tcpusb/socket';
export { default as PacketReader, ChecksumError, MagicError } from './adb/tcpusb/packetreader';
export { default as Parser } from './adb/parser';
export { AdbUnexpectedDataError, AdbPrematureEOFError, AdbFailError, AdbError } from './adb/errors';

export { default as Client } from './adb/client';
export { default as DeviceClient } from './adb/DeviceClient';
export { default as Connection } from './adb/connection';
export { default as TcpUsbServer } from './adb/tcpusb/server';
export { default as Tracker } from './adb/tracker';
export { default as DeviceClientExtra } from './adb/DeviceClientExtra';
export { default as JdwpTracker } from './adb/jdwptracker';

export { default as Sync } from './adb/sync';
export { default as PullTransfer } from './adb/sync/pulltransfer';
export { default as Pushtransfer } from './adb/sync/pushtransfer';
export { default as Entry64 } from './adb/sync/entry64'
export { default as Entry } from './adb/sync/entry'
export { default as Stats64 } from './adb/sync/stats64'
export { default as Stats } from './adb/sync/stats'

export { default as ProcStat } from './adb/proc/stat'
export type { LoadsWithLine, CpuStatsWithLine, ProcStats } from './adb/proc/stat'

export { KeyEvent } from './adb/thirdparty/STFService/STFServiceModel';
export type { KeyEventRequest } from './adb/thirdparty/STFService/STFServiceModel';

// export android key enumeration
export { KeyCodes } from './adb/keycode';


export type { RebootType, PsEntry, ProcessState, AdbServiceInfo } from './adb/command/host-transport/';
export { ShellCommand, IpRuleEntry, IpRouteEntry } from './adb/command/host-transport/';

export type { ServiceCallArg, ServiceCallArgNumber, ServiceCallArgString, ServiceCallArgNull } from './adb/command/host-transport/serviceCall';
export { default as ServiceCallCommand, ParcelReader } from './adb/command/host-transport/serviceCall';

// give access to Utils class ( readAll and parsePublicKey)
export { default as Utils } from './adb/utils';

export { default as Scrcpy } from './adb/thirdparty/scrcpy/Scrcpy';
export { MotionEvent, DeviceMessageType, SurfaceControl, Orientation, KeyEventMeta } from './adb/thirdparty/scrcpy/ScrcpyConst';

export type { MinicapOptions } from './adb/thirdparty/minicap/Minicap';
export { default as Minicap } from './adb/thirdparty/minicap/Minicap';

export { type STFServiceOptions } from './adb/thirdparty/STFService/STFService';
export { default as STFService } from './adb/thirdparty/STFService/STFService';
export { type MyMessage } from './adb/thirdparty/STFService/STFServiceBuf';
export { default as STFServiceBuf } from './adb/thirdparty/STFService/STFServiceBuf';

export type { Point, ScrcpyOptions, VideoStreamFramePacket, H264Configuration } from './adb/thirdparty/scrcpy/ScrcpyModels';

export { default as DevicePackage, } from './adb/DevicePackage';
export type { PackageInfo } from './adb/DevicePackage';

/**
 * main entry point
 */
import { createClient } from './adb';

import { default as util } from './adb/utils';

/**
 * Keep @u4/adbkit v3.x old adb export
 */
export const Adb = {
  util,
  createClient
}

export * as STFServiceModel from './adb/thirdparty/STFService/STFServiceModel';


/**
 * Keep @u4/adbkit v3.x default export shape
 */
export default Adb;
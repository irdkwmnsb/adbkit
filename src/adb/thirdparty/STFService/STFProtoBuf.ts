import { Message, Root, load } from 'protobufjs';
import ThirdUtils from '../ThirdUtils';
import * as STF from './STFServiceModel';

let singleton: Promise<STFProtoBuf> | null = null;

type MyMessage<T extends object = object> = Message<T> & T;

let root: Root;

export default class STFProtoBuf {
  private static async internalInit(): Promise<STFProtoBuf> {
    const proto = ThirdUtils.getResource('wireService.proto');
    const _root = await load(proto);
    root = _root;
    return new STFProtoBuf(_root);
  }

  public static get(): Promise<STFProtoBuf> {
    if (!singleton) singleton = this.internalInit();
    return singleton;
  }

  private constructor(private _root: Root) {
  }

  get root(): Root {
    return this._root;
  }

  readEnvelope(data: Uint8Array): MyMessage<STF.Envelope> {
    const type = root.lookupType('Envelope');
    return type.decodeDelimited(data) as MyMessage<STF.Envelope>;
  }

  public write = {
    EnvelopeType: root.lookupType('Envelope'),
    Envelope(env: STF.Envelope): Buffer {
      const type = root.lookupType('Envelope');
      return Buffer.from(type.encodeDelimited(env).finish());
    },
    GetAccountsRequest(req: STF.GetAccountsRequest): Buffer {
      const type = root.lookupType('GetAccountsRequest');
      return Buffer.from(type.encode(req).finish());
    },
    GetBrowsersRequest(): Buffer {
      const type = root.lookupType('GetBrowsersResponse');
      return Buffer.from(type.encode({}).finish());
    },
    GetClipboardRequest(req: STF.GetClipboardRequest): Buffer {
      const type = root.lookupType('GetClipboardResponse');
      return Buffer.from(type.encode(req).finish());
    },
    GetPropertiesRequest(req: STF.GetPropertiesRequest): Buffer {
      const type = root.lookupType('GetPropertiesRequest');
      return Buffer.from(type.encode(req).finish());
    },
    GetDisplayRequest(req: STF.GetDisplayRequest): Buffer {
      const type = root.lookupType('GetDisplayRequest');
      return Buffer.from(type.encode(req).finish());
    },
    GetRingerModeRequest(): Buffer {
      const type = root.lookupType('GetRingerModeRequest');
      return Buffer.from(type.encode({}).finish());
    },
    GetSdStatusRequest(): Buffer {
      const type = root.lookupType('GetSdStatusRequest');
      return Buffer.from(type.encode({}).finish());
    },
    GetVersionResponse(): Buffer {
      const type = root.lookupType('GetVersionResponse');
      return Buffer.from(type.encode({}).finish());
    },
    GetWifiStatus(): Buffer {
      const type = root.lookupType('GetWifiStatus');
      return Buffer.from(type.encode({}).finish());
    },
    GetVersionRequest(): Buffer {
      const type = root.lookupType('GetVersionRequest');
      return Buffer.from(type.encode({}).finish());
    },
    GetWifiStatusRequest(): Buffer {
      const type = root.lookupType('GetWifiStatusRequest');
      return Buffer.from(type.encode({}).finish());
    },
    GetBluetoothStatusRequest(): Buffer {
      const type = root.lookupType('GetBluetoothStatusRequest');
      return Buffer.from(type.encode({}).finish());
    },
    GetRootStatusRequest(): Buffer {
      const type = root.lookupType('GetRootStatusRequest');
      return Buffer.from(type.encode({}).finish());
    },
    SetClipboardRequest(req: STF.SetClipboardRequest): Buffer {
      const type = root.lookupType('SetClipboardRequest');
      return Buffer.from(type.encode(req).finish());
    },
    SetKeyguardStateRequest(req: STF.SetKeyguardStateRequest): Buffer {
      const type = root.lookupType('SetKeyguardStateRequest');
      return Buffer.from(type.encode(req).finish());
    },
    SetWakeLockRequest(req: STF.SetWakeLockRequest): Buffer {
      const type = root.lookupType('SetWakeLockRequest');
      return Buffer.from(type.encode(req).finish());
    },
    SetRingerModeRequest(req: STF.SetRingerModeRequest): Buffer {
      const type = root.lookupType('SetRingerModeRequest');
      return Buffer.from(type.encode(req).finish());
    },
    SetRotationRequest(req: STF.SetRotationRequest): Buffer {
      const type = root.lookupType('SetRotationRequest');
      return Buffer.from(type.encode(req).finish());
    },
    SetWifiEnabledRequest(req: STF.SetWifiEnabledRequest): Buffer {
      const type = root.lookupType('SetWifiEnabledRequest');
      return Buffer.from(type.encode(req).finish());
    },
    SetBluetoothEnabledRequest(req: STF.SetBluetoothEnabledRequest): Buffer {
      const type = root.lookupType('SetBluetoothEnabledRequest');
      return Buffer.from(type.encode(req).finish());
    },
    SetMasterMuteRequest(req: STF.SetMasterMuteRequest): Buffer {
      const type = root.lookupType('SetMasterMuteRequest');
      return Buffer.from(type.encode(req).finish());
    },
  }

  public read = {
    AirplaneModeEvent(data: Uint8Array): MyMessage<STF.AirplaneModeEvent> {
      const typeEnvelope = root.lookupType('AirplaneModeEvent');
      return typeEnvelope.decode(data) as MyMessage<STF.AirplaneModeEvent>;
    },
    BatteryEvent(data: Uint8Array): MyMessage<STF.BatteryEvent> {
      const typeEnvelope = root.lookupType('BatteryEvent');
      return typeEnvelope.decode(data) as MyMessage<STF.BatteryEvent>;
    },
    ConnectivityEvent(data: Uint8Array): MyMessage<STF.ConnectivityEvent> {
      const typeEnvelope = root.lookupType('ConnectivityEvent');
      return typeEnvelope.decode(data) as MyMessage<STF.ConnectivityEvent>;
    },
    RotationEvent(data: Uint8Array): MyMessage<STF.RotationEvent> {
      const typeEnvelope = root.lookupType('RotationEvent');
      return typeEnvelope.decode(data) as MyMessage<STF.RotationEvent>;
    },
    PhoneStateEvent(data: Uint8Array): MyMessage<STF.PhoneStateEvent> {
      const typeEnvelope = root.lookupType('PhoneStateEvent');
      return typeEnvelope.decode(data) as MyMessage<STF.PhoneStateEvent>;
    },
    BrowserPackageEvent(data: Uint8Array): MyMessage<STF.BrowserPackageEvent> {
      const typeEnvelope = root.lookupType('BrowserPackageEvent');
      return typeEnvelope.decode(data) as MyMessage<STF.BrowserPackageEvent>;
    },
    GetAccountsResponse(data: Uint8Array): MyMessage<STF.GetAccountsResponse> {
      const typeEnvelope = root.lookupType('GetAccountsResponse');
      return typeEnvelope.decode(data) as MyMessage<STF.GetAccountsResponse>;
    },
    GetBluetoothStatusResponse(data: Uint8Array): MyMessage<STF.GetBluetoothStatusResponse> {
      const typeEnvelope = root.lookupType('GetBluetoothStatusResponse');
      return typeEnvelope.decode(data) as MyMessage<STF.GetBluetoothStatusResponse>;
    },
    GetBrowsersResponse(data: Uint8Array): MyMessage<STF.GetBrowsersResponse> {
      const typeEnvelope = root.lookupType('GetBrowsersResponse');
      return typeEnvelope.decode(data) as MyMessage<STF.GetBrowsersResponse>;
    },
  }
}
// generarted by genProto.ts
import { Message, Root, load } from 'protobufjs';
import ThirdUtils from '../ThirdUtils';
import * as STF from './STFAgentModel';

let singleton: Promise<STFAgentBuf> | null = null;
type MyMessage<T extends object = object> = Message<T> & T;
let root: Root;

export default class STFAgentBuf {
  private static async internalInit(): Promise<STFAgentBuf> {
    const proto = ThirdUtils.getResource('wireAgent.proto');
    const _root = await load(proto);
    root = _root;
    return new STFAgentBuf(_root);
  }

  public static get(): Promise<STFAgentBuf> {
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
    return type.decode(data) as MyMessage<STF.Envelope>;
  }
  
  readEnvelopeDelimited(data: Uint8Array): MyMessage<STF.Envelope> {
    const type = root.lookupType('Envelope');
    return type.decodeDelimited(data) as MyMessage<STF.Envelope>;
  }

  public write = {
    Envelope(env: STF.Envelope): Buffer {
      const type = root.lookupType('Envelope');
      return Buffer.from(type.encodeDelimited(env).finish());
    },
    UpdateAccessTokenMessage(req: STF.UpdateAccessTokenMessage): Buffer {
      const type = root.lookupType('UpdateAccessTokenMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeleteUserMessage(req: STF.DeleteUserMessage): Buffer {
      const type = root.lookupType('DeleteUserMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceOriginGroupMessage(req: STF.DeviceOriginGroupMessage): Buffer {
      const type = root.lookupType('DeviceOriginGroupMessage');
      return Buffer.from(type.encode(req).finish());
    },
    UserChangeMessage(req: STF.UserChangeMessage): Buffer {
      const type = root.lookupType('UserChangeMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceChangeMessage(req: STF.DeviceChangeMessage): Buffer {
      const type = root.lookupType('DeviceChangeMessage');
      return Buffer.from(type.encode(req).finish());
    },
    GroupChangeMessage(req: STF.GroupChangeMessage): Buffer {
      const type = root.lookupType('GroupChangeMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceGroupChangeMessage(req: STF.DeviceGroupChangeMessage): Buffer {
      const type = root.lookupType('DeviceGroupChangeMessage');
      return Buffer.from(type.encode(req).finish());
    },
    GroupUserChangeMessage(req: STF.GroupUserChangeMessage): Buffer {
      const type = root.lookupType('GroupUserChangeMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ConnectStartedMessage(req: STF.ConnectStartedMessage): Buffer {
      const type = root.lookupType('ConnectStartedMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ConnectStoppedMessage(req: STF.ConnectStoppedMessage): Buffer {
      const type = root.lookupType('ConnectStoppedMessage');
      return Buffer.from(type.encode(req).finish());
    },
    FileSystemListMessage(req: STF.FileSystemListMessage): Buffer {
      const type = root.lookupType('FileSystemListMessage');
      return Buffer.from(type.encode(req).finish());
    },
    FileSystemGetMessage(req: STF.FileSystemGetMessage): Buffer {
      const type = root.lookupType('FileSystemGetMessage');
      return Buffer.from(type.encode(req).finish());
    },
    TransactionProgressMessage(req: STF.TransactionProgressMessage): Buffer {
      const type = root.lookupType('TransactionProgressMessage');
      return Buffer.from(type.encode(req).finish());
    },
    TransactionDoneMessage(req: STF.TransactionDoneMessage): Buffer {
      const type = root.lookupType('TransactionDoneMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceLogMessage(req: STF.DeviceLogMessage): Buffer {
      const type = root.lookupType('DeviceLogMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceGroupOwnerMessage(req: STF.DeviceGroupOwnerMessage): Buffer {
      const type = root.lookupType('DeviceGroupOwnerMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceGroupLifetimeMessage(req: STF.DeviceGroupLifetimeMessage): Buffer {
      const type = root.lookupType('DeviceGroupLifetimeMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceGroupMessage(req: STF.DeviceGroupMessage): Buffer {
      const type = root.lookupType('DeviceGroupMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ProviderMessage(req: STF.ProviderMessage): Buffer {
      const type = root.lookupType('ProviderMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceHeartbeatMessage(req: STF.DeviceHeartbeatMessage): Buffer {
      const type = root.lookupType('DeviceHeartbeatMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceIntroductionMessage(req: STF.DeviceIntroductionMessage): Buffer {
      const type = root.lookupType('DeviceIntroductionMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceRegisteredMessage(req: STF.DeviceRegisteredMessage): Buffer {
      const type = root.lookupType('DeviceRegisteredMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DevicePresentMessage(req: STF.DevicePresentMessage): Buffer {
      const type = root.lookupType('DevicePresentMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceAbsentMessage(req: STF.DeviceAbsentMessage): Buffer {
      const type = root.lookupType('DeviceAbsentMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceReadyMessage(req: STF.DeviceReadyMessage): Buffer {
      const type = root.lookupType('DeviceReadyMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ProbeMessage(req: STF.ProbeMessage): Buffer {
      const type = root.lookupType('ProbeMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceStatusMessage(req: STF.DeviceStatusMessage): Buffer {
      const type = root.lookupType('DeviceStatusMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceDisplayMessage(req: STF.DeviceDisplayMessage): Buffer {
      const type = root.lookupType('DeviceDisplayMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceBrowserAppMessage(req: STF.DeviceBrowserAppMessage): Buffer {
      const type = root.lookupType('DeviceBrowserAppMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceBrowserMessage(req: STF.DeviceBrowserMessage): Buffer {
      const type = root.lookupType('DeviceBrowserMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DevicePhoneMessage(req: STF.DevicePhoneMessage): Buffer {
      const type = root.lookupType('DevicePhoneMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceIdentityMessage(req: STF.DeviceIdentityMessage): Buffer {
      const type = root.lookupType('DeviceIdentityMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DevicePropertiesMessage(req: STF.DevicePropertiesMessage): Buffer {
      const type = root.lookupType('DevicePropertiesMessage');
      return Buffer.from(type.encode(req).finish());
    },
    OwnerMessage(req: STF.OwnerMessage): Buffer {
      const type = root.lookupType('OwnerMessage');
      return Buffer.from(type.encode(req).finish());
    },
    GroupMessage(req: STF.GroupMessage): Buffer {
      const type = root.lookupType('GroupMessage');
      return Buffer.from(type.encode(req).finish());
    },
    AutoGroupMessage(req: STF.AutoGroupMessage): Buffer {
      const type = root.lookupType('AutoGroupMessage');
      return Buffer.from(type.encode(req).finish());
    },
    UngroupMessage(req: STF.UngroupMessage): Buffer {
      const type = root.lookupType('UngroupMessage');
      return Buffer.from(type.encode(req).finish());
    },
    JoinGroupMessage(req: STF.JoinGroupMessage): Buffer {
      const type = root.lookupType('JoinGroupMessage');
      return Buffer.from(type.encode(req).finish());
    },
    JoinGroupByAdbFingerprintMessage(req: STF.JoinGroupByAdbFingerprintMessage): Buffer {
      const type = root.lookupType('JoinGroupByAdbFingerprintMessage');
      return Buffer.from(type.encode(req).finish());
    },
    JoinGroupByVncAuthResponseMessage(req: STF.JoinGroupByVncAuthResponseMessage): Buffer {
      const type = root.lookupType('JoinGroupByVncAuthResponseMessage');
      return Buffer.from(type.encode(req).finish());
    },
    AdbKeysUpdatedMessage(req: STF.AdbKeysUpdatedMessage): Buffer {
      const type = root.lookupType('AdbKeysUpdatedMessage');
      return Buffer.from(type.encode(req).finish());
    },
    VncAuthResponsesUpdatedMessage(req: STF.VncAuthResponsesUpdatedMessage): Buffer {
      const type = root.lookupType('VncAuthResponsesUpdatedMessage');
      return Buffer.from(type.encode(req).finish());
    },
    LeaveGroupMessage(req: STF.LeaveGroupMessage): Buffer {
      const type = root.lookupType('LeaveGroupMessage');
      return Buffer.from(type.encode(req).finish());
    },
    PhysicalIdentifyMessage(req: STF.PhysicalIdentifyMessage): Buffer {
      const type = root.lookupType('PhysicalIdentifyMessage');
      return Buffer.from(type.encode(req).finish());
    },
    TouchDownMessage(req: STF.TouchDownMessage): Buffer {
      const type = root.lookupType('TouchDownMessage');
      return Buffer.from(type.encode(req).finish());
    },
    TouchMoveMessage(req: STF.TouchMoveMessage): Buffer {
      const type = root.lookupType('TouchMoveMessage');
      return Buffer.from(type.encode(req).finish());
    },
    TouchUpMessage(req: STF.TouchUpMessage): Buffer {
      const type = root.lookupType('TouchUpMessage');
      return Buffer.from(type.encode(req).finish());
    },
    TouchCommitMessage(req: STF.TouchCommitMessage): Buffer {
      const type = root.lookupType('TouchCommitMessage');
      return Buffer.from(type.encode(req).finish());
    },
    TouchResetMessage(req: STF.TouchResetMessage): Buffer {
      const type = root.lookupType('TouchResetMessage');
      return Buffer.from(type.encode(req).finish());
    },
    GestureStartMessage(req: STF.GestureStartMessage): Buffer {
      const type = root.lookupType('GestureStartMessage');
      return Buffer.from(type.encode(req).finish());
    },
    GestureStopMessage(req: STF.GestureStopMessage): Buffer {
      const type = root.lookupType('GestureStopMessage');
      return Buffer.from(type.encode(req).finish());
    },
    TypeMessage(req: STF.TypeMessage): Buffer {
      const type = root.lookupType('TypeMessage');
      return Buffer.from(type.encode(req).finish());
    },
    PasteMessage(req: STF.PasteMessage): Buffer {
      const type = root.lookupType('PasteMessage');
      return Buffer.from(type.encode(req).finish());
    },
    CopyMessage(req: STF.CopyMessage): Buffer {
      const type = root.lookupType('CopyMessage');
      return Buffer.from(type.encode(req).finish());
    },
    KeyDownMessage(req: STF.KeyDownMessage): Buffer {
      const type = root.lookupType('KeyDownMessage');
      return Buffer.from(type.encode(req).finish());
    },
    KeyUpMessage(req: STF.KeyUpMessage): Buffer {
      const type = root.lookupType('KeyUpMessage');
      return Buffer.from(type.encode(req).finish());
    },
    KeyPressMessage(req: STF.KeyPressMessage): Buffer {
      const type = root.lookupType('KeyPressMessage');
      return Buffer.from(type.encode(req).finish());
    },
    RebootMessage(req: STF.RebootMessage): Buffer {
      const type = root.lookupType('RebootMessage');
      return Buffer.from(type.encode(req).finish());
    },
    DeviceLogcatEntryMessage(req: STF.DeviceLogcatEntryMessage): Buffer {
      const type = root.lookupType('DeviceLogcatEntryMessage');
      return Buffer.from(type.encode(req).finish());
    },
    LogcatStartMessage(req: STF.LogcatStartMessage): Buffer {
      const type = root.lookupType('LogcatStartMessage');
      return Buffer.from(type.encode(req).finish());
    },
    LogcatStopMessage(req: STF.LogcatStopMessage): Buffer {
      const type = root.lookupType('LogcatStopMessage');
      return Buffer.from(type.encode(req).finish());
    },
    LogcatApplyFiltersMessage(req: STF.LogcatApplyFiltersMessage): Buffer {
      const type = root.lookupType('LogcatApplyFiltersMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ShellCommandMessage(req: STF.ShellCommandMessage): Buffer {
      const type = root.lookupType('ShellCommandMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ShellKeepAliveMessage(req: STF.ShellKeepAliveMessage): Buffer {
      const type = root.lookupType('ShellKeepAliveMessage');
      return Buffer.from(type.encode(req).finish());
    },
    InstallMessage(req: STF.InstallMessage): Buffer {
      const type = root.lookupType('InstallMessage');
      return Buffer.from(type.encode(req).finish());
    },
    UninstallMessage(req: STF.UninstallMessage): Buffer {
      const type = root.lookupType('UninstallMessage');
      return Buffer.from(type.encode(req).finish());
    },
    LaunchActivityMessage(req: STF.LaunchActivityMessage): Buffer {
      const type = root.lookupType('LaunchActivityMessage');
      return Buffer.from(type.encode(req).finish());
    },
    RotateMessage(req: STF.RotateMessage): Buffer {
      const type = root.lookupType('RotateMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ForwardTestMessage(req: STF.ForwardTestMessage): Buffer {
      const type = root.lookupType('ForwardTestMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ForwardCreateMessage(req: STF.ForwardCreateMessage): Buffer {
      const type = root.lookupType('ForwardCreateMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ForwardRemoveMessage(req: STF.ForwardRemoveMessage): Buffer {
      const type = root.lookupType('ForwardRemoveMessage');
      return Buffer.from(type.encode(req).finish());
    },
    BrowserOpenMessage(req: STF.BrowserOpenMessage): Buffer {
      const type = root.lookupType('BrowserOpenMessage');
      return Buffer.from(type.encode(req).finish());
    },
    BrowserClearMessage(req: STF.BrowserClearMessage): Buffer {
      const type = root.lookupType('BrowserClearMessage');
      return Buffer.from(type.encode(req).finish());
    },
    StoreOpenMessage(req: STF.StoreOpenMessage): Buffer {
      const type = root.lookupType('StoreOpenMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ScreenCaptureMessage(req: STF.ScreenCaptureMessage): Buffer {
      const type = root.lookupType('ScreenCaptureMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ConnectStartMessage(req: STF.ConnectStartMessage): Buffer {
      const type = root.lookupType('ConnectStartMessage');
      return Buffer.from(type.encode(req).finish());
    },
    ConnectStopMessage(req: STF.ConnectStopMessage): Buffer {
      const type = root.lookupType('ConnectStopMessage');
      return Buffer.from(type.encode(req).finish());
    },
    AccountAddMenuMessage(req: STF.AccountAddMenuMessage): Buffer {
      const type = root.lookupType('AccountAddMenuMessage');
      return Buffer.from(type.encode(req).finish());
    },
    AccountAddMessage(req: STF.AccountAddMessage): Buffer {
      const type = root.lookupType('AccountAddMessage');
      return Buffer.from(type.encode(req).finish());
    },
    AccountCheckMessage(req: STF.AccountCheckMessage): Buffer {
      const type = root.lookupType('AccountCheckMessage');
      return Buffer.from(type.encode(req).finish());
    },
    AccountGetMessage(req: STF.AccountGetMessage): Buffer {
      const type = root.lookupType('AccountGetMessage');
      return Buffer.from(type.encode(req).finish());
    },
    AccountRemoveMessage(req: STF.AccountRemoveMessage): Buffer {
      const type = root.lookupType('AccountRemoveMessage');
      return Buffer.from(type.encode(req).finish());
    },
    SdStatusMessage(req: STF.SdStatusMessage): Buffer {
      const type = root.lookupType('SdStatusMessage');
      return Buffer.from(type.encode(req).finish());
    },
    RingerSetMessage(req: STF.RingerSetMessage): Buffer {
      const type = root.lookupType('RingerSetMessage');
      return Buffer.from(type.encode(req).finish());
    },
    RingerGetMessage(req: STF.RingerGetMessage): Buffer {
      const type = root.lookupType('RingerGetMessage');
      return Buffer.from(type.encode(req).finish());
    },
    WifiSetEnabledMessage(req: STF.WifiSetEnabledMessage): Buffer {
      const type = root.lookupType('WifiSetEnabledMessage');
      return Buffer.from(type.encode(req).finish());
    },
    WifiGetStatusMessage(req: STF.WifiGetStatusMessage): Buffer {
      const type = root.lookupType('WifiGetStatusMessage');
      return Buffer.from(type.encode(req).finish());
    },
  }

  public read = {
    UpdateAccessTokenMessage(data: Uint8Array): MyMessage<STF.UpdateAccessTokenMessage> {
      const type = root.lookupType('UpdateAccessTokenMessage');
      return type.decode(data) as MyMessage<STF.UpdateAccessTokenMessage>;
    },
    DeleteUserMessage(data: Uint8Array): MyMessage<STF.DeleteUserMessage> {
      const type = root.lookupType('DeleteUserMessage');
      return type.decode(data) as MyMessage<STF.DeleteUserMessage>;
    },
    DeviceOriginGroupMessage(data: Uint8Array): MyMessage<STF.DeviceOriginGroupMessage> {
      const type = root.lookupType('DeviceOriginGroupMessage');
      return type.decode(data) as MyMessage<STF.DeviceOriginGroupMessage>;
    },
    UserQuotasDetailField(data: Uint8Array): MyMessage<STF.UserQuotasDetailField> {
      const type = root.lookupType('UserQuotasDetailField');
      return type.decode(data) as MyMessage<STF.UserQuotasDetailField>;
    },
    UserQuotasField(data: Uint8Array): MyMessage<STF.UserQuotasField> {
      const type = root.lookupType('UserQuotasField');
      return type.decode(data) as MyMessage<STF.UserQuotasField>;
    },
    UserGroupsField(data: Uint8Array): MyMessage<STF.UserGroupsField> {
      const type = root.lookupType('UserGroupsField');
      return type.decode(data) as MyMessage<STF.UserGroupsField>;
    },
    UserField(data: Uint8Array): MyMessage<STF.UserField> {
      const type = root.lookupType('UserField');
      return type.decode(data) as MyMessage<STF.UserField>;
    },
    UserChangeMessage(data: Uint8Array): MyMessage<STF.UserChangeMessage> {
      const type = root.lookupType('UserChangeMessage');
      return type.decode(data) as MyMessage<STF.UserChangeMessage>;
    },
    DeviceNetworkField(data: Uint8Array): MyMessage<STF.DeviceNetworkField> {
      const type = root.lookupType('DeviceNetworkField');
      return type.decode(data) as MyMessage<STF.DeviceNetworkField>;
    },
    DeviceDisplayField(data: Uint8Array): MyMessage<STF.DeviceDisplayField> {
      const type = root.lookupType('DeviceDisplayField');
      return type.decode(data) as MyMessage<STF.DeviceDisplayField>;
    },
    DevicePhoneField(data: Uint8Array): MyMessage<STF.DevicePhoneField> {
      const type = root.lookupType('DevicePhoneField');
      return type.decode(data) as MyMessage<STF.DevicePhoneField>;
    },
    DeviceProviderField(data: Uint8Array): MyMessage<STF.DeviceProviderField> {
      const type = root.lookupType('DeviceProviderField');
      return type.decode(data) as MyMessage<STF.DeviceProviderField>;
    },
    DeviceGroupField(data: Uint8Array): MyMessage<STF.DeviceGroupField> {
      const type = root.lookupType('DeviceGroupField');
      return type.decode(data) as MyMessage<STF.DeviceGroupField>;
    },
    DeviceField(data: Uint8Array): MyMessage<STF.DeviceField> {
      const type = root.lookupType('DeviceField');
      return type.decode(data) as MyMessage<STF.DeviceField>;
    },
    DeviceChangeMessage(data: Uint8Array): MyMessage<STF.DeviceChangeMessage> {
      const type = root.lookupType('DeviceChangeMessage');
      return type.decode(data) as MyMessage<STF.DeviceChangeMessage>;
    },
    GroupDateField(data: Uint8Array): MyMessage<STF.GroupDateField> {
      const type = root.lookupType('GroupDateField');
      return type.decode(data) as MyMessage<STF.GroupDateField>;
    },
    GroupOwnerField(data: Uint8Array): MyMessage<STF.GroupOwnerField> {
      const type = root.lookupType('GroupOwnerField');
      return type.decode(data) as MyMessage<STF.GroupOwnerField>;
    },
    GroupField(data: Uint8Array): MyMessage<STF.GroupField> {
      const type = root.lookupType('GroupField');
      return type.decode(data) as MyMessage<STF.GroupField>;
    },
    GroupChangeMessage(data: Uint8Array): MyMessage<STF.GroupChangeMessage> {
      const type = root.lookupType('GroupChangeMessage');
      return type.decode(data) as MyMessage<STF.GroupChangeMessage>;
    },
    DeviceGroupChangeMessage(data: Uint8Array): MyMessage<STF.DeviceGroupChangeMessage> {
      const type = root.lookupType('DeviceGroupChangeMessage');
      return type.decode(data) as MyMessage<STF.DeviceGroupChangeMessage>;
    },
    GroupUserChangeMessage(data: Uint8Array): MyMessage<STF.GroupUserChangeMessage> {
      const type = root.lookupType('GroupUserChangeMessage');
      return type.decode(data) as MyMessage<STF.GroupUserChangeMessage>;
    },
    ConnectStartedMessage(data: Uint8Array): MyMessage<STF.ConnectStartedMessage> {
      const type = root.lookupType('ConnectStartedMessage');
      return type.decode(data) as MyMessage<STF.ConnectStartedMessage>;
    },
    ConnectStoppedMessage(data: Uint8Array): MyMessage<STF.ConnectStoppedMessage> {
      const type = root.lookupType('ConnectStoppedMessage');
      return type.decode(data) as MyMessage<STF.ConnectStoppedMessage>;
    },
    FileSystemListMessage(data: Uint8Array): MyMessage<STF.FileSystemListMessage> {
      const type = root.lookupType('FileSystemListMessage');
      return type.decode(data) as MyMessage<STF.FileSystemListMessage>;
    },
    FileSystemGetMessage(data: Uint8Array): MyMessage<STF.FileSystemGetMessage> {
      const type = root.lookupType('FileSystemGetMessage');
      return type.decode(data) as MyMessage<STF.FileSystemGetMessage>;
    },
    Envelope(data: Uint8Array): MyMessage<STF.Envelope> {
      const type = root.lookupType('Envelope');
      return type.decode(data) as MyMessage<STF.Envelope>;
    },
    TransactionProgressMessage(data: Uint8Array): MyMessage<STF.TransactionProgressMessage> {
      const type = root.lookupType('TransactionProgressMessage');
      return type.decode(data) as MyMessage<STF.TransactionProgressMessage>;
    },
    TransactionDoneMessage(data: Uint8Array): MyMessage<STF.TransactionDoneMessage> {
      const type = root.lookupType('TransactionDoneMessage');
      return type.decode(data) as MyMessage<STF.TransactionDoneMessage>;
    },
    DeviceLogMessage(data: Uint8Array): MyMessage<STF.DeviceLogMessage> {
      const type = root.lookupType('DeviceLogMessage');
      return type.decode(data) as MyMessage<STF.DeviceLogMessage>;
    },
    DeviceGroupOwnerMessage(data: Uint8Array): MyMessage<STF.DeviceGroupOwnerMessage> {
      const type = root.lookupType('DeviceGroupOwnerMessage');
      return type.decode(data) as MyMessage<STF.DeviceGroupOwnerMessage>;
    },
    DeviceGroupLifetimeMessage(data: Uint8Array): MyMessage<STF.DeviceGroupLifetimeMessage> {
      const type = root.lookupType('DeviceGroupLifetimeMessage');
      return type.decode(data) as MyMessage<STF.DeviceGroupLifetimeMessage>;
    },
    DeviceGroupMessage(data: Uint8Array): MyMessage<STF.DeviceGroupMessage> {
      const type = root.lookupType('DeviceGroupMessage');
      return type.decode(data) as MyMessage<STF.DeviceGroupMessage>;
    },
    ProviderMessage(data: Uint8Array): MyMessage<STF.ProviderMessage> {
      const type = root.lookupType('ProviderMessage');
      return type.decode(data) as MyMessage<STF.ProviderMessage>;
    },
    DeviceHeartbeatMessage(data: Uint8Array): MyMessage<STF.DeviceHeartbeatMessage> {
      const type = root.lookupType('DeviceHeartbeatMessage');
      return type.decode(data) as MyMessage<STF.DeviceHeartbeatMessage>;
    },
    DeviceIntroductionMessage(data: Uint8Array): MyMessage<STF.DeviceIntroductionMessage> {
      const type = root.lookupType('DeviceIntroductionMessage');
      return type.decode(data) as MyMessage<STF.DeviceIntroductionMessage>;
    },
    DeviceRegisteredMessage(data: Uint8Array): MyMessage<STF.DeviceRegisteredMessage> {
      const type = root.lookupType('DeviceRegisteredMessage');
      return type.decode(data) as MyMessage<STF.DeviceRegisteredMessage>;
    },
    DevicePresentMessage(data: Uint8Array): MyMessage<STF.DevicePresentMessage> {
      const type = root.lookupType('DevicePresentMessage');
      return type.decode(data) as MyMessage<STF.DevicePresentMessage>;
    },
    DeviceAbsentMessage(data: Uint8Array): MyMessage<STF.DeviceAbsentMessage> {
      const type = root.lookupType('DeviceAbsentMessage');
      return type.decode(data) as MyMessage<STF.DeviceAbsentMessage>;
    },
    DeviceReadyMessage(data: Uint8Array): MyMessage<STF.DeviceReadyMessage> {
      const type = root.lookupType('DeviceReadyMessage');
      return type.decode(data) as MyMessage<STF.DeviceReadyMessage>;
    },
    ProbeMessage(data: Uint8Array): MyMessage<STF.ProbeMessage> {
      const type = root.lookupType('ProbeMessage');
      return type.decode(data) as MyMessage<STF.ProbeMessage>;
    },
    DeviceStatusMessage(data: Uint8Array): MyMessage<STF.DeviceStatusMessage> {
      const type = root.lookupType('DeviceStatusMessage');
      return type.decode(data) as MyMessage<STF.DeviceStatusMessage>;
    },
    DeviceDisplayMessage(data: Uint8Array): MyMessage<STF.DeviceDisplayMessage> {
      const type = root.lookupType('DeviceDisplayMessage');
      return type.decode(data) as MyMessage<STF.DeviceDisplayMessage>;
    },
    DeviceBrowserAppMessage(data: Uint8Array): MyMessage<STF.DeviceBrowserAppMessage> {
      const type = root.lookupType('DeviceBrowserAppMessage');
      return type.decode(data) as MyMessage<STF.DeviceBrowserAppMessage>;
    },
    DeviceBrowserMessage(data: Uint8Array): MyMessage<STF.DeviceBrowserMessage> {
      const type = root.lookupType('DeviceBrowserMessage');
      return type.decode(data) as MyMessage<STF.DeviceBrowserMessage>;
    },
    DevicePhoneMessage(data: Uint8Array): MyMessage<STF.DevicePhoneMessage> {
      const type = root.lookupType('DevicePhoneMessage');
      return type.decode(data) as MyMessage<STF.DevicePhoneMessage>;
    },
    DeviceIdentityMessage(data: Uint8Array): MyMessage<STF.DeviceIdentityMessage> {
      const type = root.lookupType('DeviceIdentityMessage');
      return type.decode(data) as MyMessage<STF.DeviceIdentityMessage>;
    },
    DeviceProperty(data: Uint8Array): MyMessage<STF.DeviceProperty> {
      const type = root.lookupType('DeviceProperty');
      return type.decode(data) as MyMessage<STF.DeviceProperty>;
    },
    DevicePropertiesMessage(data: Uint8Array): MyMessage<STF.DevicePropertiesMessage> {
      const type = root.lookupType('DevicePropertiesMessage');
      return type.decode(data) as MyMessage<STF.DevicePropertiesMessage>;
    },
    DeviceRequirement(data: Uint8Array): MyMessage<STF.DeviceRequirement> {
      const type = root.lookupType('DeviceRequirement');
      return type.decode(data) as MyMessage<STF.DeviceRequirement>;
    },
    OwnerMessage(data: Uint8Array): MyMessage<STF.OwnerMessage> {
      const type = root.lookupType('OwnerMessage');
      return type.decode(data) as MyMessage<STF.OwnerMessage>;
    },
    GroupMessage(data: Uint8Array): MyMessage<STF.GroupMessage> {
      const type = root.lookupType('GroupMessage');
      return type.decode(data) as MyMessage<STF.GroupMessage>;
    },
    AutoGroupMessage(data: Uint8Array): MyMessage<STF.AutoGroupMessage> {
      const type = root.lookupType('AutoGroupMessage');
      return type.decode(data) as MyMessage<STF.AutoGroupMessage>;
    },
    UngroupMessage(data: Uint8Array): MyMessage<STF.UngroupMessage> {
      const type = root.lookupType('UngroupMessage');
      return type.decode(data) as MyMessage<STF.UngroupMessage>;
    },
    JoinGroupMessage(data: Uint8Array): MyMessage<STF.JoinGroupMessage> {
      const type = root.lookupType('JoinGroupMessage');
      return type.decode(data) as MyMessage<STF.JoinGroupMessage>;
    },
    JoinGroupByAdbFingerprintMessage(data: Uint8Array): MyMessage<STF.JoinGroupByAdbFingerprintMessage> {
      const type = root.lookupType('JoinGroupByAdbFingerprintMessage');
      return type.decode(data) as MyMessage<STF.JoinGroupByAdbFingerprintMessage>;
    },
    JoinGroupByVncAuthResponseMessage(data: Uint8Array): MyMessage<STF.JoinGroupByVncAuthResponseMessage> {
      const type = root.lookupType('JoinGroupByVncAuthResponseMessage');
      return type.decode(data) as MyMessage<STF.JoinGroupByVncAuthResponseMessage>;
    },
    AdbKeysUpdatedMessage(data: Uint8Array): MyMessage<STF.AdbKeysUpdatedMessage> {
      const type = root.lookupType('AdbKeysUpdatedMessage');
      return type.decode(data) as MyMessage<STF.AdbKeysUpdatedMessage>;
    },
    VncAuthResponsesUpdatedMessage(data: Uint8Array): MyMessage<STF.VncAuthResponsesUpdatedMessage> {
      const type = root.lookupType('VncAuthResponsesUpdatedMessage');
      return type.decode(data) as MyMessage<STF.VncAuthResponsesUpdatedMessage>;
    },
    LeaveGroupMessage(data: Uint8Array): MyMessage<STF.LeaveGroupMessage> {
      const type = root.lookupType('LeaveGroupMessage');
      return type.decode(data) as MyMessage<STF.LeaveGroupMessage>;
    },
    PhysicalIdentifyMessage(data: Uint8Array): MyMessage<STF.PhysicalIdentifyMessage> {
      const type = root.lookupType('PhysicalIdentifyMessage');
      return type.decode(data) as MyMessage<STF.PhysicalIdentifyMessage>;
    },
    TouchDownMessage(data: Uint8Array): MyMessage<STF.TouchDownMessage> {
      const type = root.lookupType('TouchDownMessage');
      return type.decode(data) as MyMessage<STF.TouchDownMessage>;
    },
    TouchMoveMessage(data: Uint8Array): MyMessage<STF.TouchMoveMessage> {
      const type = root.lookupType('TouchMoveMessage');
      return type.decode(data) as MyMessage<STF.TouchMoveMessage>;
    },
    TouchUpMessage(data: Uint8Array): MyMessage<STF.TouchUpMessage> {
      const type = root.lookupType('TouchUpMessage');
      return type.decode(data) as MyMessage<STF.TouchUpMessage>;
    },
    TouchCommitMessage(data: Uint8Array): MyMessage<STF.TouchCommitMessage> {
      const type = root.lookupType('TouchCommitMessage');
      return type.decode(data) as MyMessage<STF.TouchCommitMessage>;
    },
    TouchResetMessage(data: Uint8Array): MyMessage<STF.TouchResetMessage> {
      const type = root.lookupType('TouchResetMessage');
      return type.decode(data) as MyMessage<STF.TouchResetMessage>;
    },
    GestureStartMessage(data: Uint8Array): MyMessage<STF.GestureStartMessage> {
      const type = root.lookupType('GestureStartMessage');
      return type.decode(data) as MyMessage<STF.GestureStartMessage>;
    },
    GestureStopMessage(data: Uint8Array): MyMessage<STF.GestureStopMessage> {
      const type = root.lookupType('GestureStopMessage');
      return type.decode(data) as MyMessage<STF.GestureStopMessage>;
    },
    TypeMessage(data: Uint8Array): MyMessage<STF.TypeMessage> {
      const type = root.lookupType('TypeMessage');
      return type.decode(data) as MyMessage<STF.TypeMessage>;
    },
    PasteMessage(data: Uint8Array): MyMessage<STF.PasteMessage> {
      const type = root.lookupType('PasteMessage');
      return type.decode(data) as MyMessage<STF.PasteMessage>;
    },
    CopyMessage(data: Uint8Array): MyMessage<STF.CopyMessage> {
      const type = root.lookupType('CopyMessage');
      return type.decode(data) as MyMessage<STF.CopyMessage>;
    },
    KeyDownMessage(data: Uint8Array): MyMessage<STF.KeyDownMessage> {
      const type = root.lookupType('KeyDownMessage');
      return type.decode(data) as MyMessage<STF.KeyDownMessage>;
    },
    KeyUpMessage(data: Uint8Array): MyMessage<STF.KeyUpMessage> {
      const type = root.lookupType('KeyUpMessage');
      return type.decode(data) as MyMessage<STF.KeyUpMessage>;
    },
    KeyPressMessage(data: Uint8Array): MyMessage<STF.KeyPressMessage> {
      const type = root.lookupType('KeyPressMessage');
      return type.decode(data) as MyMessage<STF.KeyPressMessage>;
    },
    RebootMessage(data: Uint8Array): MyMessage<STF.RebootMessage> {
      const type = root.lookupType('RebootMessage');
      return type.decode(data) as MyMessage<STF.RebootMessage>;
    },
    DeviceLogcatEntryMessage(data: Uint8Array): MyMessage<STF.DeviceLogcatEntryMessage> {
      const type = root.lookupType('DeviceLogcatEntryMessage');
      return type.decode(data) as MyMessage<STF.DeviceLogcatEntryMessage>;
    },
    LogcatFilter(data: Uint8Array): MyMessage<STF.LogcatFilter> {
      const type = root.lookupType('LogcatFilter');
      return type.decode(data) as MyMessage<STF.LogcatFilter>;
    },
    LogcatStartMessage(data: Uint8Array): MyMessage<STF.LogcatStartMessage> {
      const type = root.lookupType('LogcatStartMessage');
      return type.decode(data) as MyMessage<STF.LogcatStartMessage>;
    },
    LogcatStopMessage(data: Uint8Array): MyMessage<STF.LogcatStopMessage> {
      const type = root.lookupType('LogcatStopMessage');
      return type.decode(data) as MyMessage<STF.LogcatStopMessage>;
    },
    LogcatApplyFiltersMessage(data: Uint8Array): MyMessage<STF.LogcatApplyFiltersMessage> {
      const type = root.lookupType('LogcatApplyFiltersMessage');
      return type.decode(data) as MyMessage<STF.LogcatApplyFiltersMessage>;
    },
    ShellCommandMessage(data: Uint8Array): MyMessage<STF.ShellCommandMessage> {
      const type = root.lookupType('ShellCommandMessage');
      return type.decode(data) as MyMessage<STF.ShellCommandMessage>;
    },
    ShellKeepAliveMessage(data: Uint8Array): MyMessage<STF.ShellKeepAliveMessage> {
      const type = root.lookupType('ShellKeepAliveMessage');
      return type.decode(data) as MyMessage<STF.ShellKeepAliveMessage>;
    },
    InstallMessage(data: Uint8Array): MyMessage<STF.InstallMessage> {
      const type = root.lookupType('InstallMessage');
      return type.decode(data) as MyMessage<STF.InstallMessage>;
    },
    UninstallMessage(data: Uint8Array): MyMessage<STF.UninstallMessage> {
      const type = root.lookupType('UninstallMessage');
      return type.decode(data) as MyMessage<STF.UninstallMessage>;
    },
    LaunchActivityMessage(data: Uint8Array): MyMessage<STF.LaunchActivityMessage> {
      const type = root.lookupType('LaunchActivityMessage');
      return type.decode(data) as MyMessage<STF.LaunchActivityMessage>;
    },
    RotateMessage(data: Uint8Array): MyMessage<STF.RotateMessage> {
      const type = root.lookupType('RotateMessage');
      return type.decode(data) as MyMessage<STF.RotateMessage>;
    },
    ForwardTestMessage(data: Uint8Array): MyMessage<STF.ForwardTestMessage> {
      const type = root.lookupType('ForwardTestMessage');
      return type.decode(data) as MyMessage<STF.ForwardTestMessage>;
    },
    ForwardCreateMessage(data: Uint8Array): MyMessage<STF.ForwardCreateMessage> {
      const type = root.lookupType('ForwardCreateMessage');
      return type.decode(data) as MyMessage<STF.ForwardCreateMessage>;
    },
    ForwardRemoveMessage(data: Uint8Array): MyMessage<STF.ForwardRemoveMessage> {
      const type = root.lookupType('ForwardRemoveMessage');
      return type.decode(data) as MyMessage<STF.ForwardRemoveMessage>;
    },
    ReverseForward(data: Uint8Array): MyMessage<STF.ReverseForward> {
      const type = root.lookupType('ReverseForward');
      return type.decode(data) as MyMessage<STF.ReverseForward>;
    },
    ReverseForwardsEvent(data: Uint8Array): MyMessage<STF.ReverseForwardsEvent> {
      const type = root.lookupType('ReverseForwardsEvent');
      return type.decode(data) as MyMessage<STF.ReverseForwardsEvent>;
    },
    BrowserOpenMessage(data: Uint8Array): MyMessage<STF.BrowserOpenMessage> {
      const type = root.lookupType('BrowserOpenMessage');
      return type.decode(data) as MyMessage<STF.BrowserOpenMessage>;
    },
    BrowserClearMessage(data: Uint8Array): MyMessage<STF.BrowserClearMessage> {
      const type = root.lookupType('BrowserClearMessage');
      return type.decode(data) as MyMessage<STF.BrowserClearMessage>;
    },
    StoreOpenMessage(data: Uint8Array): MyMessage<STF.StoreOpenMessage> {
      const type = root.lookupType('StoreOpenMessage');
      return type.decode(data) as MyMessage<STF.StoreOpenMessage>;
    },
    ScreenCaptureMessage(data: Uint8Array): MyMessage<STF.ScreenCaptureMessage> {
      const type = root.lookupType('ScreenCaptureMessage');
      return type.decode(data) as MyMessage<STF.ScreenCaptureMessage>;
    },
    ConnectStartMessage(data: Uint8Array): MyMessage<STF.ConnectStartMessage> {
      const type = root.lookupType('ConnectStartMessage');
      return type.decode(data) as MyMessage<STF.ConnectStartMessage>;
    },
    ConnectStopMessage(data: Uint8Array): MyMessage<STF.ConnectStopMessage> {
      const type = root.lookupType('ConnectStopMessage');
      return type.decode(data) as MyMessage<STF.ConnectStopMessage>;
    },
    AccountAddMenuMessage(data: Uint8Array): MyMessage<STF.AccountAddMenuMessage> {
      const type = root.lookupType('AccountAddMenuMessage');
      return type.decode(data) as MyMessage<STF.AccountAddMenuMessage>;
    },
    AccountAddMessage(data: Uint8Array): MyMessage<STF.AccountAddMessage> {
      const type = root.lookupType('AccountAddMessage');
      return type.decode(data) as MyMessage<STF.AccountAddMessage>;
    },
    AccountCheckMessage(data: Uint8Array): MyMessage<STF.AccountCheckMessage> {
      const type = root.lookupType('AccountCheckMessage');
      return type.decode(data) as MyMessage<STF.AccountCheckMessage>;
    },
    AccountGetMessage(data: Uint8Array): MyMessage<STF.AccountGetMessage> {
      const type = root.lookupType('AccountGetMessage');
      return type.decode(data) as MyMessage<STF.AccountGetMessage>;
    },
    AccountRemoveMessage(data: Uint8Array): MyMessage<STF.AccountRemoveMessage> {
      const type = root.lookupType('AccountRemoveMessage');
      return type.decode(data) as MyMessage<STF.AccountRemoveMessage>;
    },
    SdStatusMessage(data: Uint8Array): MyMessage<STF.SdStatusMessage> {
      const type = root.lookupType('SdStatusMessage');
      return type.decode(data) as MyMessage<STF.SdStatusMessage>;
    },
    RingerSetMessage(data: Uint8Array): MyMessage<STF.RingerSetMessage> {
      const type = root.lookupType('RingerSetMessage');
      return type.decode(data) as MyMessage<STF.RingerSetMessage>;
    },
    RingerGetMessage(data: Uint8Array): MyMessage<STF.RingerGetMessage> {
      const type = root.lookupType('RingerGetMessage');
      return type.decode(data) as MyMessage<STF.RingerGetMessage>;
    },
    WifiSetEnabledMessage(data: Uint8Array): MyMessage<STF.WifiSetEnabledMessage> {
      const type = root.lookupType('WifiSetEnabledMessage');
      return type.decode(data) as MyMessage<STF.WifiSetEnabledMessage>;
    },
    WifiGetStatusMessage(data: Uint8Array): MyMessage<STF.WifiGetStatusMessage> {
      const type = root.lookupType('WifiGetStatusMessage');
      return type.decode(data) as MyMessage<STF.WifiGetStatusMessage>;
    },
    AirplaneModeEvent(data: Uint8Array): MyMessage<STF.AirplaneModeEvent> {
      const type = root.lookupType('AirplaneModeEvent');
      return type.decode(data) as MyMessage<STF.AirplaneModeEvent>;
    },
    BatteryEvent(data: Uint8Array): MyMessage<STF.BatteryEvent> {
      const type = root.lookupType('BatteryEvent');
      return type.decode(data) as MyMessage<STF.BatteryEvent>;
    },
    ConnectivityEvent(data: Uint8Array): MyMessage<STF.ConnectivityEvent> {
      const type = root.lookupType('ConnectivityEvent');
      return type.decode(data) as MyMessage<STF.ConnectivityEvent>;
    },
    PhoneStateEvent(data: Uint8Array): MyMessage<STF.PhoneStateEvent> {
      const type = root.lookupType('PhoneStateEvent');
      return type.decode(data) as MyMessage<STF.PhoneStateEvent>;
    },
    RotationEvent(data: Uint8Array): MyMessage<STF.RotationEvent> {
      const type = root.lookupType('RotationEvent');
      return type.decode(data) as MyMessage<STF.RotationEvent>;
    },
  }
}

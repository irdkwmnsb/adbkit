// generarted by genProto.ts
//
// Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
//

// Message wrapper

export enum MessageType {
  CopyMessage = 33,
  DeviceIntroductionMessage = 74,
  DeviceAbsentMessage = 1,
  DeviceIdentityMessage = 2,
  DeviceLogcatEntryMessage = 3,
  DeviceLogMessage = 4,
  DeviceReadyMessage = 5,
  DevicePresentMessage = 6,
  DevicePropertiesMessage = 7,
  DeviceRegisteredMessage = 8,
  DeviceStatusMessage = 9,
  GroupMessage = 10,
  InstallMessage = 30,
  PhysicalIdentifyMessage = 29,
  JoinGroupMessage = 11,
  JoinGroupByAdbFingerprintMessage = 69,
  JoinGroupByVncAuthResponseMessage = 90,
  VncAuthResponsesUpdatedMessage = 91,
  AutoGroupMessage = 70,
  AdbKeysUpdatedMessage = 71,
  KeyDownMessage = 12,
  KeyPressMessage = 13,
  KeyUpMessage = 14,
  LaunchActivityMessage = 31,
  LeaveGroupMessage = 15,
  LogcatApplyFiltersMessage = 16,
  PasteMessage = 32,
  ProbeMessage = 17,
  ShellCommandMessage = 18,
  ShellKeepAliveMessage = 19,
  TouchDownMessage = 21,
  TouchMoveMessage = 22,
  TouchUpMessage = 23,
  TouchCommitMessage = 65,
  TouchResetMessage = 66,
  GestureStartMessage = 67,
  GestureStopMessage = 68,
  TransactionDoneMessage = 24,
  TransactionProgressMessage = 25,
  TypeMessage = 26,
  UngroupMessage = 27,
  UninstallMessage = 34,
  RotateMessage = 35,
  ForwardTestMessage = 36,
  ForwardCreateMessage = 37,
  ForwardRemoveMessage = 38,
  LogcatStartMessage = 39,
  LogcatStopMessage = 40,
  BrowserOpenMessage = 41,
  BrowserClearMessage = 42,
  AirplaneModeEvent = 43,
  BatteryEvent = 44,
  DeviceBrowserMessage = 45,
  ConnectivityEvent = 46,
  PhoneStateEvent = 47,
  RotationEvent = 48,
  StoreOpenMessage = 49,
  ScreenCaptureMessage = 50,
  DeviceHeartbeatMessage = 73,
  RebootMessage = 52,
  ConnectStartMessage = 53,
  ConnectStopMessage = 54,
  RingerSetMessage = 56,
  RingerGetMessage = 64,
  WifiSetEnabledMessage = 57,
  WifiGetStatusMessage = 58,
  AccountAddMenuMessage = 59,
  AccountAddMessage = 60,
  AccountCheckMessage = 63,
  AccountGetMessage = 62,
  AccountRemoveMessage = 55,
  SdStatusMessage = 61,
  ReverseForwardsEvent = 72,
  FileSystemListMessage = 81,
  FileSystemGetMessage = 82,
  ConnectStartedMessage = 92,
  ConnectStoppedMessage = 93,
  GroupUserChangeMessage = 1200,
  DeviceGroupChangeMessage = 1201,
  DeviceOriginGroupMessage = 1202,
  DeleteUserMessage = 1203,
  UpdateAccessTokenMessage = 1204,
  GroupChangeMessage = 1205,
  UserChangeMessage = 1206,
  DeviceChangeMessage = 1207,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UpdateAccessTokenMessage {}

export interface DeleteUserMessage {
  email: string;
}

export interface DeviceOriginGroupMessage {
  signature: string;
}

export interface UserQuotasDetailField {
  duration: number;
  number: number;
}

export interface UserQuotasField {
  allocated: UserQuotasDetailField;
  consumed: UserQuotasDetailField;
  defaultGroupsDuration: number;
  defaultGroupsNumber: number;
  defaultGroupsRepetitions: number;
  repetitions: number;
}

export interface UserGroupsField {
  quotas: UserQuotasField;
  subscribed: string[];
}

export interface UserField {
  email: string;
  name: string;
  privilege: string;
  groups: UserGroupsField;
}

export interface UserChangeMessage {
  user: UserField;
  isAddedGroup: boolean;
  groups: string[];
  action: string;
  targets: string[];
  timeStamp: number;
}

export interface DeviceNetworkField {
  type?: string;
  subtype?: string;
}

export interface DeviceDisplayField {
  height?: number;
  width?: number;
}

export interface DevicePhoneField {
  imei?: string;
}

export interface DeviceProviderField {
  name?: string;
}

export interface DeviceGroupField {
  origin?: string;
  originName?: string;
}

export interface DeviceField {
  serial: string;
  model?: string;
  version?: string;
  operator?: string;
  network?: DeviceNetworkField;
  display?: DeviceDisplayField;
  manufacturer?: string;
  sdk?: string;
  abi?: string;
  cpuPlatform?: string;
  openGLESVersion?: string;
  phone?: DevicePhoneField;
  provider?: DeviceProviderField;
  group?: DeviceGroupField;
  marketName?: string;
}

export interface DeviceChangeMessage {
  device: DeviceField;
  action: string;
  oldOriginGroupId: string;
  timeStamp: number;
}

export interface GroupDateField {
  start: string;
  stop: string;
}

export interface GroupOwnerField {
  email: string;
  name: string;
}

export interface GroupField {
  id: string;
  name: string;
  class: string;
  privilege: string;
  owner: GroupOwnerField;
  dates: GroupDateField[];
  duration: number;
  repetitions: number;
  devices: string[];
  users: string[];
  state: string;
  isActive: boolean;
}

export interface GroupChangeMessage {
  group: GroupField;
  action: string;
  subscribers: string[];
  isChangedDates: boolean;
  isChangedClass: boolean;
  isAddedUser: boolean;
  users: string[];
  isAddedDevice: boolean;
  devices: string[];
  timeStamp: number;
}

export interface DeviceGroupChangeMessage {
  id: string;
  group: DeviceGroupMessage;
  serial: string;
}

export interface GroupUserChangeMessage {
  users: string[];
  isAdded: boolean;
  id: string;
  isDeletedLater: boolean;
  devices: string[];
}

export interface ConnectStartedMessage {
  serial: string;
  url: string;
}

export interface ConnectStoppedMessage {
  serial: string;
}

export interface FileSystemListMessage {
  dir: string;
}

export interface FileSystemGetMessage {
  file: string;
}

export interface Envelope {
  type: MessageType;
  message: Uint8Array;
  channel?: string;
}

export interface TransactionProgressMessage {
  source: string;
  seq: number;
  data?: string;
  progress?: number;
}

export interface TransactionDoneMessage {
  source: string;
  seq: number;
  success: boolean;
  data?: string;
  body?: string;
}

// Logging

export interface DeviceLogMessage {
  serial: string;
  timestamp: number;
  priority: number;
  tag: string;
  pid: number;
  message: string;
  identifier: string;
}

// Introductions

export interface DeviceGroupOwnerMessage {
  email: string;
  name: string;
}

export interface DeviceGroupLifetimeMessage {
  start: number;
  stop: number;
}

export interface DeviceGroupMessage {
  id: string;
  name: string;
  owner: DeviceGroupOwnerMessage;
  lifeTime: DeviceGroupLifetimeMessage;
  class: string;
  repetitions: number;
  originName: string;
}

export interface ProviderMessage {
  channel: string;
  name: string;
}

export interface DeviceHeartbeatMessage {
  serial: string;
}

export interface DeviceIntroductionMessage {
  serial: string;
  status: DeviceStatus;
  provider: ProviderMessage;
  group?: DeviceGroupMessage;
}

export interface DeviceRegisteredMessage {
  serial: string;
}

export interface DevicePresentMessage {
  serial: string;
}

export interface DeviceAbsentMessage {
  serial: string;
}

export interface DeviceReadyMessage {
  serial: string;
  channel: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ProbeMessage {}

export enum DeviceStatus {
  OFFLINE = 1,
  UNAUTHORIZED = 2,
  ONLINE = 3,
  CONNECTING = 4,
  AUTHORIZING = 5,
}

export interface DeviceStatusMessage {
  serial: string;
  status: DeviceStatus;
}

export interface DeviceDisplayMessage {
  id: number;
  width: number;
  height: number;
  rotation: number;
  xdpi: number;
  ydpi: number;
  fps: number;
  density: number;
  secure: boolean;
  url: string;
  size?: number;
}

export interface DeviceBrowserAppMessage {
  id: string;
  type: string;
  name: string;
  selected: boolean;
  system: boolean;
}

export interface DeviceBrowserMessage {
  serial: string;
  selected: boolean;
  apps: DeviceBrowserAppMessage[];
}

export interface DevicePhoneMessage {
  imei?: string;
  imsi?: string;
  phoneNumber?: string;
  iccid?: string;
  network?: string;
}

export interface DeviceIdentityMessage {
  serial: string;
  platform: string;
  manufacturer: string;
  operator?: string;
  model: string;
  version: string;
  abi: string;
  sdk: string;
  display: DeviceDisplayMessage;
  phone: DevicePhoneMessage;
  product?: string;
  cpuPlatform?: string;
  openGLESVersion?: string;
  marketName?: string;
}

export interface DeviceProperty {
  name: string;
  value: string;
}

export interface DevicePropertiesMessage {
  serial: string;
  properties: DeviceProperty[];
}

// Grouping

export enum RequirementType {
  SEMVER = 1,
  GLOB = 2,
  EXACT = 3,
}

export interface DeviceRequirement {
  name: string;
  value: string;
  type: RequirementType;
}

export interface OwnerMessage {
  email: string;
  name: string;
  group: string;
}

export interface GroupMessage {
  owner: OwnerMessage;
  timeout?: number;
  requirements: DeviceRequirement[];
  usage?: string;
}

export interface AutoGroupMessage {
  owner: OwnerMessage;
  identifier: string;
}

export interface UngroupMessage {
  requirements: DeviceRequirement[];
}

export interface JoinGroupMessage {
  serial: string;
  owner: OwnerMessage;
  usage?: string;
}

export interface JoinGroupByAdbFingerprintMessage {
  serial: string;
  fingerprint: string;
  comment?: string;
  currentGroup?: string;
}

export interface JoinGroupByVncAuthResponseMessage {
  serial: string;
  response: string;
  currentGroup?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AdbKeysUpdatedMessage {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VncAuthResponsesUpdatedMessage {}

export interface LeaveGroupMessage {
  serial: string;
  owner: OwnerMessage;
  reason: string;
}

// Input

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PhysicalIdentifyMessage {}

export interface TouchDownMessage {
  seq: number;
  contact: number;
  x: number;
  y: number;
  pressure?: number;
}

export interface TouchMoveMessage {
  seq: number;
  contact: number;
  x: number;
  y: number;
  pressure?: number;
}

export interface TouchUpMessage {
  seq: number;
  contact: number;
}

export interface TouchCommitMessage {
  seq: number;
}

export interface TouchResetMessage {
  seq: number;
}

export interface GestureStartMessage {
  seq: number;
}

export interface GestureStopMessage {
  seq: number;
}

export interface TypeMessage {
  text: string;
}

export interface PasteMessage {
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CopyMessage {}

export interface KeyDownMessage {
  key: string;
}

export interface KeyUpMessage {
  key: string;
}

export interface KeyPressMessage {
  key: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RebootMessage {}

// Output

export interface DeviceLogcatEntryMessage {
  serial: string;
  date: number;
  pid: number;
  tid: number;
  priority: number;
  tag: string;
  message: string;
}

export interface LogcatFilter {
  tag: string;
  priority: number;
}

export interface LogcatStartMessage {
  filters: LogcatFilter[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LogcatStopMessage {}

export interface LogcatApplyFiltersMessage {
  filters: LogcatFilter[];
}

// Commands

export interface ShellCommandMessage {
  command: string;
  timeout: number;
}

export interface ShellKeepAliveMessage {
  timeout: number;
}

export interface InstallMessage {
  href: string;
  launch: boolean;
  manifest?: string;
}

export interface UninstallMessage {
  packageName: string;
}

export interface LaunchActivityMessage {
  action: string;
  component: string;
  category: string[];
  flags?: number;
}

export interface RotateMessage {
  rotation: number;
}

export interface ForwardTestMessage {
  targetHost: string;
  targetPort: number;
}

export interface ForwardCreateMessage {
  id: string;
  devicePort: number;
  targetHost: string;
  targetPort: number;
}

export interface ForwardRemoveMessage {
  id: string;
}

export interface ReverseForward {
  id: string;
  devicePort: number;
  targetHost: string;
  targetPort: number;
}

export interface ReverseForwardsEvent {
  serial: string;
  forwards: ReverseForward[];
}

export interface BrowserOpenMessage {
  url: string;
  browser?: string;
}

export interface BrowserClearMessage {
  browser?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StoreOpenMessage {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ScreenCaptureMessage {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConnectStartMessage {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConnectStopMessage {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AccountAddMenuMessage {}

export interface AccountAddMessage {
  user: string;
  password: string;
}

export interface AccountCheckMessage {
  type: string;
  account: string;
}

export interface AccountGetMessage {
  type?: string;
}

export interface AccountRemoveMessage {
  type: string;
  account?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SdStatusMessage {}

export enum RingerMode {
  SILENT = 0,
  VIBRATE = 1,
  NORMAL = 2,
}

export interface RingerSetMessage {
  mode: RingerMode;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RingerGetMessage {}

export interface WifiSetEnabledMessage {
  enabled: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WifiGetStatusMessage {}

// Events, these must be kept in sync with STFService/wire.proto

export interface AirplaneModeEvent {
  serial: string;
  enabled: boolean;
}

export interface BatteryEvent {
  serial: string;
  status: string;
  health: string;
  source: string;
  level: number;
  scale: number;
  temp: number;
  voltage: number;
}

export interface ConnectivityEvent {
  serial: string;
  connected: boolean;
  type?: string;
  subtype?: string;
  failover?: boolean;
  roaming?: boolean;
}

export interface PhoneStateEvent {
  serial: string;
  state: string;
  manual: boolean;
  operator?: string;
}

export interface RotationEvent {
  serial: string;
  rotation: number;
}

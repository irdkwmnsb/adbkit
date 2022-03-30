export enum MessageType {
    DO_IDENTIFY = 1,
    DO_KEYEVENT = 2,
    DO_TYPE = 3,
    DO_WAKE = 4,
    DO_ADD_ACCOUNT_MENU = 24,
    DO_REMOVE_ACCOUNT = 20,
    GET_ACCOUNTS = 26,
    GET_BROWSERS = 5,
    GET_CLIPBOARD = 6,
    GET_DISPLAY = 19,
    GET_PROPERTIES = 7,
    GET_RINGER_MODE = 27,
    GET_SD_STATUS = 25,
    GET_VERSION = 8,
    GET_WIFI_STATUS = 23,
    GET_BLUETOOTH_STATUS = 29,
    GET_ROOT_STATUS = 31,
    SET_CLIPBOARD = 9,
    SET_KEYGUARD_STATE = 10,
    SET_RINGER_MODE = 21,
    SET_ROTATION = 12,
    SET_WAKE_LOCK = 11,
    SET_WIFI_ENABLED = 22,
    SET_BLUETOOTH_ENABLED = 30,
    SET_MASTER_MUTE = 28,
    EVENT_AIRPLANE_MODE = 13,
    EVENT_BATTERY = 14,
    EVENT_CONNECTIVITY = 15,
    EVENT_PHONE_STATE = 16,
    EVENT_ROTATION = 17,
    EVENT_BROWSER_PACKAGE = 18
}

export interface STFAirplaneModeEvent {
    enabled: boolean;
}

export interface STFBatteryEvent {
    status: string;
    health: string;
    source: string;
    level: number;
    scale: number;
    temp: number;
    voltage: number;
}

export interface STFBrowserApp {
    name: string;
    component: string;
    selected: boolean;
    system: boolean;
}

export interface STFBrowserApp {
    name: string;
    component: string;
    selected: boolean;
    system: boolean;
}

export interface STFBrowserPackageEvent {
    selected: boolean;
    apps: STFBrowserApp;
}

export interface STFConnectivityEvent {
    connected: boolean;
    type?: string;
    subtype?: string;
    failover?: boolean;
    roaming?: boolean;
}

export interface STFPhoneStateEvent {
    state: string;
    manual: boolean;
    operator?: string;
}

export interface STFRotationEvent {
    rotation: number;
}



// export {
//     id?: number;
//     type: MessageType;
//     message: Uint8Array;
// }
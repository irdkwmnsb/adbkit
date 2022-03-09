export interface Point {
    x: number;
    y: number;
}

export interface ScrcpyOptions {
    /**
     * local port use for scrcpy
     */
    port: number,
    /**
     * maxSize         (integer, multiple of 8) 0
     * Max width
     */
    maxSize: number,
    /**
     * maximum fps, 0 means not limited (supported after android 10)
     */
    maxFps: number;
    /**
     * flip the video
     */
    flip: boolean;
    /**
     * 
     */
    bitrate: number,
    /**
     * lock screen orientation, LOCK_VIDEO_ORIENTATION_*
     */
    lockedVideoOrientation: number;

    /**
     * use "adb forward" instead of "adb tunnel"
     */
    tunnelForward: boolean,
    tunnelDelay: number,
    /**
     * Crop must contains 4 values separated by colons
     * 
     * cropZone formated as "width:height:x:y" or '-'
     */
    crop: string,
    sendFrameMeta: boolean,
    /**
     * set Control added in scrcpy 1.9
     */
    control: boolean;
    displayId: number,
    showTouches: boolean;
    stayAwake: boolean;
    codecOptions: string;
    encoderName: string;
    powerOffScreenOnClose: boolean;
}

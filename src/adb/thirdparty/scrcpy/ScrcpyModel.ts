export interface Point {
    x: number;
    y: number;
}

export interface ScrcpyOptions {
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
     * "width:height:x:y" or '-'
     * Crop the device screen on the server.
     * The values are expressed in the device natural orientation (typically,
     * portrait for a phone, landscape for a tablet). Any --max-size value is
     * cmoputed on the cropped size.
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

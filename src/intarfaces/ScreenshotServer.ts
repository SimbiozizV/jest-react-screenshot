export interface ScreenshotServer {
    start(): Promise<void>;
    stop(): Promise<void>;
}

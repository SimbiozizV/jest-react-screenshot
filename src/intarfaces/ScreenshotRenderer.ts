export interface ScreenshotRenderer {
    start(): Promise<void>;
    stop(): Promise<void>;
    render(name: string, url: string, viewport?: Viewport): Promise<Buffer | string | void>;
}

export interface Viewport {
    width: number;

    height: number;
}

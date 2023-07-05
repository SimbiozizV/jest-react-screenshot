import { Viewport } from './Viewport';

export interface ScreenshotRenderer {
    start(): Promise<void>;
    stop(): Promise<void>;
    render(url: string, viewport?: Viewport): Promise<Buffer | string | void>;
}

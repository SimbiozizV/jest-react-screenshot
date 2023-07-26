import { LocalScreenshotServer } from './screenshotServer/LocalScreenshotServer';
import { ScreenshotServer } from './intarfaces/ScreenshotServer';
import { SCREENSHOT_SERVER_PORT } from './config';
import PuppeteerScreenshotRenderer from './screenshotRenderer/PuppeteerScreenshotRenderer';

let screenshotServer: ScreenshotServer | null = null;

export function getScreenshotServer() {
    return screenshotServer;
}

export function clearScreenshotServer() {
    screenshotServer = null;
}

function createScreenshotServer(): ScreenshotServer {
    return new LocalScreenshotServer(new PuppeteerScreenshotRenderer(), SCREENSHOT_SERVER_PORT);
}

async function setUpScreenshotServer() {
    screenshotServer = createScreenshotServer();

    try {
        await screenshotServer.start();
    } catch (e) {
        console.log(e);
    }
}

export default setUpScreenshotServer;

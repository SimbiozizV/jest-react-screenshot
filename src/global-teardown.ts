import { getScreenshotServer, clearScreenshotServer } from './global-setup';

function tearDownScreenshotServer() {
    const screenshotServer = getScreenshotServer();

    if (screenshotServer) {
        screenshotServer.stop();
        console.log('server down');
    } else {
        console.log('no server');
    }

    clearScreenshotServer();
}

export default tearDownScreenshotServer;

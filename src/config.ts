export const SCREENSHOT_SERVER_PORT = parseInt(process.env.SCREENSHOT_SERVER_PORT || '3038', 10);

export const SCREENSHOT_SERVER_URL = `http://localhost:${SCREENSHOT_SERVER_PORT}`;

export function getScreenshotPrefix() {
    return process.env.SCREENSHOT_PREFIX || '';
}

export const SERVER_STOP_TIMEOUT = 5000;

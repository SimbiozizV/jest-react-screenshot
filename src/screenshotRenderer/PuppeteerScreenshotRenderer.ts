import puppeteer, { Browser } from 'puppeteer';
import { ScreenshotRenderer, Viewport } from '../intarfaces/ScreenshotRenderer';

export class PuppeteerScreenshotRenderer implements ScreenshotRenderer {
    private browser: Browser | null = null;

    async start() {
        console.log('puppeter start');
        this.browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: 'new',
        });
    }

    async stop() {
        if (this.browser) {
            console.log('puppeter stop');
            await this.browser.close();
        }
    }

    async render(name: string, url: string, viewport?: Viewport) {
        console.log(`render (name = ${name}, url = ${url}).`);
        if (!this.browser) {
            throw new Error('Please call start() once before render().');
        }

        const page = await this.browser.newPage();

        if (viewport) {
            await page.setViewport(viewport);
        }

        await page.goto(url);
        const screenshot = await page.screenshot({
            encoding: 'binary',
            fullPage: true,
        });
        await page.close();
        return screenshot;
    }
}

export default PuppeteerScreenshotRenderer;

import puppeteer, { Browser } from 'puppeteer';
import { ScreenshotRenderer } from '../intarfaces/ScreenshotRenderer';
import { Viewport } from '../intarfaces/Viewport';

export class PuppeteerScreenshotRenderer implements ScreenshotRenderer {
    private browser: Browser | null = null;

    async start() {
        console.log('puppeter start');
        this.browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: 'new',
        });
    }

    async stop() {
        if (this.browser) {
            console.log('puppeter stop');
            await this.browser.close();
        }
    }

    async render(url: string, viewport?: Viewport) {
        if (!this.browser) {
            throw new Error('Please call start() once before render().');
        }

        try {
            const page = await this.browser.newPage();

            if (viewport) {
                await page.setViewport(viewport);
            }

            await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });
            const screenshot = await page.screenshot({
                encoding: 'binary',
                fullPage: true,
            });
            await page.close();
            return screenshot;
        } catch (e) {
            console.log(e);
            throw new Error('Puppeteer problem');
        }
    }
}

export default PuppeteerScreenshotRenderer;

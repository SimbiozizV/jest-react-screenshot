import puppeteer, { Browser, Page } from 'puppeteer';
import { ScreenshotRenderer } from '../intarfaces/ScreenshotRenderer';
import { Viewport } from '../intarfaces/Viewport';

export class PuppeteerScreenshotRenderer implements ScreenshotRenderer {
    private browser: Browser | null = null;
    private page: Page | null = null;

    async start() {
        console.log('puppeter start');
        this.browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: 'new',
        });

        if (!this.browser) throw new Error('puppeter browser error');
        this.page = await this.browser.newPage();
    }

    async stop() {
        if (this.page) await this.page.close();

        if (this.browser) {
            console.log('puppeter stop');
            await this.browser.close();
        }
    }

    async render(url: string, viewport?: Viewport) {
        if (!this.page) {
            throw new Error('Empty page. Please call start() once before render().');
        }

        if (viewport) {
            await this.page.setViewport(viewport);
        }

        await this.page.goto(url);
        return await this.page.screenshot({
            encoding: 'binary',
            fullPage: true,
        });
    }
}

export default PuppeteerScreenshotRenderer;

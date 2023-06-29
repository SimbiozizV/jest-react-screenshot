import express, { Express } from 'express';
import bodyParser from 'body-parser';
import { Server } from 'net';
import { ScreenshotRenderer } from '../intarfaces/ScreenshotRenderer';
import { ScreenshotServer } from '../intarfaces/ScreenshotServer';
import { SERVER_STOP_TIMEOUT } from '../config';

export class LocalScreenshotServer implements ScreenshotServer {
    private server: Server | null = null;
    private readonly app: Express;

    constructor(private readonly renderer: ScreenshotRenderer, private readonly port: number) {
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.post('/render', async (req, res) => {
            const { name, url, viewport } = req.body;

            try {
                const screenshot = await (viewport
                    ? this.renderer.render(name, url, viewport)
                    : this.renderer.render(name, url));
                if (screenshot) {
                    res.contentType('image/png');
                    res.end(screenshot);
                } else {
                    res.status(204);
                    res.end();
                }
            } catch (e) {
                res.status(500);
                res.end((e as Error).message || `Unable to render a screenshot of ${url}`);
            }
        });
    }

    async start() {
        await this.renderer.start();
        await new Promise(resolve => {
            this.server = this.app.listen(this.port, () => {
                resolve('');
            });
        });
    }

    async stop() {
        if (!this.server) {
            throw new Error('Server is not running!');
        }

        await new Promise<void>((resolve, reject) => {
            this.server!.close(err => (err ? reject(err) : resolve()));

            setTimeout(() => {
                console.log('Local srceenshot server closed by timeout');
                resolve();
            }, SERVER_STOP_TIMEOUT);
        });

        await this.renderer.stop();
    }
}

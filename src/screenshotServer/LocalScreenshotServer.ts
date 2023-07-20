import express, { Express } from 'express';
import bodyParser from 'body-parser';
import { Server } from 'net';
import { ScreenshotRenderer } from '../intarfaces/ScreenshotRenderer';
import { ScreenshotServer } from '../intarfaces/ScreenshotServer';

export class LocalScreenshotServer implements ScreenshotServer {
    private server: Server | null = null;
    private readonly app: Express;

    constructor(
        private readonly renderer: ScreenshotRenderer,
        private readonly port: number
    ) {
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.post('/render', async (req, res) => {
            const { url, viewport } = req.body;

            try {
                const screenshot = await this.renderer.render(url, viewport);
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
                resolve('done');
            });
        });
    }

    async stop() {
        if (!this.server) {
            throw new Error('Server is not running!');
        }

        await new Promise<void>((resolve, reject) => {
            this.server!.close(err => (err ? reject(err) : resolve()));
        });

        await this.renderer.stop();
    }
}

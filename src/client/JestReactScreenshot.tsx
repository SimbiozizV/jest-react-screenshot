import React, { ReactNode } from 'react';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { ComponentServer } from './ComponentServer';
import { SCREENSHOT_SERVER_URL, getScreenshotPrefix } from '../config';
import { dirname, join, sep } from 'path';
import { fetch } from '../network/fetch';
import callsites from 'callsites';
import { Viewport } from '../intarfaces/Viewport';

export class JestReactScreenshot {
    private readonly _viewports: {
        [name: string]: Viewport;
    } = {};

    private readonly shots: Record<string, ReactNode> = {};
    private readonly _staticPaths: Record<string, string> = {};

    private ran = false;

    static create(componentName: string) {
        return new this(componentName);
    }

    private constructor(private readonly componentName: string) {
        setImmediate(() => {
            if (!this.ran) {
                throw new Error('Please call .run()');
            }
        });
    }

    shoot(shotName: string, component: React.ReactElement) {
        if (this.ran) {
            throw new Error('Cannot add a shot after running.');
        }
        if (this.shots[shotName]) {
            throw new Error(`Shot "${shotName}" is declared more than once`);
        }
        this.shots[shotName] = component;
        return this;
    }

    viewport(viewportName: string, viewport: Viewport) {
        if (this.ran) {
            throw new Error('Cannot add a viewport after running.');
        }
        if (this._viewports[viewportName]) {
            throw new Error(`Viewport "${viewportName}" is declared more than once`);
        }
        this._viewports[viewportName] = viewport;
        return this;
    }

    run() {
        if (this.ran) {
            throw new Error('Cannot run more than once.');
        }

        this.ran = true;
        if (Object.keys(this._viewports).length === 0) {
            throw new Error('Please define viewports with .viewport()');
        }
        if (Object.keys(this.shots).length === 0) {
            throw new Error('Please define shots with .shoot()');
        }

        const componentServer = new ComponentServer(this._staticPaths);

        expect.extend({ toMatchImageSnapshot });

        beforeAll(async () => {
            await componentServer.start();
        });

        afterAll(async () => {
            await componentServer.stop();
        });

        const testFilename = callsites()[1].getFileName()!;
        const snapshotsDir = dirname(testFilename);

        const prefix = getScreenshotPrefix();
        // jest-image-snapshot doesn't support a snapshot identifier such as
        // "abc/def". Instead, we need some logic to look for a directory
        // separator (using `sep`) and set the subdirectory to "abc", only using
        // "def" as the identifier prefix.
        let subdirectory = '';
        let filenamePrefix = '';
        if (prefix.indexOf(sep) > -1) {
            [subdirectory, filenamePrefix] = prefix.split(sep, 2);
        } else {
            filenamePrefix = prefix;
        }

        describe(this.componentName, () => {
            for (const [viewportName, viewport] of Object.entries(this._viewports)) {
                describe(viewportName, () => {
                    for (const [shotName, shot] of Object.entries(this.shots)) {
                        it(
                            shotName,
                            async () => {
                                const name = `${this.componentName} - ${viewportName} - ${shotName}`;

                                console.log(`Requesting component server to generate screenshot: ${name}`);
                                const screenshot = await componentServer.serve(
                                    {
                                        name,
                                        reactNode: shot,
                                    },
                                    async (port, path) => {
                                        // docker.interval is only available on window and mac
                                        const url = `http://localhost:${port}${path}`;
                                        return this.requestScreenshot(name, url, viewport);
                                    }
                                );
                                console.log(`Screenshot generated.`);

                                if (screenshot) {
                                    expect(screenshot).toMatchImageSnapshot({
                                        customSnapshotsDir: join(
                                            snapshotsDir,
                                            '__screenshots__',
                                            this.componentName,
                                            subdirectory
                                        ),
                                        customSnapshotIdentifier: `${filenamePrefix}${viewportName} - ${shotName}`,
                                    });
                                } else {
                                    console.log(`Skipping screenshot matching.`);
                                }
                            },
                            50000
                        );
                    }
                });
            }
        });
    }

    private async requestScreenshot(name: string, url: string, viewport: Viewport) {
        let response: {
            status: number;
            body: Buffer;
        };

        try {
            response = await fetch(`${SCREENSHOT_SERVER_URL}/render`, 'POST', {
                name,
                url,
                viewport,
            });
        } catch (e) {
            throw e;
        }

        if (response.status === 204) {
            return null;
        }
        if (response.status !== 200) {
            throw new Error(`Received response ${response.status} from screenshot server.`);
        }
        return response.body;
    }
}

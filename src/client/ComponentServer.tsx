import React from 'react';
import express, { Express } from 'express';
import getPort from 'get-port';
import { Server } from 'net';
import { renderToString } from 'react-dom/server';
import * as uuid from 'uuid';
import { ASSET_SERVING_PREFIX, getAssetFilename } from '../recorded-assets';
import { readRecordedCss } from '../helpers/recorded-css';
import { SERVER_STOP_TIMEOUT } from '../config';

type ServerStyleSheet = import('styled-components').ServerStyleSheet;

const viewportMeta = React.createElement('meta', {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1.0',
});
const charsetMeta = React.createElement('meta', {
    name: 'charset',
    content: 'UTF-8',
});

/**
 * ReactComponentServer renders React nodes in a plain HTML page.
 */
export class ReactComponentServer {
    private readonly app: Express;

    private server: Server | null = null;

    private port: number | null = null;

    private readonly nodes: {
        [id: string]: NodeDescription;
    } = {};

    constructor(staticPaths: Record<string, string>) {
        this.app = express();
        for (const [mappedPath, dirOrFilePath] of Object.entries(staticPaths)) {
            this.app.use(mappedPath, express.static(dirOrFilePath));
        }
        this.app.get('/render/:nodeId', (req, res) => {
            const { nodeId } = req.params;
            const node = this.nodes[nodeId];
            console.log(`Received request to render node ${nodeId}.`);
            if (!node) {
                throw new Error(`No node to render for ID: ${nodeId}`);
            }

            import('styled-components')
                .then(({ ServerStyleSheet }) => this.renderWithStyledComponents(new ServerStyleSheet(), node))
                .catch(() => {
                    return this.renderWithoutStyledComponents(node);
                })
                .then(html => {
                    console.log(`Finished render successfully.`);
                    res.header('Content-Type', 'text/html; charset=utf-8');
                    res.send(html);
                    console.log(`Rendered HTML sent.`);
                })
                .catch(console.error);
        });
        this.app.get(`${ASSET_SERVING_PREFIX}:asset.:ext`, (req, res) => {
            const filePath = getAssetFilename(req.path);
            console.log(`Serving static asset ${req.path} from ${filePath}.`);
            res.sendFile(filePath);
        });
    }

    private renderWithStyledComponents(sheet: ServerStyleSheet, node: NodeDescription) {
        console.log(`RENDER WITH STYLED`);

        try {
            const rendered = renderToString(sheet.collectStyles(node.reactNode));
            const html = renderToString(
                React.createElement(
                    'html',
                    null,
                    React.createElement(
                        'head',
                        null,
                        charsetMeta,
                        viewportMeta,
                        ...node.remoteStylesheetUrls.map(url =>
                            React.createElement('link', {
                                rel: 'stylesheet',
                                href: url,
                            })
                        ),
                        React.createElement('style', {
                            dangerouslySetInnerHTML: { __html: readRecordedCss() },
                        }),
                        sheet.getStyleElement()
                    ),
                    React.createElement('body', {
                        dangerouslySetInnerHTML: { __html: rendered },
                    })
                )
            );
            return html;
        } finally {
            sheet.seal();
        }
    }

    private renderWithoutStyledComponents(node: NodeDescription) {
        console.log(`RENDER WITHOUT STYLED`);

        return renderToString(
            React.createElement(
                'html',
                null,
                React.createElement(
                    'head',
                    null,
                    charsetMeta,
                    viewportMeta,
                    ...node.remoteStylesheetUrls.map(url =>
                        React.createElement('link', {
                            rel: 'stylesheet',
                            href: url,
                        })
                    ),
                    React.createElement('style', {
                        dangerouslySetInnerHTML: { __html: readRecordedCss() },
                    })
                ),
                React.createElement('body', null, node.reactNode)
            )
        );
    }

    async start(): Promise<void> {
        console.log(`start() initiated.`);

        if (this.server) {
            throw new Error('Server is already running! Please only call start() once.');
        }
        this.port = await getPort();

        console.log(`Attempting to listen on port ${this.port}.`);
        await new Promise<void>(resolve => {
            this.server = this.app.listen(this.port, resolve);
        });
        console.log(`Successfully listening on port ${this.port}.`);
    }

    async stop(): Promise<void> {
        console.log(`stop() initiated.`);

        const { server } = this;
        if (!server) {
            throw new Error('Server is not running! Please make sure that start() was called.');
        }

        await new Promise<void>((resolve, reject) => {
            server.close(err => (err ? reject(err) : resolve()));

            setTimeout(() => {
                console.log('Http server closed by timeout');
                resolve();
            }, SERVER_STOP_TIMEOUT);
        });
    }

    async serve<T>(
        node: NodeDescription,
        ready: (port: number, path: string) => Promise<T>,
        id = uuid.v4()
    ): Promise<T> {
        console.log(`serve() initiated with node ID: ${id}`);

        if (!this.server || !this.port) {
            throw new Error('Server is not running! Please make sure that start() was called.');
        }

        console.log(`Storing node.`);
        this.nodes[id] = node;

        console.log(`Rendering node.`);
        const result = await ready(this.port, `/render/${id}`);
        console.log(`Node rendered.`);

        console.log(`Deleting node.`);
        delete this.nodes[id];

        return result;
    }
}

export interface NodeDescription {
    name: string;
    reactNode: React.ReactNode;
    remoteStylesheetUrls: string[];
}

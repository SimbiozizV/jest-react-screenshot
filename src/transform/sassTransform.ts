import crypto from 'crypto';
import sass from 'node-sass';
import { TransformOptions } from '../intarfaces/TransformOptions';

export default {
    getCacheKey: (sourceText: string, sourcePath: string, options: TransformOptions) => {
        return crypto
            .createHash('md5')
            .update('1')
            .update('\0', 'utf8')
            .update(sourceText)
            .update('\0', 'utf8')
            .update(sourcePath)
            .update('\0', 'utf8')
            .update(options.configString)
            .digest('hex');
    },

    process: (_: string, sourcePath: string) => {
        const { css: buffer } = sass.renderSync({
            file: sourcePath,
        });
        const css = buffer.toString('utf8');
        return `
      const { recordCss } = require("react-screenshot-test");
      recordCss(${JSON.stringify(css)});
      module.exports = {};
    `;
    },
};

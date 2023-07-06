import crypto from 'crypto';
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

    process: (sourceText: string, _: string) => {
        return `
        const { recordCss } = require("react-screenshot-test");
        recordCss(${JSON.stringify(sourceText)});
        module.exports = {};
      `;
    },
};

import fs from 'fs';
import path from 'path';

const base64 = (sourcePath: string, data: Buffer) => {
    const extname = path.extname(sourcePath).substr(1) || 'png';
    return `data:image/${extname};base64,${data.toString('base64')}`;
};

export default {
    process(_: string, sourcePath: string) {
        const data = base64(sourcePath, fs.readFileSync(sourcePath));
        return { code: `module.exports = ${JSON.stringify(data)};` };
    },
};

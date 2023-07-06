import path from 'path';
import fs from 'fs';
import { transform } from '@babel/core';
// @ts-ignore
import reactPreset from '@babel/preset-react';

const camelizeAttributes = (componentString: string, separatorMap: string[] = []) => {
    let result = componentString;

    separatorMap.forEach(separator => {
        const matches = result.match(new RegExp(`[a-z]+${separator}[a-z]+=`, 'g'));
        if (matches) {
            matches.forEach(attribute => {
                result = result.replace(
                    attribute,
                    attribute.replace(new RegExp(`${separator}.`, 'g'), x => x.toUpperCase()[1])
                );
            });
        }
    });

    return result;
};

export default {
    process(_: string, sourcePath: string) {
        const svgString: string = fs.readFileSync(path.relative(process.cwd(), sourcePath), 'utf-8');
        const svgWithCamelCaseProps = camelizeAttributes(svgString, ['-', ':']);
        const svgWithProps = `${svgWithCamelCaseProps.substring(0, 4)} {...props}${svgWithCamelCaseProps.substring(4)}`;

        return transform(
            `
        import React from 'react';
        export default props => (${svgWithProps});
      `,
            {
                filename: sourcePath,
                presets: [reactPreset],
                retainLines: true,
            }
        );
    },
};

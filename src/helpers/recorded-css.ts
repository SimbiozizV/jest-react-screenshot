let recordedCss = `
* {
  transition: none !important;
  animation: none !important;
}
`;

export function recordCss(css: string) {
    recordedCss += css;
}

export function readRecordedCss() {
    return recordedCss;
}

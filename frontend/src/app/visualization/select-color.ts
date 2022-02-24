export function selectColor(palette?: string[], index?: number): string {
    if (palette) {
        const i = index || 0;
        return palette[i % palette.length];
    } else {
        return '#3F51B5'; // ianalyzer primary
    }
}

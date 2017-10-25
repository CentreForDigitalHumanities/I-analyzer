import { Injectable } from '@angular/core';

const maxHits = 100;

export type TextPart = {
    substring: string,
    isHit: boolean
};

/**
 * Service for client-side highlighting of the text hits using a search query.
 */
@Injectable()
export class HighlightService {
    private static queryExpressions: { [query: string]: RegExp } = {};
    private static quotedRegex = /"[^"]+"/g;

    /**
     * Returns the full text in parts and show which parts matched (part of) the query.
     * @param text
     * @param query
     */
    public highlight(text: string, query: string = ''): TextPart[] {
        if (query == null || query == '') {
            return [{ substring: text, isHit: false }];
        }
        let expression = HighlightService.queryExpressions[query];
        if (!expression) {
            expression = HighlightService.queryExpressions[query] = this.getQueryExpression(query);
        }

        let result: RegExpExecArray;
        let parsedText: TextPart[] = [];
        let lastIndex = 0;

        for (let i = 0; (result = expression.exec(text)) !== null && i < maxHits; i++) {
            if (lastIndex < result.index) {
                parsedText.push({ substring: text.substring(lastIndex, result.index), isHit: false });
            }

            parsedText.push({ substring: result[0], isHit: true });

            lastIndex = result.index + result[0].length;
        }

        if (text.length > lastIndex) {
            parsedText.push({ substring: text.substring(lastIndex), isHit: false });
        }
        return parsedText;
    }

    /**
     * Convert the query to a regular expression matching any hit in a string.
     * @param query
     */
    private getQueryExpression(query: string): RegExp {
        let quoted: RegExpExecArray;
        let lastIndex = 0;

        let patterns: string[] = []

        for (let i = 0; (quoted = HighlightService.quotedRegex.exec(query)) !== null && i < maxHits; i++) {
            if (lastIndex < quoted.index) {
                patterns.push(...this.getQueryWords(query.substring(lastIndex, quoted.index)));
            }

            patterns.push(quoted[0].substring(1, quoted[0].length - 1));

            lastIndex = quoted.index + quoted[0].length;
        }

        patterns.push(...this.getQueryWords(query.substring(lastIndex)));

        return new RegExp(`(${patterns.map(pattern => `\\b${pattern}\\b`).join('|')})`, 'gi');
    }

    /**
     * Get the word patterns match in a query.
     * @param query
     */
    private getQueryWords(query: string): string[] {
        return query.replace('.', '\\.').replace('*', '.*?\\b').split(/[ \|\+]/g).filter(word => !!word);
    }
}

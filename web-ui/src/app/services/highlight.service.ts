import { Injectable } from '@angular/core';

/**
 * The maximum number of hits to highlight in any text. Rendering a lot of hit-spans could slow the interface down,
 * a more scalable approach would need to be implemented if rendering many hits is required.
 */
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
    private static quotedRegex = /"[^"]+"/gu;

    /**
     * Returns the full text in parts and show which parts matched (part of) the query.
     * @param value The field value to search for hits.
     * @param query The simple query to use to search the text for hits.
     * @returns The full string subdivided in consecutive parts. Combining all the substrings
     * will result in the input string. Each part is marked with whether it matches the input query.
     */
    public * highlight(value: string | number, query: string = ''): IterableIterator<TextPart> {
        let text = `${value}`;
        if (query == null || query == '') {
            yield { substring: text, isHit: false };
            return;
        }
        let expression = HighlightService.queryExpressions[query];
        if (!expression) {
            expression = HighlightService.queryExpressions[query] = this.getQueryExpression(query);
        }

        let result: RegExpExecArray;
        let parsedText: TextPart[] = [];
        let lastIndex = 0;

        for (let i = 0; (result = expression.exec(text)) !== null && i < maxHits; i++) {
            let patternIndex = result.index + result[1].length;
            if (lastIndex < patternIndex) {
                yield { substring: text.substring(lastIndex, patternIndex), isHit: false };
            }

            // regex groups: (1 = word boundary)(2 = pattern)(3 = word boundary)
            yield { substring: result[2], isHit: true };
            lastIndex = patternIndex + result[2].length;
        }

        if (text.length > lastIndex) {
            yield { substring: text.substring(lastIndex), isHit: false };
        }
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

        // also look for whitespace as separator: word boundaries don't work properly for non-ASCII characters
        return new RegExp(`(^|\\b|[\\.,]|\\s)(${patterns.map(pattern => `${pattern}`).join('|')})($|\\b|[\\.,]|\\s)`, 'gui');
    }

    /**
     * Get the word patterns match in a query.
     * @param query
     */
    private getQueryWords(query: string): string[] {
        return query.replace('.', '\\.').replace('*', '.*?\\b').split(/[ \|\+]/g).filter(word => !!word);
    }
}

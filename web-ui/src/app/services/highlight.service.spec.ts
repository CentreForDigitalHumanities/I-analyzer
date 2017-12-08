import { HighlightService, TextPart } from './highlight.service';

describe('HighlightService', () => {
    let highlightService: HighlightService;
    beforeEach((() => {
        highlightService = new HighlightService();
    }));

    it('Works when there are no matches', () => {
        expectHighlights(
            'Certainly my troops must consist of numbers, or they can have no existence at all.',
            'letters',
            []);
    });

    it('Finds one match', () => {
        expectHighlights(
            'Certainly my troops must consist of numbers, or they can have no existence at all.',
            'numbers',
            [[36, 'numbers']]);
    });

    it('Finds multiple matches', () => {
        expectHighlights(
            'Sometimes it is the people no one can imagine anything of who do the things no one can imagine.',
            'imagine',
            [[38, 'imagine'],
            [87, 'imagine']]);
    });

    it('Accepts multiple', () => {
        let separators = ['', '+', '|'];
        for (let separator of separators) {
            expectHighlights(
                'Sometimes it is the people no one can imagine anything of who do the things no one can imagine.',
                `imagine ${separator} anything`,
                [[38, 'imagine'],
                [46, 'anything'],
                [87, 'imagine']]);
        }
    });

    it('Accepts quotes', () => {
        expectHighlights(
            'Sometimes it is the people no one can imagine anything of who do the things no one can imagine.',
            '"imagine anything"',
            [[38, 'imagine anything']]);

        // test surrogate pairs
        expectHighlights(
            '𝐀 💩 𝐁 I ♡ Unicode!',
            '"💩 𝐁"',
            [[2, '💩 𝐁']]);
    });

    it('Should only match fully', () => {
        expectHighlights(
            'pen apple pineapple',
            'apple',
            [[4, 'apple']]);
    });

    it('Accepts numbers', () => {
        expectHighlights(42, '', []);
        expectHighlights(123456, '23', []);
        expectHighlights(123, '123', [[0, '123']]);
    })

    it('Should accept wildcards', () => {
        expectHighlights(
            'They told me computers could only do arithmetic.',
            'co*',
            [[13, 'computers'],
            [23, 'could']]);
    });

    it('Should understand non-ASCII word boundaries', () => {
        expectHighlights(
            'Ik heb getwijfeld over België. Omdat iedereen daar lacht.',
            'België',
            [[23, 'België']]);
    });

    it('Should accept right-to-left text', () => {
        expectHighlights(
            'كتاب المختصر في حساب الجبر والمقابلة',
            'في كتاب',
            [[0, 'كتاب'],
            [13, 'في']]);
    });

    let expectHighlights = (value: string | number, query: string, expectedHighlightRanges: [number, string][]) => {
        let text = `${value}`;
        let highlights = highlightService.highlight(
            value,
            query);
        let expectedHighlights = getExpectedHighlights(new UnicodeString(text), expectedHighlightRanges);
        expect(getHighlightedString(highlights)).toEqual(getHighlightedString(expectedHighlights));
    }

    let getExpectedHighlights = (text: UnicodeString, expectedHighlightRanges: [number, string][]) => {
        if (!expectedHighlightRanges.length) {
            return [{ substring: text.toString(), isHit: false }];
        }

        let expectedHighlights: TextPart[] = [];
        let lastIndex = 0;

        for (let range of expectedHighlightRanges) {
            let expectedHitPosition = range[0];
            if (expectedHitPosition > lastIndex) {
                expectedHighlights.push({ substring: text.substring(lastIndex, expectedHitPosition).toString(), isHit: false });
            }

            let expectedHitText = new UnicodeString(range[1]);
            expectedHighlights.push({ substring: text.substr(expectedHitPosition, expectedHitText.length).toString(), isHit: true });
            lastIndex = expectedHitPosition + expectedHitText.length;
        }

        if (text.length > lastIndex) {
            expectedHighlights.push({ substring: text.substring(lastIndex).toString(), isHit: false });
        }

        return expectedHighlights;
    }

    let getHighlightedString = (parts: TextPart[]) =>
        parts.map(part => part.isHit ? `*${part.substring}*` : part.substring).join('');
});

/**
 * Wrapper for abstracting away Javascript unicode string handling oddities.
 */
class UnicodeString {
    private characters: string[];

    constructor(public value: string) {
        this.characters = Array.from(value);
    }

    public get length() {
        return this.characters.length;
    }

    public toString() {
        return this.value;
    }

    public substr(from: number, length?: number): UnicodeString {
        return this.substring(from, length ? from + length : undefined);
    }

    public substring(start: number, end?: number): UnicodeString {
        return new UnicodeString(this.characters.slice(start, end ? end : undefined).join(''));
    }
}

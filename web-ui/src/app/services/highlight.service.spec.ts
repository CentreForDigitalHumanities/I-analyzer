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
    });

    it('Should only match fully', () => {
        expectHighlights(
            'pen apple pineapple',
            'apple',
            [[4, 'apple']]);
    });

    it('Should accept wildcards', () => {
        expectHighlights(
            'They told me computers could only do arithmetic.',
            'co*',
            [[13, 'computers'],
            [23, 'could']]);
    });

    let expectHighlights = (text: string, query: string, expectedHighlightRanges: [number, string][]) => {
        let highlights = highlightService.highlight(
            text,
            query);
        let expectedHighlights = getExpectedHighlights(text, expectedHighlightRanges);
        expect(highlights).toEqual(expectedHighlights);
    }

    let getExpectedHighlights = (text: string, expectedHighlightRanges: [number, string][]) => {
        if (!expectedHighlightRanges.length) {
            return [{ substring: text, isHit: false }];
        }

        let expectedHighlights: TextPart[] = [];
        let lastIndex = 0;

        for (let range of expectedHighlightRanges) {
            if (range[0] > lastIndex) {
                expectedHighlights.push({ substring: text.substring(lastIndex, range[0]), isHit: false });
            }
            expectedHighlights.push({ substring: text.substr(range[0], range[1].length), isHit: true });
            lastIndex = range[0] + range[1].length;
        }

        if (text.length > lastIndex) {
            expectedHighlights.push({ substring: text.substring(lastIndex), isHit: false });
        }

        return expectedHighlights;
    }
});

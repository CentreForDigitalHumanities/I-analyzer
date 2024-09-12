import { ParagraphPipe } from './paragraph.pipe';

describe('ParagraphPipe', () => {
    it('creates an instance', () => {
      const pipe = new ParagraphPipe();
      expect(pipe).toBeTruthy();
    });

    it('does not alter text without linebreaks', () => {
        const pipe = new ParagraphPipe();
        const input = 'Some text. And some more text. And even more.';
        const output = pipe.transform(input);
        expect(output).toEqual(input);
    });

    it('wraps text with linebreaks in paragraph tags', () => {
        const pipe = new ParagraphPipe();
        const input = 'Some text.\nAnd some more text.\nAnd even more.';
        const output = pipe.transform(input);
        const expected = '<p>Some text.</p><p>And some more text.</p><p>And even more.</p>'
        expect(output).toEqual(expected);
    });

});

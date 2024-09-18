import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';


import { ParagraphPipe } from './paragraph.pipe';

describe('ParagraphPipe', () => {
    let pipe: ParagraphPipe;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ParagraphPipe,
                { provide: DomSanitizer, useValue: {
                        bypassSecurityTrustHtml: (input) => input
                    }
                }
            ]
        });
        pipe = TestBed.inject(ParagraphPipe);
    })

    it('creates an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('does not alter text without linebreaks', () => {
        const input = 'Some text. And some more text. And even more.';
        const output = pipe.transform(input);
        expect(output).toEqual(input);
    });

    it('wraps text with linebreaks in paragraph tags', () => {
        const input = 'Some text.\nAnd some more text.\nAnd even more.';
        const output = pipe.transform(input);
        const expected = '<p>Some text.</p><p>And some more text.</p><p>And even more.</p>'
        expect(output).toEqual(expected);
    });

    it('ignores multiple linebreaks', () => {
        const input = '\nSome text.\n\n\nAnd some more text.\n\n';
        const output = pipe.transform(input);
        const expected = '<p>Some text.</p><p>And some more text.</p>'
        expect(output).toEqual(expected);
    });

});

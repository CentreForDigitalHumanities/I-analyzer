import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'paragraph',
})
export class ParagraphPipe implements PipeTransform {
    constructor(private domSanitizer: DomSanitizer) {}

    transform(content: string | string[]): unknown {
        const splitText = this.addParagraphBreaks(content);
        return splitText;
    }

    addParagraphBreaks(content: string | string[]): SafeHtml {
        const paragraphs = typeof content === 'string' ? content.split('\n') : content;
        if (!paragraphs || paragraphs.length === 1) {
            return content as string;
        }
        const cleanedParagraphs = paragraphs.filter(p => p !== '')
        const wrapped = cleanedParagraphs.join('</p><p>')
        return this.domSanitizer.bypassSecurityTrustHtml(`<p>${wrapped}</p>`);
    }


}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'paragraph',
})
export class ParagraphPipe implements PipeTransform {

    transform(content: string | string[]): unknown {
        const splitText = this.addParagraphBreaks(content);
        return splitText;
    }

    addParagraphBreaks(content: string | string[]): string {
        const paragraphs = typeof content === 'string' ? content.split('\n') : content;
        if (!paragraphs || paragraphs.length === 1) {
            return content as string;
        }
        const cleanedParagraphs = paragraphs.filter(p => p !== '')
        const wrapped = cleanedParagraphs.join('</p><p>')
        return `<p>${wrapped}</p>`;
    }


}

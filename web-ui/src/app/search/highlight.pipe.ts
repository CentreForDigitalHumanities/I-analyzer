import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HighlightService } from '../services/highlight.service';

@Pipe({
    name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer, private highlightService: HighlightService) {
    }

    /**
     * Transforms a text to highlight all the text matching the specified query.
     * @param snippets Only show snippets. When this enabled, line breaks will also be replaced with --
     */
    transform(text: string, query: string, snippets: boolean = false) {
        let highlights = this.highlightService.highlight(text, query);
        let parts = snippets ? this.highlightService.snippets(highlights) : Array.from(highlights);
        let highlightedText = parts.map(part => {
            let sanitizedText = this.sanitizedLineBreaks(part.substring, snippets ? " &mdash; " : "<br />");

            return part.isHit ? `<span class="highlight">${sanitizedText}</span>` : sanitizedText;
        }).join('');

        return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
    }

    private sanitizedLineBreaks(text: string, breakPlaceholder: string) {
        let substrings = text.split(/[\r\n]{1,2}/g);
        return substrings.map(substring => {
            return this.sanitizer.sanitize(SecurityContext.HTML, substring);
        }).join(breakPlaceholder);
    }
}

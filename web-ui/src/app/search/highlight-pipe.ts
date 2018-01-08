import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HighlightService } from '../services/highlight.service';

@Pipe({
    name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer, private highlightService: HighlightService) {
    }

    transform(text: string, query: string, snippets: boolean = false) {
        let highlights = this.highlightService.highlight(text, query);
        let parts = snippets ? this.highlightService.snippets(highlights) : Array.from(highlights);
        let highlightedText = parts.map(part => {
            let sanitizedText = this.sanitizer.sanitize(SecurityContext.HTML, part.substring);

            return part.isHit ? `<span class="highlight">${sanitizedText}</span>` : sanitizedText;
        }).join('');

        return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
    }
}

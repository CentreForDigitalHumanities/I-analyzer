import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HighlightService } from '../services/highlight.service';

@Pipe({
    name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer, private highlightService: HighlightService) {
    }

    transform(text: string, query: string) {
        let highlightedText = this.highlightService.highlight(text, query).map(part => {
            let sanitizedText = this.sanitizer.sanitize(SecurityContext.HTML, part.substring);

            return !part.isHit ? sanitizedText : `<span class="highlight">${sanitizedText}</span>`;
        }).join('');

        return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
    }
}

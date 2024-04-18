import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CorpusField, FoundDocument } from '../models';
import * as _ from 'lodash';

@Pipe({
    name: 'elasticsearchHighlight'
})
export class ElasticsearchHighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {
    }

    /**
     * Transforms a text to display highlights fetched from Elasticsearch
     *
     * @param document a FoundDocument, containing the fetched highlights
     */
    transform(field: CorpusField, document: FoundDocument) {
        const fieldValue = document.fieldValues[field.name];

        if (_.isEmpty(fieldValue)) {
            return;
        }

        const highlighted = this.highlightedInnerHtml(field, document);
        const paragraphs = this.addParagraphTags(highlighted);
        return this.sanitizer.bypassSecurityTrustHtml(paragraphs);
    }

    highlightedInnerHtml(field: CorpusField, document: FoundDocument) {
        let highlighted = document.fieldValues[field.name];
        if (document.highlight && document.highlight.hasOwnProperty(field.name)) {
                for (const highlight of document.highlight[field.name]) {
                    const strippedHighlight = this.stripTags(highlight);
                    highlighted = highlighted.replace(strippedHighlight, highlight);
                }
            }
        return highlighted;
    }

    addParagraphTags(content: string | string[]) {
        const paragraphs = typeof content === 'string' ? content.split('\n') : content;
        return paragraphs.map(p => `<p>${p}</p>`).join(' ');
    }

    stripTags(htmlString: string){
        const parseHTML= new DOMParser().parseFromString(htmlString, 'text/html');
        return parseHTML.body.textContent || '';
    }

}

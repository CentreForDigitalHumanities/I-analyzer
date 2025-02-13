import { CorpusDocumentationPage } from '@models';

export const PAGE_CATEGORIES = [
    {
        id: 'general',
        title: 'General information',
    },
    {
        id: 'citation',
        title: 'Citation',
    },
    {
        id: 'license',
        title: 'License'
    },
    {
        id: 'terms_of_service',
        title: 'Terms of service',
    },
    {
        id: 'wordmodels',
        title: 'Word models'
    }
];

export class EditablePage {
    id?: number;
    content: string = '';

    constructor(
        public corpusName: string,
        public title: string,
    ) {
    }

    update(storedPages: CorpusDocumentationPage[]) {
        const stored = storedPages.find(page => page.type == this.title);
        if (stored) {
            this.id = stored.id;
            this.content = stored.content_template;
        } else {
            this.id = undefined;
            this.content = '';
        }
    }
}

export const makePages = (corpusName: string): EditablePage[] =>
    PAGE_CATEGORIES.map(category =>
        new EditablePage(corpusName, category.title)
    );

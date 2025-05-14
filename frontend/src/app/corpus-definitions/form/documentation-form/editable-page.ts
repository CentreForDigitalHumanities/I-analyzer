interface DocumentationCategory {
    id: string,
    title: string,
    description: string,
}

export const PAGE_CATEGORIES: DocumentationCategory[] = [
    {
        id: 'general',
        title: 'General information',
        description: 'Provide a description of your corpus. What kind of data is this? Where does it come from?',
    },
    {
        id: 'citation',
        title: 'Citation',
        description: 'You can provide citation guidelines for your corpus. Clear citation guidelines encourage others to use your corpus in research, and can make sure that you are cited appropriately when they do.',
    },
    {
        id: 'license',
        title: 'License',
        description: 'We recommend providing a licence for others to reuse the data in your corpus, if possible.',
    },
];

export class EditablePage {
    id?: number;
    content: string = '';

    constructor(
        public corpusName: string,
        public category: DocumentationCategory,
    ) { }
}

export const makePages = (corpusName: string): EditablePage[] =>
    PAGE_CATEGORIES.map(category =>
        new EditablePage(corpusName, category)
    );

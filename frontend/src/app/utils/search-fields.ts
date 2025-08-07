import { Corpus, CorpusField } from '@models';
import _ from 'lodash';

export const searchFieldOptions = (corpus: Corpus): CorpusField[] => {
    const searchableFields = corpus.fields.filter(field => field.searchable && !field.hidden);
    return _.flatMap(searchableFields, field => searchableVariants(field));
}

export const searchableVariants = (field: CorpusField): CorpusField[] => {
    if (field.multiFields?.includes('text')) {
        return [textVariant(field)];
    } else if (field.multiFields?.includes('stemmed')) {
        return [field, stemmedVariant(field)];
    } else {
        return [field];
    }
}

const textVariant = (field: CorpusField): CorpusField => {
    const variant = _.clone(field);
    variant.name = field.name + '.text';
    variant.multiFields = null;
    return variant;
}

const stemmedVariant = (field: CorpusField): CorpusField => {
    const variant = _.clone(field);
    variant.name = field.name + '.stemmed';
    variant.displayName = field.displayName + ' (stemmed)'
    variant.multiFields = null;
    return variant;
}

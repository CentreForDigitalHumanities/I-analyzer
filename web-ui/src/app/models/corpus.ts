export class Corpus {
  constructor(public name: string, public fields: CorpusField[], public minDate: Date, public maxDate: Date) { }
}

type ElasticSearchIndex = {
  doctype: 'article',
  index: string
}

export type CorpusField = {
  description: string,
  type: 'keyword' | 'integer' | 'text' | 'date' | 'boolean',
  hidden: boolean,
  name: string,
  searchFilter: SearchFilter | null
}

export type SearchFilter = BooleanFilter | MultipleChoiceFilter | RangeFilter | DateFilter;

type BooleanFilter = {
  description: string,
  name: 'BooleanFilter',
  falseText: string,
  trueText: string
}
type MultipleChoiceFilter = {
  description: string
  name: 'MultipleChoiceFilter',
  options: string[]
}

type RangeFilter = {
  description: string
  name: 'RangeFilter',
  lower: number,
  upper: number
}

type DateFilter = {
  description: string
  name: 'DateFilter',
  lower: Date,
  upper: Date
}

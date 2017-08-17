export type SearchFilterData =
    { 'terms': { [fieldName: string]: string[] } } |
    { 'range': { [fieldName: string]: { gte: number, lte: number } } }

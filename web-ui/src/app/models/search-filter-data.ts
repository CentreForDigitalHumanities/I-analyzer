export type SearchFilterData =
    { 'term': { [fieldName: string]: boolean } } |
    { 'terms': { [fieldName: string]: string[] } } |
    {
        'range': {
            [fieldName: string]: { gte: number, lte: number } | { gte: string, lte: string, format: string }
        }
    }

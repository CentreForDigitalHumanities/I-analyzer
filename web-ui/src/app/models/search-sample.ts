export type SearchSample = {
    fields: string[],
    hits: { [fieldName: string]: string }[],
    total: number
}

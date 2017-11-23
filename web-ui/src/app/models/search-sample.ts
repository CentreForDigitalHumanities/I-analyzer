import { NgIterable } from '@angular/core';
export type SearchSample = {
    fields: string[],
    hits: NgIterable<{ [fieldName: string]: string }>,
    total: number
}

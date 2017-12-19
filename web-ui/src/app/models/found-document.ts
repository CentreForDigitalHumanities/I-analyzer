export type FoundDocument = {
    id: string,
    /**
     * Normalized relevance [0,1] with 1 being most relevant
     */
    relevance: number,
    fieldValues: { [fieldName: string]: string },
    /**
     * One-based position of this document using the query to get this document
     */
    position: number
};

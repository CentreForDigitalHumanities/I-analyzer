export interface FoundDocument {
    id: string;
    /**
     * Normalized relevance [0,1] with 1 being most relevant
     */
    relevance: number;
    fieldValues: { [fieldName: string]: any };
    /**
     * Position of the document in the array of results
     */
    position?: number;
    highlight?: {[fieldName: string]: string[]};
}

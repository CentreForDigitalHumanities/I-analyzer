export interface Tag {
    id: number;
    name: string;
    description: string;
    count: number;
}

export interface DocumentTagsResponse {
    corpus: string;
    doc_id: string;
    tags: Tag[];
};

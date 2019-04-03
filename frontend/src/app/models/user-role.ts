export type UserRole = {
    name: string,
    description: string,
    corpora: AccessibleCorpus [];
};

// reflects access right to a given corpus.
// corresponds to corpus model on the backend.
export type AccessibleCorpus = {
    name: string,
    description: string
};
export type UserRole = {
    name: string,
    description: string,
    corpora: AccessibleCorpus [];
};

// reflects access right to a given corpus
export type AccessibleCorpus = {
    name: string,
    description: string
};
export interface UserRole {
    name: string;
    description: string;
    corpora: AccessibleCorpus [];
}

// reflects access right to a given corpus.
// corresponds to corpus model on the backend.
export interface AccessibleCorpus {
    name: string;
    description: string;
}

import {AccessibleCorpus} from '../models/index';

export type UserRole = {
    name: string,
    description: string,
    corpora: AccessibleCorpus[]
}

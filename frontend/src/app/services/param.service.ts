import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';

import { Corpus, CorpusField, FoundDocument, QueryModel } from '../models';
import { SearchService } from './search.service';

@Injectable()
export class ParamService {

    constructor(private searchService: SearchService) { }



}

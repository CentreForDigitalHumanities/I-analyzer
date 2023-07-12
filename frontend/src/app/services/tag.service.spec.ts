import { TestBed } from '@angular/core/testing';

import { TagService } from './tag.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TagService', () => {
    let service: TagService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule
            ]
        });
        service = TestBed.inject(TagService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});

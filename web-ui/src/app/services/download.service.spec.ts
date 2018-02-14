import { TestBed, inject } from '@angular/core/testing';

import { DownloadService } from './download.service';

describe('DownloadService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DownloadService]
        });
    });

    it('should be created', inject([DownloadService], (service: DownloadService) => {
        expect(service).toBeTruthy();
    }));

    it('should properly escape CSV cell values', inject([DownloadService], (service: DownloadService) => {
        let expectCell = (value: string, expected: string) => {
            expect(service.csvCell(value, ",")).toEqual(expected);
        };

        expectCell("", "");
        // no quote, no problem
        expectCell("42", "42");
        // quotes should be escaped
        expectCell(`Fire the "laser"!`, `"Fire the ""laser""!"`);
        // separators should be escaped
        expectCell(`So long, and thanks for all the fish!`, `"So long, and thanks for all the fish!"`);
        // newlines should be escaped
        expectCell(`while this format is very common
            it has never been formally documented`,
            `"while this format is very common
            it has never been formally documented"`);
        // something containing all this misery should work
        expectCell(`The Gutenberg Bible is also known as the "42-line Bible",
            as the book contained 42 lines per page.`,
            `"The Gutenberg Bible is also known as the ""42-line Bible"",
            as the book contained 42 lines per page."`);
    }));
});

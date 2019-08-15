import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { ScanPdfComponent } from './scan-pdf.component';

describe('ScanPdfComponent', () => {
  let component: ScanPdfComponent;
  let fixture: ComponentFixture<ScanPdfComponent>;

  beforeEach(async(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanPdfComponent);
    component = fixture.componentInstance;
    component.pdfData = {
        status: 200,
        body: new ArrayBuffer(42),
        headers: { pdfinfo: JSON.stringify({
            fileName: 'Super interesting PDF', 
            fileSize: '42MB', 
            pageNumbers: [2, 3, 4, 5, 6],
            homePageIndex: 4
        })}
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

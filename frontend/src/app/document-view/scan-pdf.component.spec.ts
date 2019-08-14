import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { ApiService, ConfigService } from '../services/index';
import { ApiServiceMock } from '../../mock-data/api';
import { MockCorpusResponse } from '../../mock-data/corpus';
import { ScanPdfComponent } from './scan-pdf.component';
import { ConfirmDialogModule } from 'primeng/primeng';
import { ResourceModule } from '@ngx-resource/handler-ngx-http';

describe('ScanPdfComponent', () => {
  let component: ScanPdfComponent;
  let fixture: ComponentFixture<ScanPdfComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScanPdfComponent, PdfViewerComponent],
      providers: [
        {
            provide: ApiService, useValue: new ApiServiceMock({
                ['corpus']: MockCorpusResponse
            })
        },
        ConfigService,
      ],
      imports: [ConfirmDialogModule, HttpModule, HttpClientModule, ResourceModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

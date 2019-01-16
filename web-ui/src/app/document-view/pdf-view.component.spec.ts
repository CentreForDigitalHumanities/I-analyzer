import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { ApiService, ConfigService, ScanImageService } from '../services/index';
import { PdfViewComponent } from './pdf-view.component';



describe('PdfViewComponent', () => {
  let component: PdfViewComponent;
  let fixture: ComponentFixture<PdfViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PdfViewComponent, PdfViewerComponent],
      providers: [
        ApiService,
        ConfigService,
        ScanImageService],
      imports: [HttpModule, HttpClientModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

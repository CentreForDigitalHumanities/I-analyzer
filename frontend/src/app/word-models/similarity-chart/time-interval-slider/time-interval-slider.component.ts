import { Component, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { debounce } from 'rxjs/operators';

@Component({
  selector: 'ia-time-interval-slider',
  templateUrl: './time-interval-slider.component.html',
  styleUrls: ['./time-interval-slider.component.scss']
})
export class TimeIntervalSliderComponent implements OnChanges {
    @Input() labels: string[];

    sliderIndex = new BehaviorSubject<number>(0);

    @Output() currentIndex = new BehaviorSubject<number>(0);
    @Output() currentLabel = new BehaviorSubject<string>('');

    constructor() {
        this.sliderIndex
            .pipe(debounce(() => interval(300)))
            .subscribe(value => this.currentIndex.next(value));
        this.currentIndex.subscribe(index => this.setCurrentLabel());
    }

    ngOnChanges(): void {
        this.currentIndex.next(0);
    }

    setCurrentLabel() {
        if (this.labels && this.labels.length) {
            const label = this.labels[this.currentIndex.value];
            this.currentLabel.next(label);
        }
    }

    get sliderMax(): number {
        if (this.labels && this.labels.length) {
            return this.labels.length - 1;
        } else {
            return 0;
        }
    }

}

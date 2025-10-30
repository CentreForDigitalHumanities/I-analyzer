import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../../common-test-bed';

import { TimelineComponent } from './timeline.component';
import { QueryModel } from '@models';
import { corpusFactory } from 'mock-data/corpus';
import { SimpleChange } from '@angular/core';

describe('TimelineComponent', () => {
    let component: TimelineComponent;
    let fixture: ComponentFixture<TimelineComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TimelineComponent);
        component = fixture.componentInstance;
        const corpus = corpusFactory();
        component.queryModel = new QueryModel(corpus);
        component.visualizedField = corpus.fields.find(field => field.mappingType == 'date');
        component.ngOnChanges({
            queryModel: new SimpleChange(undefined, component.queryModel, true)
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should calculate correct time categories', () => {
        expect(component.data.calculateTimeCategory(new Date('1950-01-01'), new Date('1950-01-05'))).toEqual('day');
        expect(component.data.calculateTimeCategory(new Date('1950-01-01'), new Date('1950-02-01'))).toEqual('week');
        expect(component.data.calculateTimeCategory(new Date('1950-01-01'), new Date('1950-06-01'))).toEqual('month');
        expect(component.data.calculateTimeCategory(new Date('1950-01-01'), new Date('1953-01-01'))).toEqual('year');
    })

    it('should calibrate the x axis with a margin', () => {
        const min = new Date('1802-01-01');
        const max = new Date('1804-01-01');
        expect(component.addDateMargin(min, -1)).toEqual(new Date('1801-01-01'));
        expect(component.addDateMargin(max)).toEqual(new Date('1805-01-01'));
    })
});

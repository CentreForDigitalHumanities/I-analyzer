import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { commonTestBed } from '../common-test-bed';

import { DropdownComponent } from './dropdown.component';

describe('DropdownComponent', () => {
    let component: DropdownComponent<TestItem>;
    let fixture: ComponentFixture<DropdownComponent<TestItem>>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent<DropdownComponent<TestItem>>(DropdownComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should render options', async () => {
        component.options = [
            { name: 'item1', label: 'Item 1' },
            { name: 'item2', label: 'Item 2' },
            { name: 'item3', label: 'Item 3' }];
        component.optionLabel = 'label';
        component.value = component.options[1];
        fixture.detectChanges();
        await fixture.whenStable();

        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.innerHTML).toContain('Item 2');
        expect(compiled.innerHTML).not.toContain('Item 1');
        expect(compiled.innerHTML).not.toContain('item2');

        // allow switching value
        component.value = undefined;
        component.placeholder = 'Hello world!';
        fixture.detectChanges();
        await fixture.whenStable();

        expect(compiled.innerHTML).toContain('Hello world!');
        expect(compiled.innerHTML).not.toContain('Item 2');
        expect(compiled.innerHTML).not.toContain('item3');
    });
});

interface TestItem {
    name: string;
    label: string;
};

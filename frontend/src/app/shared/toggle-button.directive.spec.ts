import { Component } from '@angular/core';
import { ToggleButtonDirective } from './toggle-button.directive';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

@Component({
    template: `
    <button class="button" iaToggleButton [active]="active">
        Test
    </button>
    `,
})
class ToggleButtonTestComponent {
    active = false;
}

fdescribe('ToggleButtonDirective', () => {
    let fixture: ComponentFixture<ToggleButtonTestComponent>;
    let component: ToggleButtonTestComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ToggleButtonTestComponent, ToggleButtonDirective],
            imports: [CommonModule],
        });
        fixture = TestBed.createComponent(ToggleButtonTestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should show toggle state', () => {
        const element = fixture.debugElement.nativeElement as Element;
        const button = element.querySelector('button');

        expect(button.className).toEqual('button');
        expect(button.getAttribute('aria-pressed')).toBe('false');

        component.active = true;
        fixture.detectChanges();

        expect(button.className).toEqual('button is-primary');
        expect(button.getAttribute('aria-pressed')).toBe('true');
    });
});

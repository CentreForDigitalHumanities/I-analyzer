import { Directive, Input, TemplateRef } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Directive({
    selector: '[iaTabPanel]',
    standalone: false
})
export class TabPanelDirective {
    @Input() id: string | number;
    @Input() title: string;
    @Input() icon: IconDefinition;

    constructor(public templateRef: TemplateRef<unknown>) { }

}

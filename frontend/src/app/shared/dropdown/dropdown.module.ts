import { NgModule } from '@angular/core';
import { DropdownComponent } from './dropdown.component';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownMenuDirective } from './dropdown-menu.directive';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
    declarations: [
        DropdownComponent,
        DropdownMenuDirective,
        DropdownItemDirective,
    ],
    imports: [
        CommonModule,
        FontAwesomeModule,
    ],
    exports: [
        DropdownComponent,
        DropdownMenuDirective,
        DropdownItemDirective,
    ]
})
export class DropdownModule {};

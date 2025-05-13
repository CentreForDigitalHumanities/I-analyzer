import { Component, Input } from '@angular/core';

@Component({
  selector: 'ia-form-feedback',
  templateUrl: './form-feedback.component.html',
  styleUrl: './form-feedback.component.scss'
})
export class FormFeedbackComponent {
    @Input() showSuccess: boolean;
    @Input() showError: boolean;
}

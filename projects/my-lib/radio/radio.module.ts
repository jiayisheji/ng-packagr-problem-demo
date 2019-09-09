import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RadioComponent, RadioGroupDirective } from './radio.component';
import { FormFieldModule } from 'simple-ui/form-field';

@NgModule({
  imports: [
    CommonModule,
    FormFieldModule
  ],
  declarations: [RadioComponent, RadioGroupDirective],
  exports: [RadioComponent, RadioGroupDirective, FormFieldModule],
})
export class RadioModule { }

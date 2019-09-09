import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormFieldModule } from 'simple-ui/form-field';
import { CheckboxComponent, CheckboxGroupDirective } from './checkbox.component';
import { CheckboxRequiredValidatorDirective } from './checkbox-required-validator';

@NgModule({
  imports: [
    CommonModule,
    FormFieldModule
  ],
  declarations: [CheckboxComponent, CheckboxGroupDirective, CheckboxRequiredValidatorDirective],
  exports: [CheckboxComponent, CheckboxGroupDirective, CheckboxRequiredValidatorDirective]
})
export class CheckboxModule { }

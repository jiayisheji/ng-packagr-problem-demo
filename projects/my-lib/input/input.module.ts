import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputDirective } from './input.directive';

import { FormFieldModule } from 'simple-ui/form-field';
@NgModule({
  imports: [
    CommonModule,
    FormFieldModule
  ],
  declarations: [InputDirective],
  exports: [InputDirective, FormFieldModule]
})
export class InputModule { }

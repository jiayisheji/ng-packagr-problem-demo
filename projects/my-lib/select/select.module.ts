import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectComponent, SIM_SELECT_SCROLL_STRATEGY_PROVIDER } from './select.component';
import { OptionModule } from 'simple-ui/option';
import { FormFieldModule } from 'simple-ui/form-field';
import { OverlayModule } from '@angular/cdk/overlay';
import { SelectTriggerDirective } from './select-trigger.directive';
@NgModule({
  imports: [
    CommonModule,
    OptionModule,
    FormFieldModule,
    OverlayModule,
  ],
  declarations: [SelectComponent, SelectTriggerDirective],
  exports: [SelectComponent, SelectTriggerDirective, FormFieldModule, OptionModule],
  providers: [SIM_SELECT_SCROLL_STRATEGY_PROVIDER]
})
export class SelectModule { }

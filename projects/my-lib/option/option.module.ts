import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionComponent } from './option/option.component';
import { OptgroupComponent } from './optgroup/optgroup.component';
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [OptionComponent, OptgroupComponent],
  exports: [OptionComponent, OptgroupComponent]
})
export class OptionModule { }

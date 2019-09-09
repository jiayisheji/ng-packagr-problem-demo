import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipComponent, TooltipDirective } from './tooltip.component';
import { OverlayModule } from '@angular/cdk/overlay';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
  ],
  declarations: [TooltipComponent, TooltipDirective],
  exports: [TooltipDirective],
  entryComponents: [TooltipComponent]
})
export class TooltipModule { }

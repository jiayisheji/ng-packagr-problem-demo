import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PopoverComponent, PopoverDirective } from './popover.component';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
  ],
  declarations: [PopoverComponent, PopoverDirective],
  exports: [PopoverDirective],
  entryComponents: [PopoverComponent]
})
export class PopoverModule { }

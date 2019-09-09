import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EchartsDirective } from './echarts.directive';
import { EchartsService } from './echarts.service';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [EchartsService],
  declarations: [EchartsDirective],
  exports: [EchartsDirective]
})
export class EchartsModule { }

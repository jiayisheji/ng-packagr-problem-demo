import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorComponent } from './paginator.component';
import { SelectModule } from 'simple-ui/select';

@NgModule({
  imports: [
    CommonModule,
    SelectModule,
  ],
  declarations: [PaginatorComponent],
  exports: [PaginatorComponent]
})
export class PaginatorModule { }

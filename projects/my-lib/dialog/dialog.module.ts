import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SIM_DIALOG_SCROLL_STRATEGY_PROVIDER, SimDialogService } from './dialog.service';
import { DialogComponent } from './dialog.component';

import {
  DialogContentDirective,
  DialogActionsDirective,
  DialogCloseDirective,
  DialogHeaderDirective,
  DialogTitleDirective,
  DialogCancelDirective,
  DialogMaximizeDirective
} from './dialog.directive';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    PortalModule,
  ],
  exports: [
    DialogComponent,
    DialogContentDirective,
    DialogActionsDirective,
    DialogCloseDirective,
    DialogHeaderDirective,
    DialogTitleDirective,
    DialogCancelDirective,
    DialogMaximizeDirective,
  ],
  declarations: [
    DialogComponent,
    DialogContentDirective,
    DialogActionsDirective,
    DialogCloseDirective,
    DialogHeaderDirective,
    DialogTitleDirective,
    DialogCancelDirective,
    DialogMaximizeDirective,
  ],
  providers: [
    SimDialogService,
    SIM_DIALOG_SCROLL_STRATEGY_PROVIDER,
  ],
  entryComponents: [DialogComponent],
})
export class DialogModule { }

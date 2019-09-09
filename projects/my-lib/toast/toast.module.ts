import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { LayoutModule } from '@angular/cdk/layout';
import { ToastComponent } from './toast.component';
import { NotificationComponent } from './notification/notification.component';
import { MessageComponent } from './message/message.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { SimToastService } from './toast.service';
import { ButtonModule } from 'simple-ui/button';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    PortalModule,
    LayoutModule,
    ButtonModule
  ],
  declarations: [ToastComponent, NotificationComponent, MessageComponent, ConfirmComponent],
  exports: [ToastComponent],
  entryComponents: [ToastComponent, NotificationComponent, MessageComponent, ConfirmComponent],
  providers: [SimToastService]
})
export class ToastModule { }

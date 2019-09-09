import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Inject, HostBinding, TemplateRef } from '@angular/core';
import { simToastAnimations } from '../toast-animations';
import { SimToastRef } from '../toast-ref';
import { SIM_TOAST_DATA } from '../toast-config';
import { ToastType } from '../toast.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [simToastAnimations.notificationState],
})
export class NotificationComponent {
  data: { title: string, content: string | TemplateRef<{}>, type: ToastType, state: string };
  isTemplate: boolean;
  isString: boolean;
  get state(): string {
    if (this.data.state === 'enterLeft') {
      return 'enterLeft';
    } else {
      return 'enterRight';
    }
  }
  constructor(
    public simToastRef: SimToastRef<NotificationComponent>,
    @Inject(SIM_TOAST_DATA) data: any) {
    this.data = data;
    if (this.data.content instanceof String) {
      this.isString = true;
    } else {
      if (this.data.content instanceof TemplateRef) {
        this.isTemplate = true;
      } else {
        this.data.content = '';
        this.isString = true;
      }
    }
  }

  close() {
    this.simToastRef.dismissWithAction(false);
  }

}

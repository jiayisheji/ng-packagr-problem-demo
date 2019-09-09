import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Inject, HostBinding } from '@angular/core';
import { simToastAnimations } from '../toast-animations';
import { SimToastRef } from '../toast-ref';
import { SIM_TOAST_DATA } from '../toast-config';
import { ConfirmType } from '../toast.service';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [simToastAnimations.contentFade],
})
export class ConfirmComponent {
  state: 'enter' | 'leave' = 'enter';
  data: {
    message: string,
    actions: {
      title: string,
      confirm: string,
      cancel: string;
      confirmType: ConfirmType
    }
  };

  constructor(
    public simToastRef: SimToastRef<ConfirmComponent>,
    @Inject(SIM_TOAST_DATA) data: any) {
    this.data = data;
  }

  /** Performs the action on the snack bar. */
  confirm(): void {
    this.simToastRef.dismissWithAction(true);
  }

  /** Performs the action on the snack bar. */
  cancel(): void {
    this.simToastRef.dismissWithAction(false);
  }
}

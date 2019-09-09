import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Inject, HostBinding } from '@angular/core';
import { simToastAnimations } from '../toast-animations';
import { SimToastRef } from '../toast-ref';
import { SIM_TOAST_DATA } from '../toast-config';
import { ToastType } from '../toast.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [simToastAnimations.messageState],
})
export class MessageComponent implements OnInit {
  data: { message: string, type: ToastType };
  state: 'enter' | 'leave' = 'enter';
  constructor(
    public simToastRef: SimToastRef<MessageComponent>,
    @Inject(SIM_TOAST_DATA) data: any) {
    this.data = data;
  }

  ngOnInit() {
  }

  onEnter(): void {

  }

  onLeave(): void {

  }

}

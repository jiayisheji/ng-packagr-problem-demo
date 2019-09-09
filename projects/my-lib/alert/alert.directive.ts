import { Directive, HostBinding, Input, Inject, ElementRef, InjectionToken } from '@angular/core';
import { AlertTypeIcon, AlertType } from './alert';
import { toBoolean } from 'simple-ui/core';

export const USE_ALERT_TIPS_ICON = new InjectionToken('USE_ALERT_TIPS_ICON');
export const USE_ALERT_NOTES_ICON = new InjectionToken('USE_ALERT_NOTES_ICON');

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-alert-tips-icon, [sim-alert-tips-icon]'
})
export class AlertTipsDirective {
  private _element: HTMLElement;
  @HostBinding('class.sim-alert-tips-icon') true;

  @Input()
  get custom(): boolean {
    return this._custom;
  }
  set custom(value: boolean) {
    this._custom = toBoolean(value);
  }
  private _custom: boolean = false;

  set type(value: AlertType) {
    if (value && !this.custom) {
      this._element.classList.add(this.typeIcon[value]);
    }
  }
  constructor(
    @Inject(USE_ALERT_TIPS_ICON) private typeIcon: AlertTypeIcon,
    private elementRef: ElementRef
  ) {
    this._element = elementRef.nativeElement;
   }

}


@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-alert-notes-icon, [sim-alert-notes-icon]'
})
export class AlertNotesDirective {
  private _element: HTMLElement;
  @HostBinding('class.sim-alert-notes-icon') true;

  @Input()
  get custom(): boolean {
    return this._custom;
  }
  set custom(value: boolean) {
    this._custom = toBoolean(value);
  }
  private _custom: boolean = false;

  set type(value: AlertType) {
    if (value && !this.custom) {
      this._element.classList.add(this.typeIcon[value]);
    }
  }

  constructor(
    @Inject(USE_ALERT_NOTES_ICON) private typeIcon: AlertTypeIcon,
    private elementRef: ElementRef
  ) {
    this._element = elementRef.nativeElement;
  }

}

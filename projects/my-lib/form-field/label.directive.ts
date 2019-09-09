import { Directive, Input, HostBinding, ElementRef } from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[simLabel]'
})
export class LabelDirective {
  @HostBinding('class.sim-form-field-label') true;

  private _required: boolean;
  @Input()
  @HostBinding('class.sim-form-field-label-required')
  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = value;
  }

  private _forid: string;
  @Input()
  @HostBinding('attr.for')
  get forid(): string {
    return this._forid;
  }

  set forid(value: string) {
    this._forid = value;
  }

  constructor(elementRef: ElementRef) { }

}

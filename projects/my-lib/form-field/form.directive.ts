import { Directive, HostBinding, Input, ViewChildren, ElementRef } from '@angular/core';
import { FormLayout } from './form-field';
import { mixinSize, ThemeSize, CanSize } from 'simple-ui/core';

// 应用 mixins 到 SimInput 的基类
export class SimFormBase {
  constructor(
    public _elementRef: ElementRef) { }
}
export const _SimFormBaseMixinBase = mixinSize(SimFormBase, 'md');

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[simForm],[sim-form]'
})
export class FormDirective extends _SimFormBaseMixinBase implements CanSize {
  @HostBinding('class.sim-form') true;
  private _layout: FormLayout = 'horizontal';
  @Input()
  set layout(value: FormLayout) {
    if (!value) {
      return;
    }
    this._layout = value;
  }
  get layout(): FormLayout {
    return this._layout;
  }

  @HostBinding('class.sim-form-horizontal')
  get layoutHorizontal() {
    return this._layout === 'horizontal';
  }

  @HostBinding('class.sim-form-vertical')
  get layoutVertical() {
    return this._layout === 'vertical';
  }

  @HostBinding('class.sim-form-inline')
  get layoutInline() {
    return this._layout === 'inline';
  }

  @Input() size: ThemeSize;

  constructor(_elementRef: ElementRef) {
    super(_elementRef);
  }

}

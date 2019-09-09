import { Directive, HostBinding, Input } from '@angular/core';
let nextUniqueId = 0;
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-tips,[simTips]'
})
export class TipsDirective {
  @HostBinding('class.sim-tips') true;
  constructor() { }

  @Input() align: 'start' | 'end' = 'start';

  @HostBinding('attr.align')
  get attrAlign() {
    return null;
  }

  @HostBinding('class.sim-tips-end')
  get simHintEnd() {
    return this.align === 'end';
  }

  @HostBinding('attr.id')
  @Input() id = `sim-tips-${nextUniqueId++}`;
}

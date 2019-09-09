import { Directive, HostBinding, Input } from '@angular/core';
let nextUniqueId = 0;
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-hint,[simHint]'
})
export class HintDirective {
  @HostBinding('class.sim-hint') true;


  @Input() align: 'start' | 'end' = 'start';

  @HostBinding('attr.align')
  get attrAlign() {
    return null;
  }

  @HostBinding('class.sim-hint-end')
  get simHintEnd() {
    return this.align === 'end';
  }

  @HostBinding('attr.id')
  @Input() id = `sim-hint-${nextUniqueId++}`;

}

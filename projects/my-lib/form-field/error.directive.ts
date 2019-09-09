import { Directive, Input, HostBinding } from '@angular/core';
let nextUniqueId = 0;
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-error,[simError]'
})
export class ErrorDirective {
  @HostBinding('class.sim-error') true;
  @HostBinding('attr.role')
  get attrRole() {
    return 'alert';
  }

  @HostBinding('attr.id')
  @Input() id = `sim-error-${nextUniqueId++}`;

}

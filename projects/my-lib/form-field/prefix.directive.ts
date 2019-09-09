import { Directive, HostBinding } from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[simPrefix]'
})
export class PrefixDirective {
  @HostBinding('class.sim-prefix') true;
  constructor() { }

}

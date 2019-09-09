import { Directive, HostBinding } from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[simSuffix]'
})
export class SuffixDirective {
  @HostBinding('class.sim-suffix') true;
  constructor() { }

}

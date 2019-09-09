import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, HostBinding } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[sim-menu-group]',
  templateUrl: './menu-group.component.html',
  encapsulation: ViewEncapsulation.None
})
export class MenuGroupComponent implements OnInit {
  @HostBinding('class.sim-menu-item-group') true;
  constructor() { }

  ngOnInit() {
  }

}

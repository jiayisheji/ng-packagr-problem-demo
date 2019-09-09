import { Component, OnInit, HostBinding, ViewEncapsulation } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-menu-title',
  templateUrl: './menu-title.component.html',
  encapsulation: ViewEncapsulation.None
})
export class MenuTitleComponent implements OnInit {
  @HostBinding('class.sim-menu-title') true;
  constructor() { }

  ngOnInit() {
  }

}

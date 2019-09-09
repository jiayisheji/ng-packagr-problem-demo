import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, HostBinding, Input, AfterContentInit } from '@angular/core';
import { toBoolean } from 'simple-ui/core';
import { MenuItemComponent } from './menu-item/menu-item.component';
import { SubMenuComponent } from './sub-menu/sub-menu.component';



export type MenuMode = 'vertical' | 'horizontal' | 'inline';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-menu,[sim-menu]',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MenuComponent implements OnInit, AfterContentInit {
  private cacheMode: MenuMode;
  private isInit = false;

  /** collection of menu item */
  menuItems: MenuItemComponent[] = [];
  /** collection of sub menu */
  subMenus: SubMenuComponent[] = [];
  subMenusOpenIndex: number[] = [];

  @Input() inlineIndent = 24;
  // 绑定宿主类
  @HostBinding('class') hostClassName = 'sim-menu sim-menu-root';
  @Input() mode: MenuMode = 'vertical';

  @Input()
  get inlineCollapsed(): boolean {
    return this._inlineCollapsed;
  }
  set inlineCollapsed(value: boolean) {
    this._inlineCollapsed = toBoolean(value);
    if (this.isInit) {
      this.updateInlineCollapse();
    }
  }
  _inlineCollapsed = false;

  @HostBinding('class.sim-menu-vertical')
  get setMenuVerticalClass(): boolean {
    return (this.mode === 'vertical');
  }

  @HostBinding('class.sim-menu-horizontal')
  get setMenuHorizontalClass(): boolean {
    return (this.mode === 'horizontal');
  }

  @HostBinding('class.sim-menu-inline')
  get setMenuInlineClass(): boolean {
    return (this.mode === 'inline');
  }

  @HostBinding('class.sim-menu-inline-collapsed')
  get setMenuInlineCollapsedClass(): boolean {
    return (this.mode !== 'horizontal') && this.inlineCollapsed;
  }
  constructor() { }

  ngOnInit() {
  }

  ngAfterContentInit(): void {
    this.isInit = true;
    this.cacheMode = this.mode;
    this.updateInlineCollapse();
  }

  private updateInlineCollapse(): void {
    if (this._inlineCollapsed) {
      this.hideSubMenus();
      this.mode = 'vertical';
    } else {
      this.reductionSubMenus();
      this.mode = this.cacheMode;
    }
  }

  hideSubMenus(): void {
    this.subMenusOpenIndex = [];
    this.subMenus.forEach((submenu, index) => {
      if (submenu.open) {
        this.subMenusOpenIndex.push(index);
      }
      submenu.open = false;
    });
  }

  reductionSubMenus(): void {
    this.subMenusOpenIndex.forEach(i => this.subMenus[i].open = true);
    this.subMenusOpenIndex = [];
  }

}

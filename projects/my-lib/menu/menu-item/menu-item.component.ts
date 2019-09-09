import { Component, OnInit, HostBinding, ViewEncapsulation, ElementRef, Renderer2, ChangeDetectorRef, Optional } from '@angular/core';
import { MenuComponent } from '../menu.component';
import { SubMenuComponent } from '../sub-menu/sub-menu.component';

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[sim-menu-item]',
  templateUrl: './menu-item.component.html',
  encapsulation: ViewEncapsulation.None
})
export class MenuItemComponent implements OnInit {
  // 左边缩进
  padding: number;
  @HostBinding('class.sim-menu-item') true;

  @HostBinding('attr.role')
  get attrRole() {
    return 'menuitem';
  }

  @HostBinding('style.padding-left.px')
  get setPaddingLeft(): number {
    if (this.menuComponent.mode === 'inline') {
      if (this.subMenuComponent) {
        return (this.subMenuComponent.level + 1) * this.menuComponent.inlineIndent;
      } else {
        return this.menuComponent.inlineIndent;
      }
    } else {
      return this.padding;
    }
  }

  constructor(
    private renderer: Renderer2,
    public cdr: ChangeDetectorRef,
    public menuComponent: MenuComponent,
    @Optional() public subMenuComponent: SubMenuComponent,
    private hostElement: ElementRef) {
  }

  ngOnInit(): void {
    this.menuComponent.menuItems.push(this);
    const nativeElement = this.hostElement.nativeElement;
    /** store origin padding in padding */
    if (nativeElement.style['padding-left']) {
      this.padding = parseInt(nativeElement.style['padding-left'], 10);
    }
  }

}

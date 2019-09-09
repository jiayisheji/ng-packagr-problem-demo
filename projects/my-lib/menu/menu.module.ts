import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu.component';
import { SubMenuComponent } from './sub-menu/sub-menu.component';
import { MenuItemComponent } from './menu-item/menu-item.component';
import { MenuGroupComponent } from './menu-group/menu-group.component';
import { MenuTitleComponent } from './menu-title/menu-title.component';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule
  ],
  declarations: [MenuComponent, SubMenuComponent, MenuItemComponent, MenuGroupComponent, MenuTitleComponent],
  exports: [MenuComponent, SubMenuComponent, MenuItemComponent, MenuGroupComponent, MenuTitleComponent]
})
export class MenuModule { }

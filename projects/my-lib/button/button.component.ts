import { FocusMonitor } from '@angular/cdk/a11y';
import { Platform } from '@angular/cdk/platform';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  HostBinding,
  Input,
} from '@angular/core';
import {
  mixinColor,
  mixinSize,
  CanColor,
  ThemeSize,
  ThemePalette,
  Constructor,
  HasElementRef,
  CanSize,
  toBoolean
} from 'simple-ui/core';


export interface CanBordered {
  /** 按钮轮廓。 */
  bordered: ButtonBordered;
}

/**
 *  按钮轮廓
 *    default 默认无边框按钮
 *    flat 无背景无边框
 *    outline 实线轮廓的按钮背景白色
 *    dashed  虚线轮廓的按钮背景白色
 */
export type ButtonBordered = 'outline' | 'dashed' | 'flat' | undefined;

/** Mixin 使用边框属性来增加指令。*/
function mixinBordered<T extends Constructor<HasElementRef>>(base: T,
  defaultBordered?: ButtonBordered): Constructor<CanBordered> & T {
  return class extends base {
    private _bordered: ButtonBordered;

    get bordered(): ButtonBordered { return this._bordered; }
    set bordered(value: ButtonBordered) {
      const bordered = value || defaultBordered;
      if (bordered !== this._bordered) {
        if (this._bordered) {
          this._elementRef.nativeElement.classList.remove(`sim-button-${this._bordered}`);
        }
        if (bordered) {
          this._elementRef.nativeElement.classList.add(`sim-button-${bordered}`);
        }
        this._bordered = bordered;
      }
    }

    constructor(...args: any[]) {
      super(...args);

      // 设置可从 mixin 指定的默认尺寸。
      this.bordered = defaultBordered;
    }
  };
}

/**
 *  按钮形状
 *    default 长方形按钮
 *    circle  圆形按钮   一个按钮可以是圆形的
 *    square  正方形按钮 一个按钮可以是正方形的
 *    block   流体按钮  一个按钮可以占用其容器的宽度
 *    pill    胶囊按钮 一个按钮可以是胶囊形的
 */
export type ButtonShape = 'circle' | 'square' | 'block' | 'pill' | undefined;

export interface CanShape {
  /** 按钮的形状。 */
  shape: ButtonShape;
}

/** Mixin 使用边框属性来增加指令。*/
function mixinShape<T extends Constructor<HasElementRef>>(base: T,
  defaultShape?: ButtonShape): Constructor<CanShape> & T {
  return class extends base {
    private _shape: ButtonShape;

    get shape(): ButtonShape { return this._shape; }
    set shape(value: ButtonShape) {
      const shape = value || defaultShape;
      if (shape !== this._shape) {
        if (this._shape) {
          this._elementRef.nativeElement.classList.remove(`sim-button-${this._shape}`);
        }
        if (shape) {
          this._elementRef.nativeElement.classList.add(`sim-button-${shape}`);
        }
        this._shape = shape;
      }
    }

    constructor(...args: any[]) {
      super(...args);

      // 设置可从 mixin 指定的默认尺寸。
      this.shape = defaultShape;
    }
  };
}

export class SimButtonBase {
  constructor(public _elementRef: ElementRef) { }
}
export const _SimButtonMixinBase = mixinShape(mixinBordered(mixinColor(mixinSize(SimButtonBase, 'md'))));


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'button[sim-button], a[sim-button]',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent extends _SimButtonMixinBase
  implements CanColor, CanSize {
  @HostBinding('class.sim-button') true;

  private _loading: boolean;

  @Input() size: ThemeSize;

  @Input() color: ThemePalette;

  @Input() bordered: ButtonBordered;

  @Input() shape: ButtonShape;

  @Input()
  @HostBinding('class.sim-button-loading')
  get loading(): boolean { return this._loading; }
  set loading(value: boolean) {
    this._loading = toBoolean(value);
  }

  constructor(_elementRef: ElementRef) {
    super(_elementRef);
  }

}

import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  HostBinding,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import { toBoolean } from 'simple-ui/core';

/**
 *
 * Example:
 * ```html
 * <sim-divider></sim-divider>
 * <sim-divider [interval]="true"></sim-divider>
 * <sim-divider [interval]="'10px'"></sim-divider>
 * <sim-divider [interval]="'10px 20px'"></sim-divider>
 * <sim-divider [interval]="'10px 20px 30px'"></sim-divider>
 * <sim-divider dashed="true"></sim-divider>
 * <div>
 *    <a href="">登录</a>
 *    <sim-divider [vertical]="true"></sim-divider>
 *    <a href="">注册</a>
 *  </div>
 *  <sim-divider>我是分割线</sim-divider>
 *  <sim-divider align="start">我是分割线</sim-divider>
 *  <sim-divider align="end"><i class="icon-plus"></i> Add</sim-divider>
 * ```
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-divider',
  template: '<span class="sim-divider-inner-text" *ngIf="hasText && !vertical"><ng-content></ng-content></span>',
  styleUrls: ['./divider.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerComponent implements AfterViewInit {
  @HostBinding('class.sim-divider') true;

  hasText = true;
  /** 是否垂直显示 */
  @Input()
  @HostBinding('class.sim-divider-vertical')
  get vertical(): boolean { return this._vertical; }
  set vertical(value: boolean) { this._vertical = toBoolean(value); }
  private _vertical = false;

  /** 是否虚线 */
  @Input()
  @HostBinding('class.sim-divider-dashed')
  get dashed(): boolean { return this._dashed; }
  set dashed(value: boolean) { this._dashed = toBoolean(value); }
  private _dashed = false;


  /** 是否有间隔 或者参照css margin*/
  @Input()
  @HostBinding('class.sim-divider-interval')
  get interval(): boolean { return this._interval; }
  set interval(value: boolean) { this._interval = toBoolean(value); }
  private _interval = false;

  @HostBinding('style.margin')
  get setIntervalStyle() {
    return this._interval;
  }

  constructor(private elementRef: ElementRef, private changeDetector: ChangeDetectorRef) { }

  ngAfterViewInit() {
    const element: HTMLElement = this.elementRef.nativeElement;
    const innerText = element.querySelector('.sim-divider-inner-text');
    if (innerText && innerText.childNodes.length) {
      element.classList.add('sim-divider-text');
    } else {
      Promise.resolve().then(() => {
        this.hasText = false;
        this.changeDetector.markForCheck();
      });
    }
  }

}

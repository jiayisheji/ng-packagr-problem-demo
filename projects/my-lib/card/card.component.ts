import { Component, OnInit, HostBinding, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';
import { toBoolean } from 'simple-ui/core';

/**
 *
 * Example:
 * ```html
 * <sim-card>
 *    <sim-card-header></sim-card-header>
 *    <sim-card-content></sim-card-content>
 *    <sim-card-actions></sim-card-actions>
 * </sim-card>
 * ```
 * ```html
 * <sim-card>
 *    <sim-card-header>
 *      <sim-avatar text="jiayi"></sim-avatar>
 *      <sim-card-title>我是标题</sim-card-title>
 *      <sim-card-subtitle>我是子标题</sim-card-subtitle>
 *      <div sim-card-extra><a>我是更多</a></div>
 *    </sim-card-header>
 *    <sim-card-content></sim-card-content>
 *    <sim-card-actions></sim-card-actions>
 * </sim-card>
 * ```
 * ```html
 * <sim-card>
 *    <sim-card-header>
 *      <sim-card-title>我是标题</sim-card-title>
 *      <sim-card-subtitle>我是子标题</sim-card-subtitle>
 *    </sim-card-header>
 *    <sim-card-content [loading]="loading"></sim-card-content>
 *    <sim-card-actions></sim-card-actions>
 * </sim-card>
 * ```
 * ```html
 * <sim-card>
 *    <sim-card-header>
 *      <sim-card-title>我是标题</sim-card-title>
 *      <sim-card-subtitle>我是子标题</sim-card-subtitle>
 *    </sim-card-header>
 *    <sim-card-content [loading]="loading"></sim-card-content>
 *    <sim-card-actions>
 *      <button sim-button>确定</button>
 *      <button sim-button>取消</button>
 *    </sim-card-actions>
 * </sim-card>
 * ```
 * ```html
 * <sim-card>
 *    <sim-card-header>
 *      <sim-card-title>我是标题</sim-card-title>
 *      <sim-card-subtitle>我是子标题</sim-card-subtitle>
 *    </sim-card-header>
 *    <sim-card-content [loading]="loading"></sim-card-content>
 *    <sim-card-actions align="end">
 *      <button sim-button>确定</button>
 *      <button sim-button>取消</button>
 *    </sim-card-actions>
 * </sim-card>
 * ```
 * ```html
 * <sim-card>
 *    <sim-card-header>
 *      <sim-card-title>我是标题</sim-card-title>
 *      <sim-card-subtitle>我是子标题</sim-card-subtitle>
 *    </sim-card-header>
 *    <sim-card-content [loading]="loading"></sim-card-content>
 *    <sim-card-footer>
 *      <button sim-button>确定</button>
 *      <button sim-button>取消</button>
 *    </sim-card-footer>
 * </sim-card>
 * ```
 */


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @HostBinding('class.sim-card') true;

  @Input()
  @HostBinding('class.sim-card-hover')
  get hover(): boolean {
    return this._hover;
  }
  set hover(value: boolean) {
    this._hover = toBoolean(value);
  }
  private _hover = true;

}

import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  HostBinding,
  HostListener,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ContentChild,
  AfterContentInit,
  ComponentRef
} from '@angular/core';
import { toBoolean, toNumber } from 'simple-ui/core';
import { simAlertAnimations } from './alert-animations';
import { AlertTipsDirective, AlertNotesDirective } from './alert.directive';
import { AlertType } from './alert';

/**
 * Example:
 * ```html
 * // 基本用法
 * <sim-alert>Info Text</sim-alert>
 * ```
 * ```html
 * // 显示取消按钮 自定义取消按钮文本
 * <sim-alert [dismissible]="true" [dismissLabel]="'Close Now'">Info Text</sim-alert>
 * ```
 * ```html
 * // 四种tips状态 成功 信息  警告 危险/错误
 * <sim-alert type="success">
 *   <sim-alert-tips-icon></sim-alert-tips-icon>
 *   Success Tips
 * </sim-alert>
 * <sim-alert type="info">
 *   <sim-alert-tips-icon></sim-alert-tips-icon>
 *   Informational Notes
 * </sim-alert>
 * <sim-alert type="warning">
 *   <sim-alert-tips-icon></sim-alert-tips-icon>
 *   Warning
 * </sim-alert>
 * <sim-alert type="danger">
 *   <sim-alert-tips-icon></sim-alert-tips-icon>
 *   Error
 * </sim-alert>
 * ```
 * ```html
 * // 四种notes状态 成功 信息  警告 危险/错误
 * <sim-alert type="success">
 *   <sim-alert-notes-icon></sim-alert-notes-icon>
 *   <h4>Success Tips</h4>
     <p>Detailed description and advices about successful copywriting.</p>
 * </sim-alert>
 * <sim-alert type="info">
 *   <sim-alert-notes-icon></sim-alert-notes-icon>
 *   <h4>Informational Notes</h4>
     <p>Additional description and informations about copywriting.</p>
 * </sim-alert>
 * <sim-alert type="warning">
 *   <sim-alert-notes-icon></sim-alert-notes-icon>
 *   <h4>Warning</h4>
     <p>This is a warning notice about copywriting.</p>
 * </sim-alert>
 * <sim-alert type="danger">
 *   <sim-alert-notes-icon></sim-alert-notes-icon>
 *   <h4>Error</h4>
     <p>This is an error message about copywriting.</p>
 * </sim-alert>
 * ```
 * ```html
 * // 可取消 延迟3000毫秒自动关闭
 * <sim-alert *ngIf="alert" [dismissible]="true" (closeChange)="closeChange($event)" dismissOnTimeout="3000">
 *   <sim-alert-notes-icon></sim-alert-notes-icon>
 *   <h4>我是标题</h4>
 *   <p>我i是内容</p>
 * </sim-alert>
 * ```
 * ```ts
 * alert: boolean = true;
 * closeChange(event) {
 *   this.alert = false;
 * }
 * ```
  * ```html
 * // 自定义icon
 * <sim-alert>
 *   <i class="icon-question" sim-alert-notes-icon [custom]="true"></i>
 *   <h4>我是标题</h4>
 *   <p>我i是内容</p>
 * </sim-alert>
 * ```
 *
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [simAlertAnimations.fadeAlert],
})
export class AlertComponent implements OnInit, AfterContentInit {
  @HostBinding('class.sim-alert') true;

  @ContentChild(AlertTipsDirective, { static: false }) _tipsChild: AlertTipsDirective;
  @ContentChild(AlertNotesDirective, { static: false }) _notesChild: AlertNotesDirective;


  /** alert 类型 成功 信息 警告 错误/失败 */
  @Input() type: AlertType = 'info';

  /** 如果设置,显示“关闭”按钮 */
  @Input()
  @HostBinding('class.sim-alert-dismissible')
  get dismissible(): boolean {
    return this._dismissible;
  }
  set dismissible(value: boolean) {
    this._dismissible = toBoolean(value);
  }
  private _dismissible = false;

  /** 在毫秒数,之后警报将被关闭 */
  @Input() dismissOnTimeout: number | string;

  /** 设置取消按钮显示文字 */
  @Input() dismissLabel: string;

  /** 关闭事件 */
  @Output() closeChange: EventEmitter<AlertComponent> = new EventEmitter();


  @HostBinding('@fadeAlert')
  get alertAnimation() {
    return true;
  }

  @HostListener('@fadeAlert.done', ['$event'])
  _onAnimationDone(event: AnimationEvent) {
    console.log('@fadeAlert.done');
  }

  @HostBinding('class.sim-alert-success')
  get setAlertSuccessClass() {
    return this.type === 'success';
  }

  @HostBinding('class.sim-alert-info')
  get setAlertInfoClass() {
    return this.type === 'info';
  }

  @HostBinding('class.sim-alert-warning')
  get setAlertWarningClass() {
    return this.type === 'warning';
  }

  @HostBinding('class.sim-alert-danger')
  get setAlertDangerClass() {
    return this.type === 'danger' || this.type === 'error';
  }

  constructor(
    private elementRef: ElementRef
  ) {
  }

  ngOnInit() {
    const dismissOnTimeout = toNumber(this.dismissOnTimeout, 0);

    if (dismissOnTimeout) {
      const timer = setTimeout(
        () => {
          this.closeAlert(null);
          clearTimeout(timer);
        },
        dismissOnTimeout
      );
    }
  }

  ngAfterContentInit() {
    const element: HTMLElement = this.elementRef.nativeElement;
    if (this._notesChild) {
      element.classList.add('sim-alert-notes');
      this._notesChild.type = this.type;
    }
    if (this._tipsChild) {
      element.classList.add('sim-alert-tips');
      this._tipsChild.type = this.type;
    }
  }

  closeAlert(event: Event): void {
    this.closeChange.next(this);
    if (event) {
      event.stopPropagation();
    }
  }

}

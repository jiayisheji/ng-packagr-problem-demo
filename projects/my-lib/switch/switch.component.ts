import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  HostBinding,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ChangeDetectorRef, Attribute, NgZone, TemplateRef, forwardRef, ViewChild, OnDestroy, AfterContentInit
} from '@angular/core';
import { toBoolean } from 'simple-ui/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { mixinTabIndex, HasTabIndex, mixinDisabled } from 'simple-ui/core';

// 增加整数滑动切换组件的唯一ID。
let nextUniqueId = 0;

/** 更改SimSwitch发出的事件对象 */
export class SimSwitchChange {
  constructor(
    /** 事件的源 */
    public source: SwitchComponent,
    /** 新`checked`值 */
    public checked: boolean) { }
}

export class SwitchComponentBase {
  constructor(public _elementRef: ElementRef) { }
}

export const _MatSlideToggleMixinBase = mixinTabIndex(mixinDisabled(SwitchComponentBase));
/**
 *
 * Example:
 * ```html
 * <sim-switch [checked]="true"></sim-switch>
 * ```
 * ```html
 * <sim-switch [checked]="true">Switch after</sim-switch>
 * <sim-switch [checked]="true" labelPosition="before">Switch before</sim-switch>
 * ```
 * ```html
 * <sim-switch [checked]="checked" [control]="true" [loading]="loading" (change)="checkedChange($event)">Switch</sim-switch>
 * ```
 * ```ts
 * checked: boolean;
 * loading: boolean;
 * checkedChange($event: SimSwitchChange) {
 *  this.loading = true;
 *  setTimeout(() => {
 *    this.loading = false;
 *    this.checked = $event.checked;
 *  }, 2000);
 * }
 * ```
 * ```html
 * <sim-switch [ngModel]="true" checkedChildren="开" uncheckedChildren="关"></sim-switch>
 * ```
 * ```html
 * <sim-switch [ngModel]="true" [checkedChildren]="checkedTemplate" [uncheckedChildren]="unCheckedTemplate"></sim-switch>
 * <ng-template #checkedTemplate><i type="check"></i></ng-template>
 * <ng-template #unCheckedTemplate><i type="close"></i></ng-template>
 * ```
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true
    }
  ]
})
export class SwitchComponent extends _MatSlideToggleMixinBase implements OnInit,
  ControlValueAccessor, OnDestroy, AfterContentInit, HasTabIndex {
  isCheckedChildrenString: boolean;
  isUnCheckedChildrenString: boolean;
  @HostBinding('class.sim-switch') true;

  /** Name value will be applied to the input element if present. */
  @Input() name: string | null = null;

  /**  唯一id， 如果没有提供，它将自动生成。 */
  @Input() id: string = `sim-switch-${++nextUniqueId}`;

  /** 标签是否应出现在滑动切换之后或之前。 默认为之后。 */
  @Input() labelPosition: 'before' | 'after' = 'after';

  @HostBinding('class.sim-switch-label-before')
  get labelBefore() {
    return this.labelPosition === 'before';
  }

  /** 滑动切换是否必填 */
  @Input()
  @HostBinding('class.sim-switch-required')
  get required(): boolean { return this._required; }
  set required(value) { this._required = toBoolean(value); }
  private _required: boolean = false;

  /** 使用者控制滑动切换checked */
  @Input()
  get control(): boolean { return this._control; }
  set control(value) { this._control = toBoolean(value); }
  private _control: boolean = false;

  /** 滑动切换是否加载中 */
  @Input()
  @HostBinding('class.sim-switch-loading')
  get loading(): boolean { return this._loading; }
  set loading(value) { this._loading = toBoolean(value); }
  private _loading: boolean = false;

  /** 滑动切换是否选中 */
  @Input()
  @HostBinding('class.sim-switch-checked')
  get checked(): boolean { return this._checked; }
  set checked(value) {
    this._checked = toBoolean(value);
    this._changeDetectorRef.markForCheck();
  }
  private _checked: boolean = true;

  /** 滑动切换是否禁用 */
  @HostBinding('class.sim-switch-disabled')
  get setDisabledClass() {
    return this.disabled;
  }
  /** 自定义选中显示状态 */
  @Input()
  get checkedChildren(): string | TemplateRef<void> { return this._checkedChildren; }
  set checkedChildren(value: string | TemplateRef<void>) {
    this.isCheckedChildrenString = !(value instanceof TemplateRef);
    this._checkedChildren = value;
  }
  private _checkedChildren: string | TemplateRef<void>;
  /** 自定义未选中显示状态 */
  @Input()
  get uncheckedChildren(): string | TemplateRef<void> { return this._uncheckedChildren; }
  set uncheckedChildren(value: string | TemplateRef<void>) {
    this.isUnCheckedChildrenString = !(value instanceof TemplateRef);
    this._uncheckedChildren = value;
  }
  private _uncheckedChildren: string | TemplateRef<void>;

  /** 每次滑动切换更改其值时，都将调用一个事件。 */
  @Output() readonly change: EventEmitter<SimSwitchChange> = new EventEmitter<SimSwitchChange>();
  /** 引用底层input元素 */
  @ViewChild('input', { static: false }) _inputElement: ElementRef<HTMLInputElement>;

  private onChange = (_: boolean) => { };
  private onTouched = () => { };

  constructor(
    elementRef: ElementRef,
    private _focusMonitor: FocusMonitor,
    private _changeDetectorRef: ChangeDetectorRef,
    @Attribute('tabindex') tabIndex: string,
    private _ngZone: NgZone,
  ) {
    super(elementRef);
    this.tabIndex = parseInt(tabIndex, 10) || 0;
  }

  ngOnInit() {
  }

  ngAfterContentInit() {
    this._focusMonitor
      .monitor(this._elementRef, true)
      .subscribe(focusOrigin => {
        if (!focusOrigin) {
          // 当焦点元素被禁用时，浏览器*立即*触发模糊事件。
          // Angular不期望在更改检测期间引发事件，因此任何状态更改（例如表单控件的'ng-touching'）都将导致更改后检查错误
          // 请参阅https://github.com/angular/angular/issues/17793。 为了解决这个问题，我们推迟告知表单控件，直到下一个更新。
          Promise.resolve().then(() => this.onTouched());
        }
      });
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  /** 作为ControlValueAccessor的一部分实现 */
  writeValue(value: boolean): void {
    // 如果输入一样就直接返回
    if (this.checked === value) {
      return;
    }
    this.checked = value;
  }

  /** 作为ControlValueAccessor的一部分实现 */
  registerOnChange(fn: (_: boolean) => void): void {
    this.onChange = fn;
  }

  /** 作为ControlValueAccessor的一部分实现 */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** 作为ControlValueAccessor的一部分实现 */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this._changeDetectorRef.markForCheck();
  }

  /** 重点关注滑动切换 */
  focus(): void {
    this._focusMonitor.focusVia(this._inputElement, 'keyboard');
  }

  /** 切换滑动切换的已检查状态 */
  toggle(): void {
    this.checked = !this.checked;
    this.onChange(this.checked);
  }

  /** 每当底层输入发出更改事件时调用方法 */
  _onChangeEvent(event: Event) {
    // 我们总是必须停止在change事件上传播。
    // 否则，来自input元素的change事件将冒泡并将其事件对象发送到组件的`change`输出。
    event.stopPropagation();
    if (this.disabled || this.loading) {
      return;
    }
    if (this.control) {
      this.change.emit(new SimSwitchChange(this, !this.checked));
      return;
    }
    // 将基础输入元素的值与组件实例同步
    this.checked = this._inputElement.nativeElement.checked;

    // 仅当基础输入发出一个时才发出我们的自定义更改事件。 当已检查状态以编程方式更改时，这可确保没有更改事件。
    this._emitChangeEvent();
  }

  /** 单击滑动切换时调用的方法。 */
  _onInputClick(event: Event) {
    /**
     * 必须停止视觉隐藏输入元素上的点击事件的传播。
     * 默认情况下，当用户单击标签元素时，将在关联的输入元素上调度生成的单击事件。
     * 由于我们使用label元素作为根容器，因此`sim-switch`上的click事件将被执行两次。
     * 真正的点击事件将冒泡，生成的点击事件也会尝试冒泡。
     * 这将导致多次点击事件。
     * 防止第二次事件的冒泡将解决该问题。
     */
    event.stopPropagation();
  }

  private _emitChangeEvent() {
    this.onChange(this.checked);
    this.change.emit(new SimSwitchChange(this, this.checked));
  }

  _onLabelTextChange() {
    // 每当sim-switch的标签发生变化时，就会调用这个方法。
    // 由于sim-switch使用了OnPush策略，我们需要通知它cdkObserveContent指令已经识别的更改。
    this._changeDetectorRef.markForCheck();
  }

}

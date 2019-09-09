import {
  Component,
  Directive,
  forwardRef,
  QueryList,
  OnInit,
  HostBinding,
  HostListener,
  AfterViewInit,
  AfterContentInit,
  OnChanges,
  Self,
  DoCheck,
  OnDestroy,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  Optional,
  ChangeDetectorRef,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ContentChildren
} from '@angular/core';
import { ControlValueAccessor, NgForm, FormGroupDirective, NgControl } from '@angular/forms';
import { Platform } from '@angular/cdk/platform';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { AutofillMonitor, AutofillEvent } from '@angular/cdk/text-field';
import { Subject } from 'rxjs';
import {
  mixinTabIndex,
  HasTabIndex,
  mixinErrorState,
  ErrorStateMatcher,
  CanUpdateErrorState,
  mixinDisabled,
  CanDisable
} from 'simple-ui/core';
import { toBoolean } from 'simple-ui/core';
import { SimFormFieldControl } from 'simple-ui/form-field';


export class SimRadioChange {
  constructor(
    /** 发出更改事件的sim-radio。 */
    public source: RadioComponent,
    /** sim-radio的值。 */
    public value: any) { }
}

export class SimRadioGroupBase {
  constructor(
    public _elementRef: ElementRef,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    public _parentForm: NgForm,
    public _parentFormGroup: FormGroupDirective,
    public ngControl: NgControl) { }
}
export const _SimRadioGroupMixinBase = mixinErrorState(mixinDisabled(SimRadioGroupBase));

let nextGroupUniqueId = 0;

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-radio-group',
  exportAs: 'simRadioGroup',
  providers: [
    { provide: SimFormFieldControl, useExisting: RadioGroupDirective }
  ],
})
export class RadioGroupDirective extends _SimRadioGroupMixinBase implements SimFormFieldControl<any>,
  OnChanges, OnDestroy, OnInit, DoCheck, CanUpdateErrorState, AfterContentInit, ControlValueAccessor, CanDisable {
  @HostBinding('class.sim-radio-group') true;

  /** 获取单选按钮 */
  // tslint:disable-next-line:no-use-before-declare
  @ContentChildren(forwardRef(() => RadioComponent), { descendants: true }) _radios: QueryList<RadioComponent>;
  /**
   * 为组选择的值。应等于所选单选按钮的值，如果有*有*对应的单选按钮与匹配的值。
   * 如果没有对应的单选按钮，则在添加具有匹配值的新单选按钮时，将一直应用该值。
   */
  private _value: any = null;

  protected _previousNativeValue: any;

  /** 应用于此组中的单选按钮的HTML name属性。 */
  private _name = `sim-radio-group-${nextGroupUniqueId++}`;

  /** 当前选择的单选按钮。应该匹配值 */
  private _selected: RadioComponent | null = null;

  /** 是否将“值”设置为其初始值 */
  private _isInitialized = false;

  /** Whether the labels should appear after or before the radio-buttons. Defaults to 'after' */
  private _labelPosition: 'before' | 'after' = 'after';

  /** 是否禁用广播组 */
  private _disabled = false;

  /** Whether the radio group is required. */
  private _required = false;

  @Input() errorStateMatcher: ErrorStateMatcher;

  @Input() placeholder: string;
  /** 单选按钮组的名称。这个组中的所有单选按钮都将使用这个名称。 */
  @Input()
  get name(): string { return this._name; }
  set name(value: string) {
    this._name = value;
    this._updateRadioButtonNames();
  }

  /** Whether the labels should appear after or before the radio-buttons. Defaults to 'after' */
  @Input()
  get labelPosition(): 'before' | 'after' {
    return this._labelPosition;
  }
  set labelPosition(v) {
    this._labelPosition = v === 'before' ? 'before' : 'after';
    this._markRadiosForCheck();
  }

  /** 单选的值 */
  @Input()
  get value(): any { return this._value; }
  set value(newValue: any) {
    if (this._value !== newValue) {
      this._value = newValue;
      this._updateSelectedRadioFromValue();
      this._checkSelectedRadioButton();
    }
  }

  /** radio or button 2种显示效果 默认radio */
  @Input()
  get button(): boolean {
    return this._button;
  }
  set button(value: boolean) {
    this._button = toBoolean(value);
  }
  private _button = false;

  @Input()
  @HostBinding('attr.id')
  get id(): string { return this._id; }
  set id(value: string) { this._id = value || this._name; }
  protected _id: string;

  /** Whether the radio button is selected. */
  @Input()
  get selected() { return this._selected; }
  set selected(selected: RadioComponent | null) {
    this._selected = selected;
    this.value = selected ? selected.value : null;
    this._checkSelectedRadioButton();
  }

  /** Whether the radio group is disabled */
  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value) {
    this._disabled = toBoolean(value);
    this._markRadiosForCheck();
  }

  /** Whether the radio group is required */
  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) {
    this._required = toBoolean(value);
    this._markRadiosForCheck();
  }

  /**
   * Event emitted when the group value changes.
   * Change events are only emitted when the value changes due to user interaction with
   * a radio button (the same behavior as `<input type-"radio">`).
   */
  @Output() readonly change: EventEmitter<SimRadioChange> = new EventEmitter<SimRadioChange>();

  readonly stateChanges: Subject<void> = new Subject<void>();
  focused = false;
  controlType = 'sim-radio';
  autofilled = false;
  /** The method to be called in order to update ngModel */
  onChange: (value: any) => void = () => { };

  /**
   * onTouch function registered via registerOnTouch (ControlValueAccessor).
   */
  onTouched: () => any = () => { };

  constructor(
    _elementRef: ElementRef,
    protected _platform: Platform,
    @Optional() @Self() public ngControl: NgControl,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    _defaultErrorStateMatcher: ErrorStateMatcher,
    private _autofillMonitor: AutofillMonitor,
    private _changeDetector: ChangeDetectorRef) {
    super(_elementRef, _defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);
    // 如果未显式指定输入值访问器, 请使用该元素作为输入值访问器。
    this._previousNativeValue = this.value;
    if (this.ngControl) {
      // Note: we provide the value accessor through here, instead of
      // the `providers` to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }
    this.id = this.id;
  }

  ngOnInit() {
    this._autofillMonitor.monitor(this._elementRef.nativeElement).subscribe((event: AutofillEvent) => {
      this.autofilled = event.isAutofilled;
      this.stateChanges.next();
    });
  }

  ngOnChanges() {
    this.stateChanges.next();
  }

  ngDoCheck() {
    if (this.ngControl) {
      // We need to re-evaluate this on every change detection cycle, because there are some
      // error triggers that we can't subscribe to (e.g. parent form submissions). This means
      // that whatever logic is in here has to be super lean or we risk destroying the performance.
      this.updateErrorState();
    }

    // We need to dirty-check the native element's value, because there are some cases where
    // we won't be notified when it changes (e.g. the consumer isn't using forms or they're
    // updating the value using `emitEvent: false`).
    this._dirtyCheckNativeValue();
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this._autofillMonitor.stopMonitoring(this._elementRef.nativeElement);
  }

  /**
   * Initialize properties once content children are available.
   * This allows us to propagate relevant attributes to associated buttons.
   */
  ngAfterContentInit() {
    // Mark this component as initialized in AfterContentInit because the initial value can
    // possibly be set by NgModel on MatRadioGroup, and it is possible that the OnInit of the
    // NgModel occurs *after* the OnInit of the MatRadioGroup.
    this._isInitialized = true;
  }

  _checkSelectedRadioButton() {
    if (this._selected && !this._selected.checked) {
      this._selected.checked = true;
    }
  }


  /**
   * Mark this group as being "touched" (for ngModel). Meant to be called by the contained
   * radio buttons upon their blur.
   */
  _touch() {
    if (this.onTouched) {
      this.onTouched();
    }
  }

  private _updateRadioButtonNames(): void {
    if (this._radios) {
      this._radios.forEach(radio => {
        radio.name = this.name;
      });
    }
  }

  /** Updates the `selected` radio button from the internal _value state. */
  private _updateSelectedRadioFromValue(): void {
    // If the value already matches the selected radio, do nothing.
    const isAlreadySelected = this._selected !== null && this._selected.value === this._value;

    if (this._radios && !isAlreadySelected) {
      this._selected = null;
      this._radios.forEach(radio => {
        radio.checked = this.value === radio.value;
        if (radio.checked) {
          this._selected = radio;
        }
      });
    }
  }

  /** Dispatch change event with current selection and group value. */
  _emitChangeEvent(): void {
    if (this._isInitialized) {
      this.change.emit(new SimRadioChange(this._selected, this._value));
    }
  }

  _markRadiosForCheck() {
    if (this._radios) {
      this._radios.forEach(radio => radio._markForCheck());
    }
  }

  /**
   * 设置模型值。
   * 作为ControlValueAccessor的一部分实现。
   */
  writeValue(value: any) {
    this.value = value;
    this._changeDetector.markForCheck();
  }

  /**
   * 注册将在模型值更改时触发的回调。
   * 作为ControlValueAccessor的一部分实现。
   * @param fn Callback to be registered.
   */
  registerOnChange(fn: (value: any) => void) {
    this.onChange = fn;
  }

  /**
   * 注册一个回调，当触摸控件时触发。
   * 作为ControlValueAccessor的一部分实现。
   * @param fn Callback to be registered.
   */
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  /**
   * 设置控件的禁用状态。
   * 作为ControlValueAccessor的一部分实现。
   * @param isDisabled 是否应该禁用该控件。
   */
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
    this._changeDetector.markForCheck();
  }

  /** 对本机输入值属性进行一些手动脏检查。*/
  protected _dirtyCheckNativeValue() {
    const newValue = this.value;

    if (this._previousNativeValue !== newValue) {
      this._previousNativeValue = newValue;
      this.stateChanges.next();
    }
  }

  protected _isBadInput() {
    // The `validity` property won't be present on platform-server.
    const validity = (this._elementRef.nativeElement as HTMLInputElement).validity;
    return validity && validity.badInput;
  }

  protected _isNeverEmpty() {
    return false;
  }

  get empty(): boolean {
    return !this._isNeverEmpty() && !this._elementRef.nativeElement.value && !this._isBadInput() && !this.autofilled;
  }

  focus(): void { this._elementRef.nativeElement.focus(); }

  onContainerClick() { this.focus(); }

  setDescribedByIds(ids: string[]) { }

}




export class SimRadioBase {
  // Since the disabled property is manually defined for the MatRadioButton and isn't set up in
  // the mixin base class. To be able to use the tabindex mixin, a disabled property must be
  // defined to properly work.
  disabled: boolean;

  constructor(public _elementRef: ElementRef) { }
}
// As per Material design specifications the selection control radio should use the accent color
// palette by default. https://material.io/guidelines/components/selection-controls.html
export const _SimRadioBaseMixinBase = mixinTabIndex(SimRadioBase);

/** 更改由sim-radio和sim-radio-group发出的事件对象。 */

let nextUniqueId = 0;

/**
 * Example:
 * sim-radio
 * ```html
 * // 基本用法
 * <sim-radio-group [(ngModel)]="productState">
 *   <sim-radio [value]="0">公开</sim-radio>
 *   <sim-radio [value]="2">隐藏</sim-radio>
 * </sim-radio-group>
 * ```
 * ```html
 * // 响应式表单用法
 * <sim-radio-group formControlName="productState">
 *   <sim-radio [value]="0">公开</sim-radio>
 *   <sim-radio [value]="2">隐藏</sim-radio>
 * </sim-radio-group>
 * ```
 * ```html
 * // 按钮用法
 * <sim-radio-group [(ngModel)]="productState" [button]="true">
 *   <sim-radio [value]="0">公开</sim-radio>
 *   <sim-radio [value]="2">隐藏</sim-radio>
 * </sim-radio-group>
 * ```
 * ```html
 * // 响应式表单按钮用法
 * <sim-radio-group formControlName="productState" [button]="true">
 *   <sim-radio [value]="0">公开</sim-radio>
 *   <sim-radio [value]="2">隐藏</sim-radio>
 * </sim-radio-group>
 * ```
 */

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'simRadio',
})
export class RadioComponent extends _SimRadioBaseMixinBase implements OnInit, AfterViewInit, OnDestroy, HasTabIndex {
  /** The native `<input type=radio>` element */
  @ViewChild('input', { static: false }) _inputElement: ElementRef;
  private _uniqueId = `sim-radio-${++nextUniqueId}`;
  /** The unique ID for the radio button. */
  @HostBinding('attr.id')
  @Input() id: string = this._uniqueId;

  @Input() name: string;

  @Input() data: any;

  @Input() tabIndex: number;

  /** Used to set the 'aria-label' attribute on the underlying input element. */
  @Input() ariaLabel: string;

  /** The 'aria-labelledby' attribute takes precedence as the element's text alternative. */
  @Input() ariaLabelledby: string;

  /** The 'aria-describedby' attribute is read after the element's label and field type. */
  @Input() ariaDescribedby: string;

  @Input()
  @HostBinding('class.sim-radio-checked')
  get checked(): boolean { return this._checked; }
  set checked(value: boolean) {
    const newCheckedState = toBoolean(value);
    if (this._checked !== newCheckedState) {
      this._checked = newCheckedState;
      if (newCheckedState && this.radioGroup && this.radioGroup.value !== this.value) {
        this.radioGroup.selected = this;
      } else if (!newCheckedState && this.radioGroup && this.radioGroup.value === this.value) {
        // 取消选中所选单选按钮时，更新组中所选的单选属性
        this.radioGroup.selected = null;
      }

      if (newCheckedState) {
        // 通知所有具有相同名称的单选按钮以取消选中。
        this._radioDispatcher.notify(this.id, this.name);
      }
      this._changeDetector.markForCheck();
    }
  }

  @Input()
  get value(): any { return this._value; }
  set value(value: any) {
    if (this._value !== value) {
      this._value = value;
      if (this.radioGroup !== null) {
        if (!this.checked) {
          // Update checked when the value changed to match the radio group's value
          this.checked = this.radioGroup.value === value;
        }
        if (this.checked) {
          this.radioGroup.selected = this;
        }
      }
    }
  }

  /** Whether the label should appear after or before the radio button. Defaults to 'after' */
  @Input()
  get labelPosition(): 'before' | 'after' {
    return this._labelPosition || (this.radioGroup && this.radioGroup.labelPosition) || 'after';
  }
  set labelPosition(value) {
    this._labelPosition = value;
  }
  private _labelPosition: 'before' | 'after';

  /** Whether the radio button is disabled. */
  @Input()
  @HostBinding('class.sim-radio-disabled')
  get disabled(): boolean {
    return this._disabled || (this.radioGroup !== null && this.radioGroup.disabled);
  }
  set disabled(value: boolean) {
    const newDisabledState = toBoolean(value);
    if (this._disabled !== newDisabledState) {
      this._disabled = newDisabledState;
      this._changeDetector.markForCheck();
    }
  }

  /** Whether the radio button is required. */
  @Input()
  get required(): boolean {
    return this._required || (this.radioGroup && this.radioGroup.required);
  }
  set required(value: boolean) {
    this._required = toBoolean(value);
  }
  /**
   * Event emitted when the checked state of this radio button changes.
   * Change events are only emitted when the value changes due to user interaction with
   * the radio button (the same behavior as `<input type-"radio">`).
   */
  @Output() readonly change: EventEmitter<SimRadioChange> = new EventEmitter<SimRadioChange>();

  /** The parent radio group. May or may not be present. */
  radioGroup: RadioGroupDirective;

  /** ID of the native input element inside `<mat-radio-button>` */
  get inputId(): string { return `${this.id || this._uniqueId}-input`; }

  /** Whether this radio is checked. */
  private _checked = false;

  /** Whether this radio is disabled. */
  private _disabled: boolean;

  /** Whether this radio is required. */
  private _required: boolean;

  /** Value assigned to this radio. */
  private _value: any = null;

  /** Unregister function for _radioDispatcher */
  private _removeUniqueSelectionListener: () => void = () => { };

  @HostBinding('class.sim-radio')
  get getRadioClass() {
    return !this.button;
  }

  @HostBinding('class.sim-radio-button')
  get getButtonClass() {
    return this.button;
  }

  /** 是否是按钮 */
  get button(): boolean {
    return this.radioGroup.button;
  }

  constructor(
    @Optional() radioGroup: RadioGroupDirective,
    elementRef: ElementRef,
    private _changeDetector: ChangeDetectorRef,
    private _focusMonitor: FocusMonitor,
    private _radioDispatcher: UniqueSelectionDispatcher) {
    super(elementRef);

    // Assertions. Ideally these should be stripped out by the compiler.
    // TODO(jelbourn): Assert that there's no name binding AND a parent radio group.
    this.radioGroup = radioGroup;

    this._removeUniqueSelectionListener = _radioDispatcher.listen((id: string, name: string) => {
      if (id !== this.id && name === this.name) {
        this.checked = false;
      }
    });
  }

  /** 专注于单选按钮。 */
  focus(): void {
    this._focusMonitor.focusVia(this._inputElement.nativeElement, 'keyboard');
  }

  /**
   * 将单选按钮标记为需要检查更改检测。 由于父j级将直接更新单选按钮的绑定属性，因此公开此方法。
   */
  _markForCheck() {
    // 当组值改变时，按钮将不会被通知。 使用`markForCheck`来显式更新单选按钮的状态
    this._changeDetector.markForCheck();
  }

  ngOnInit() {
    if (this.radioGroup) {
      // If the radio is inside a radio group, determine if it should be checked
      this.checked = this.radioGroup.value === this._value;
      // Copy name from parent radio group
      this.name = this.radioGroup.name;
    }
  }

  ngAfterViewInit() {
    this._focusMonitor
      .monitor(this._inputElement.nativeElement)
      .subscribe(focusOrigin => this._onInputFocusChange(focusOrigin));
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._inputElement.nativeElement);
    this._removeUniqueSelectionListener();
  }

  /** Dispatch change event with current value. */
  private _emitChangeEvent(): void {
    this.change.emit(new SimRadioChange(this, this._value));
  }


  _onInputClick(event: Event) {
    // We have to stop propagation for click events on the visual hidden input element.
    // By default, when a user clicks on a label element, a generated click event will be
    // dispatched on the associated input element. Since we are using a label element as our
    // root container, the click event on the `radio-button` will be executed twice.
    // The real click event will bubble up, and the generated click event also tries to bubble up.
    // This will lead to multiple click events.
    // Preventing bubbling for the second event will solve that issue.
    event.stopPropagation();
  }

  /**
   * 当单选按钮接收到单击或输入识别任何更改时触发。单击label元素，将触发关联输入上的更改事件。
   */
  _onInputChange(event: Event) {
    // 必须停止对变更事件的传播。否则，来自输入元素的更改事件将冒泡并将其事件对象发送到 @output change()。
    event.stopPropagation();

    this.checked = true;
    this._emitChangeEvent();
    if (this.radioGroup) {
      this.radioGroup.onChange(this.value);
      this.radioGroup._touch();
      this.radioGroup._emitChangeEvent();
    }
  }

  /** 当输入元素的焦点发生更改时，将调用该函数 */
  private _onInputFocusChange(focusOrigin: FocusOrigin) {

  }

  @HostListener('focus', [])
  _focus() {
    this._elementRef.nativeElement.focus();
  }
}

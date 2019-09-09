import {
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ContentChildren,
  QueryList,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
  AfterContentInit,
  ViewEncapsulation,
  HostBinding,
  OnInit,
  OnChanges,
  DoCheck,
  Self,
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NgForm, FormGroupDirective, NgControl } from '@angular/forms';
import { Platform } from '@angular/cdk/platform';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { Subject } from 'rxjs';

import { mixinErrorState, ErrorStateMatcher, CanUpdateErrorState,
  mixinDisabled,
  CanDisable,
  HasTabIndex,
  mixinTabIndex,
  isArray, toBoolean
} from 'simple-ui/core';
import { SimFormFieldControl } from 'simple-ui/form-field';

/** 由SimCheckboxGroup发出的更改事件对象。 */
export class SimCheckboxGroupChange {
  constructor(
    /** 发出更改事件的SimCheckbox集合。 */
    public source: CheckboxComponent[],
    /** SimCheckbox的值集合。 */
    public selected: any[]) {
  }
}

export class SimCheckboxGroupBase {
  constructor(
    public _elementRef: ElementRef,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    public _parentForm: NgForm,
    public _parentFormGroup: FormGroupDirective,
    public ngControl: NgControl) { }
}
export const _SimCheckboxGroupMixinBase = mixinErrorState(mixinDisabled(SimCheckboxGroupBase));

let nextGroupUniqueId = 0;


/**
 *
双向绑定
<sim-checkbox-group [(ngModel)]="checked" (ngModelChange)="checkboxChange($event)">
    <sim-checkbox [value]="1">1</sim-checkbox>
    <sim-checkbox [value]="2">2</sim-checkbox>
    <sim-checkbox [value]="3">3</sim-checkbox>
    <sim-checkbox [value]="4">4</sim-checkbox>
</sim-checkbox-group>

单向绑定
<sim-checkbox-group [value]="checked" (change)="checkboxChange($event)">
    <sim-checkbox [value]="1">1</sim-checkbox>
    <sim-checkbox [value]="2">2</sim-checkbox>
    <sim-checkbox [value]="3">3</sim-checkbox>
    <sim-checkbox [value]="4">4</sim-checkbox>
</sim-checkbox-group>
 */

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-checkbox-group',
  exportAs: 'simCheckboxGroup',
  providers: [
    { provide: SimFormFieldControl, useExisting: CheckboxGroupDirective }
  ],
})
export class CheckboxGroupDirective extends _SimCheckboxGroupMixinBase implements SimFormFieldControl<any>,
  OnChanges, OnDestroy, OnInit, DoCheck, CanUpdateErrorState, AfterContentInit, ControlValueAccessor, CanDisable {

  @HostBinding('class.sim-checkbox-group') true;

  /** Child checkbox. */
  // tslint:disable-next-line:no-use-before-declare
  @ContentChildren(forwardRef(() => CheckboxComponent)) _checkbox: QueryList<CheckboxComponent>;
  /**
   * Selected value for group. Should equal the value of the selected radio button if there *is*
   * a corresponding radio button with a matching value. If there is *not* such a corresponding
   * radio button, this value persists to be applied in case a new radio button is added with a
   * matching value.
   */
  private _value: any[] = [];

  protected _previousNativeValue: any;

  /** The HTML name attribute applied to radio buttons in this group. */
  private _name: string = `sim-checkbox-${nextGroupUniqueId++}`;

  /** 选择Checkbox集合 */
  private _selected: CheckboxComponent[] | null = [];

  /** Whether the `value` has been set to its initial value. */
  private _isInitialized: boolean = false;

  /** Whether the labels should appear after or before the radio-buttons. Defaults to 'after' */
  private _labelPosition: 'before' | 'after' = 'after';

  /** Whether the radio group is disabled. */
  private _disabled: boolean = false;

  /** Whether the radio group is required. */
  private _required: boolean = false;

  @Input() errorStateMatcher: ErrorStateMatcher;

  @Input() placeholder: string;
  /** Name of the radio button group. All radio buttons inside this group will use this name. */
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

  /** Value of the checkbox. */
  @Input()
  get value(): any[] { return this._value; }
  set value(newValue: any[]) {
    if (isArray(newValue)) {
      this._value = newValue;
      this._updateSelectedRadioFromValue();
      this._checkSelectedRadioButton();
    }
  }

  @Input()
  @HostBinding('attr.id')
  get id(): string { return this._id; }
  set id(value: string) { this._id = value || this._name; }
  protected _id: string;

  /** Whether the radio button is selected. */
  @Input()
  get selected() { return this._selected; }
  set selected(selected: any[] | null) {
    this._selected = selected;
    this._checkSelectedRadioButton();
  }

  /** Whether the radio group is disabled */
  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value) {
    this._disabled = coerceBooleanProperty(value);
    this._markRadiosForCheck();
  }

  /** Whether the radio group is required */
  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this._markRadiosForCheck();
  }

  /**
   * Event emitted when the group value changes.
   * Change events are only emitted when the value changes due to user interaction with
   * a radio button (the same behavior as `<input type-"radio">`).
   */
  @Output() readonly change: EventEmitter<SimCheckboxGroupChange> = new EventEmitter<SimCheckboxGroupChange>();


  readonly stateChanges: Subject<void> = new Subject<void>();
  focused = false;
  controlType = 'sim-checkbox';
  autofilled = false;
  /** The method to be called in order to update ngModel */
  onChange: (value: any) => void = () => { };

  /**
   * onTouch function registered via registerOnTouch (ControlValueAccessor).
   * @docs-private
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
    this._autofillMonitor.monitor(this._elementRef.nativeElement).subscribe(event => {
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
    this._updateSelectedRadioFromValue();
  }

  _checkSelectedRadioButton() {
    /* if (this._selected.length && this.value.length) {
      this._selected.forEach(_selected => {
        _selected.checked = this.value.indexOf(_selected.value) > -1;
      });
    } */
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
    if (this._checkbox) {
      this._checkbox.forEach(radio => {
        radio.name = this.name;
      });
    }
  }

  /** 从内部_value状态更新“selected”单选按钮。 */
  private _updateSelectedRadioFromValue(): void {
    if (this._checkbox && this._checkbox.length && this.value) {
      this._selected = [];
      this._checkbox.forEach(checkbox => {
        const checked = this.value.indexOf(checkbox.value) > -1;
        if (checked) {
          this._selected.push(checkbox);
        }
        checkbox.checked = checked;
      });
    }
  }

  /** Dispatch change event with current selection and group value. */
  _emitChangeEvent(): void {
    if (this._isInitialized) {
      const value = this.selected.map((checkbox: CheckboxComponent) => checkbox.value);
      this.change.next(new SimCheckboxGroupChange(this.selected, value));
    }
  }

  _markRadiosForCheck() {
    if (this._checkbox) {
      this._checkbox.forEach(checkbox => checkbox._markForCheck());
    }
  }

  /**
   * 设置模型值。
   * 作为ControlValueAccessor的一部分实现。
   */
  writeValue(value: any[]) {
    if (value != null) {
      this.value = value;
      this._changeDetector.markForCheck();
    }
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
    return !this._isNeverEmpty() && !this._elementRef.nativeElement.value && !this._isBadInput() &&
      !this.autofilled;
  }

  focus(): void { this._elementRef.nativeElement.focus(); }

  onContainerClick() { this.focus(); }

  setDescribedByIds(ids: string[]) { }
}

/**
 * 表示需要在它们之间进行自定义转换的不同状态。
 */
export enum TransitionCheckState {
  /** 组件在任何用户交互之前的初始状态。 */
  Init,
  /** 当组件选中时，表示该组件的状态。 */
  Checked,
  /** 当组件未选中时，表示该组件的状态。 */
  Unchecked,
  /** 当组件变得不确定时，表示该组件的状态。 */
  Indeterminate
}

/** 由SimCheckbox发出的更改事件对象。 */
export class SimCheckboxChange {
  constructor(
    /** 发出更改事件的SimCheckbox。 */
    public source: CheckboxComponent,
    /** 复选框的新“选中”值。 */
    public checked: boolean,
    /** SimCheckbox的值。 */
    public value: any) {

  }
}


// 用于为复选框组件生成惟一id的递增整数。
let nextUniqueId = 0;

// Boilerplate for applying mixins to SimCheckbox.
/** @docs-private */
export class SimCheckboxBase {
  constructor(public _elementRef: ElementRef) { }
}
export const _SimCheckboxMixinBase = mixinTabIndex(mixinDisabled(SimCheckboxBase));

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  exportAs: 'simCheckbox',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent extends _SimCheckboxMixinBase implements ControlValueAccessor, OnInit, OnDestroy, CanDisable, HasTabIndex {
  @HostBinding('class.sim-checkbox') true;

  @Input() tabIndex: number;

  /**
   * 附加到宿主元素的aria-label属性。在大多数情况下，arial-labelledby将优先，因此可以忽略它。
   */
  @Input() ariaLabel: string = '';

  /**
   * 用户可以指定“aria-labelledby”属性，该属性将被转发到输入元素
   */
  @Input() ariaLabelledby: string | null = null;

  private _uniqueId: string = `sim-checkbox-${++nextUniqueId}`;

  /** 复选框输入的唯一id。如果没有提供，将自动生成。 */
  @HostBinding('attr.id')
  @Input() id: string = this._uniqueId;

  /** 返回视觉隐藏输入的唯一id。 */
  get inputId(): string { return `${this.id || this._uniqueId}-input`; }

  /** 复选框是否必填 */
  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) { this._required = toBoolean(value); }
  private _required: boolean;

  /** 标签文本应该显示在复选框之后还是之前。默认为“之后” */
  @Input() labelPosition: 'before' | 'after' = 'after';

  /** 如果存在，将对input元素应用Name值 */
  @Input() name: string | null = null;

  /** 当复选框的“勾选”值更改时发出的事件。 */
  @Output() readonly change: EventEmitter<SimCheckboxChange> = new EventEmitter<SimCheckboxChange>();

  /** 当复选框的“不确定”值发生变化时发出的事件。 */
  @Output() readonly indeterminateChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /** 原生input元素的值属性 */
  @Input() value: string;


  /** 绑定data值，供checkboxGroup操作使用 */
  @Input() data: any;

  /** The native `<input type="checkbox">` element */
  @ViewChild('input', { static: false }) _inputElement: ElementRef;
  /** The parent radio group. May or may not be present. */
  checkboxGroup: CheckboxGroupDirective;
  /**
* Whether the checkbox is checked.
*/
  @Input()
  @HostBinding('class.sim-checkbox-checked')
  get checked(): boolean { return this._checked; }
  set checked(value: boolean) {
    const newCheckedState = toBoolean(value);
    if (this._checked !== newCheckedState) {
      this._checked = newCheckedState;
      if (this.checkboxGroup) {
        const selected = this.checkboxGroup.selected;
        if (newCheckedState) {
          const index = selected.indexOf(this);
          if (index === -1) {
            selected.push(this);
            this.checkboxGroup.selected = [...selected];
          }
        } else if (!newCheckedState) {
          // 取消选中所选单选按钮时，更新组中所选的单选属性
          const index = selected.indexOf(this);
          selected.splice(index, 1);
          this.checkboxGroup.selected = [...selected];
        }
      }
      this._changeDetectorRef.markForCheck();
    }
  }
  private _checked: boolean = false;

  /**
   * Whether the checkbox is disabled. This fully overrides the implementation provided by
   * mixinDisabled, but the mixin is still required because mixinTabIndex requires it.
   */
  @Input()
  @HostBinding('class.sim-checkbox-disabled')
  get disabled() { return this._disabled; }
  set disabled(value: any) {
    const newDisabledState = toBoolean(value);
    if (newDisabledState !== this._disabled) {
      this._disabled = value;
      this._changeDetectorRef.markForCheck();
    }
  }
  private _disabled: boolean = false;

  /**
   * Whether the checkbox is indeterminate. This is also known as "mixed" mode and can be used to
   * represent a checkbox with three states, e.g. a checkbox that represents a nested list of
   * checkable items. Note that whenever checkbox is manually clicked, indeterminate is immediately
   * set to false.
   */
  @Input()
  @HostBinding('class.sim-checkbox-indeterminate')
  get indeterminate(): boolean { return this._indeterminate; }
  set indeterminate(value: boolean) {
    if (this.disabled) {
      this._indeterminate = false;
      return ;
    }
    const changed = value !== this._indeterminate;
    this._indeterminate = value;

    if (changed) {
      if (this._indeterminate) {
        this._transitionCheckState(TransitionCheckState.Indeterminate);
      } else {
        this._transitionCheckState(
          this.checked ? TransitionCheckState.Checked : TransitionCheckState.Unchecked);
      }
      this.indeterminateChange.emit(this._indeterminate);
    }
  }
  private _indeterminate: boolean = false;

  private _currentAnimationClass: string = '';

  private _currentCheckState: TransitionCheckState = TransitionCheckState.Init;

  /**
   * Called when the checkbox is blurred. Needed to properly implement ControlValueAccessor.
   * @docs-private
   */
  _onTouched: () => any = () => { };

  private _controlValueAccessorChangeFn: (value: any) => void = () => { };

  constructor(
    @Inject(forwardRef(() => CheckboxGroupDirective))
    @Optional() checkboxGroup: CheckboxGroupDirective,
    elementRef: ElementRef,
    private _changeDetectorRef: ChangeDetectorRef,
    private _focusMonitor: FocusMonitor,
    @Attribute('tabindex') tabIndex: string,
  ) {
    super(elementRef);
    this.checkboxGroup = checkboxGroup;
    this.tabIndex = parseInt(tabIndex, 10) || 0;
  }

  ngOnInit(): void {
    if (this.checkboxGroup && this.checkboxGroup.value && this.checkboxGroup.value.length) {
      this.checked = this.checkboxGroup.value.includes(this.value);
    }
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._inputElement.nativeElement);
  }

  @HostBinding('class.sim-checkbox-label-before')
  get labelPositionBefore() {
    return this.labelPosition === 'before';
  }

  /** Method being called whenever the label text changes. */
  _onLabelTextChange() {
    // This method is getting called whenever the label of the checkbox changes.
    // Since the checkbox uses the OnPush strategy we need to notify it about the change
    // that has been recognized by the cdkObserveContent directive.
    this._changeDetectorRef.markForCheck();
  }

  // Implemented as part of ControlValueAccessor.
  writeValue(value: any) {
    this.checked = !!value;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnChange(fn: (value: any) => void) {
    this._controlValueAccessorChangeFn = fn;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnTouched(fn: any) {
    this._onTouched = fn;
  }

  // Implemented as part of ControlValueAccessor.
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  _getAriaChecked(): 'true' | 'false' | 'mixed' {
    return this.checked ? 'true' : (this.indeterminate ? 'mixed' : 'false');
  }

  private _transitionCheckState(newState: TransitionCheckState) {
    const oldState = this._currentCheckState;
    const element: HTMLElement = this._elementRef.nativeElement;

    if (oldState === newState) {
      return;
    }
    if (this._currentAnimationClass.length > 0) {
      element.classList.remove(this._currentAnimationClass);
    }

    /* this._currentAnimationClass = this._getAnimationClassForCheckStateTransition(
      oldState, newState); */
    this._currentCheckState = newState;

    if (this._currentAnimationClass.length > 0) {
      element.classList.add(this._currentAnimationClass);
    }
  }

  private _emitChangeEvent() {
    this._controlValueAccessorChangeFn(this.checked);
    this.change.emit(new SimCheckboxChange(this, this.checked, this.value));
  }

  /** Toggles the `checked` state of the checkbox. */
  toggle(): void {
    this.checked = !this.checked;
  }

  /**
   * Event handler for checkbox input element.
   * Toggles checked state if element is not disabled.
   * Do not toggle on (change) event since IE doesn't fire change event when
   *   indeterminate checkbox is clicked.
   */
  _onInputClick(event: Event) {
    // We have to stop propagation for click events on the visual hidden input element.
    // By default, when a user clicks on a label element, a generated click event will be
    // dispatched on the associated input element. Since we are using a label element as our
    // root container, the click event on the `checkbox` will be executed twice.
    // The real click event will bubble up, and the generated click event also tries to bubble up.
    // This will lead to multiple click events.
    // Preventing bubbling for the second event will solve that issue.
    event.stopPropagation();
    if (this.disabled) {
      return;
    }
    this.toggle();
    this._emitChangeEvent();
    if (this.checkboxGroup) {
      const value = this.checkboxGroup.selected.map((checkbox: CheckboxComponent) => checkbox.value);
      this.checkboxGroup.onChange(value);
      this.checkboxGroup._touch();
      this.checkboxGroup._emitChangeEvent();
    }

  }

  /** Focuses the checkbox. */
  focus(): void {
    this._focusMonitor.focusVia(this._inputElement.nativeElement, 'keyboard');
  }

  _onInteractionEvent(event: Event) {
    // We always have to stop propagation on the change event.
    // Otherwise the change event, from the input element, will bubble up and
    // emit its event object to the `change` output.
    event.stopPropagation();
  }

  /**
 * 将单选按钮标记为需要检查更改检测。 由于父j级将直接更新单选按钮的绑定属性，因此公开此方法。
 */
  _markForCheck() {
    // 当组值改变时，按钮将不会被通知。 使用`markForCheck`来显式更新单选按钮的状态
    this._changeDetectorRef.markForCheck();
  }

}

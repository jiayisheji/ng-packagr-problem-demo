import {
  Directive,
  DoCheck,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  NgZone,
  HostBinding,
} from '@angular/core';
import { FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { Platform } from '@angular/cdk/platform';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { SimFormFieldControl } from 'simple-ui/form-field';
import { Subject } from 'rxjs';
import { mixinSize, ThemeSize, CanSize, mixinErrorState, ErrorStateMatcher, CanUpdateErrorState } from 'simple-ui/core';
import { SIM_INPUT_VALUE_ACCESSOR } from './input-value-accessor';


// 应用 mixins 到 SimInput 的基类
export class SimInputBase {
  constructor(
    public _elementRef: ElementRef,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    public _parentForm: NgForm,
    public _parentFormGroup: FormGroupDirective,
    public ngControl: NgControl) { }
}
export const _SimInputMixinBase = mixinErrorState(mixinSize(SimInputBase, 'md'));

let nextUniqueId = 0;

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[simInput]',
  providers: [{ provide: SimFormFieldControl, useExisting: InputDirective }],
})
export class InputDirective extends _SimInputMixinBase implements SimFormFieldControl<any>,
  OnChanges, OnDestroy, OnInit, DoCheck, CanUpdateErrorState, CanSize {
  @HostBinding('class.sim-input') true;

  @HostBinding('attr.autocomplete')
  get attrAutocomplete() {
    return 'off';
  }

  protected _uid = `sim-input-${nextUniqueId++}`;
  protected _previousNativeValue: any;
  private _inputValueAccessor: { value: any };
  _ariaDescribedby: string;
  readonly stateChanges: Subject<void> = new Subject<void>();
  focused = false;
  controlType = 'sim-input';
  autofilled = false;
  @Input()
  get value(): string { return this._inputValueAccessor.value; }
  set value(value: string) {
    if (value !== this.value) {
      this._inputValueAccessor.value = value;
      this.stateChanges.next();
    }
  }

  @Input() size: ThemeSize;

  @Input()
  @HostBinding('attr.id')
  get id(): string { return this._id; }
  set id(value: string) { this._id = value || this._uid; }
  protected _id: string;

  @HostBinding('attr.placeholder')
  @Input() placeholder: string;

  @Input()
  get disabled(): boolean {
    if (this.ngControl && this.ngControl.disabled !== null) {
      return this.ngControl.disabled;
    }
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = value;

    // 如果输入被禁用得太快, 浏览器可能不会发射模糊事件。从这里重置, 以确保元素不会被卡住。
    if (this.focused) {
      this.focused = false;
      this.stateChanges.next();
    }
  }
  protected _disabled = false;

  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) { this._required = value; }
  protected _required = false;

  @Input() errorStateMatcher: ErrorStateMatcher;

  constructor(
    _elementRef: ElementRef,
    protected _platform: Platform,
    @Optional() @Self() public ngControl: NgControl,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() @Inject(SIM_INPUT_VALUE_ACCESSOR) inputValueAccessor: any,
    private _autofillMonitor: AutofillMonitor,
    ngZone: NgZone
  ) {
    super(_elementRef, _defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);
    // 如果未显式指定输入值访问器, 请使用该元素作为输入值访问器。
    this._inputValueAccessor = this._elementRef.nativeElement;
    this._previousNativeValue = this.value;
    // 在未指定 id 的情况下, 将调用强制 setter。
    this.id = this.id;

    /**
     * 在 iOS 的某些版本中, 当按住 delete 键时, 插入符号会卡在错误的位置。
     * 为了绕过这个, 我们需要 "摇动" 插入符号松散。
     * 因为这个 bug 只存在于 ios 上, 所以我们只会在 ios 上安装监听器。
     */
    if (_platform.IOS) {
      ngZone.runOutsideAngular(() => {
        _elementRef.nativeElement.addEventListener('keyup', (event: Event) => {
          const el = event.target as HTMLInputElement;
          if (!el.value && !el.selectionStart && !el.selectionEnd) {
            // 注意:仅仅设置“0,0”并不能解决问题。
            // 设置“1,1”将第一次修改为您输入文本，然后保存delete。
            // 切换到' 1,1 '然后回到' 0,0 '似乎完全修复了它。
            el.setSelectionRange(1, 1);
            el.setSelectionRange(0, 0);
          }
        });
      });
    }
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
      // 我们需要在每个变更检测周期中重新评估，因为有一些
      // 我们不能订阅的错误触发器(例如父表单提交)。这意味着
      // 无论这里的逻辑是什么，都必须非常精简，否则我们就有可能破坏性能。
      this.updateErrorState();
    }

    // 我们需要对本机元素的值进行脏检查，
    // 因为在某些情况下，当它发生更改时，
    // 我们不会得到通知(例如，使用者没有使用表单，或者他们正在使用“emitEvent: false”更新值)。
    this._dirtyCheckNativeValue();
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this._autofillMonitor.stopMonitoring(this._elementRef.nativeElement);
  }

  protected _isBadInput() {
    // “有效性”属性不会出现在平台服务器上。
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

  /** 对本机输入值属性进行一些手动脏检查。*/
  protected _dirtyCheckNativeValue() {
    const newValue = this.value;

    if (this._previousNativeValue !== newValue) {
      this._previousNativeValue = newValue;
      this.stateChanges.next();
    }
  }


  focus(): void { this._elementRef.nativeElement.focus(); }

  onContainerClick() { this.focus(); }

  setDescribedByIds(ids: string[]) { this._ariaDescribedby = ids.join(' '); }
}

import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { SelectionModel } from '@angular/cdk/collections';
import {
  DOWN_ARROW,
  END,
  ENTER,
  HOME,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {
  CdkConnectedOverlay,
  Overlay,
  RepositionScrollStrategy,
  ScrollStrategy,
  ViewportRuler,
} from '@angular/cdk/overlay';
import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DoCheck,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  isDevMode,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  Self,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  HostBinding,
  HostListener,
} from '@angular/core';
import { ControlValueAccessor, FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { FormFieldComponent, SimFormFieldControl } from 'simple-ui/form-field';
import { defer, merge, Observable, Subject } from 'rxjs';
import { filter, map, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { matSelectAnimations } from './select-animations';
import {
  SIM_OPTION_PARENT_COMPONENT,
  SimOptionSelectionChange,
  OptionComponent,
  OptgroupComponent,
  _countGroupLabelsBeforeOption,
  _getOptionScrollPosition
} from 'simple-ui/option';
import {
  CanUpdateErrorState,
  HasTabIndex,
  CanDisable,
  ErrorStateMatcher,
  mixinTabIndex,
  mixinDisabled,
  mixinErrorState,
  mixinSize,
  CanSize,
  ThemeSize
} from 'simple-ui/core';
import { SelectTriggerDirective } from './select-trigger.directive';

/** 选择的覆盖面板的最大高度。 */
const SELECT_PANEL_MAX_HEIGHT = 256;

/** The panel's padding on the x-axis */
const SELECT_PANEL_PADDING_X = 16;

/** The panel's x axis padding if it is indented (e.g. there is an option group). */
const SELECT_PANEL_INDENT_PADDING_X = SELECT_PANEL_PADDING_X * 2;

/** The height of the select items in `em` units. */
const SELECT_ITEM_HEIGHT_EM = 3;

/**
 * Distance between the panel edge and the option text in
 * multi-selection mode.
 *
 * (SELECT_PANEL_PADDING_X * 1.5) + 20 = 44
 * The padding is multiplied by 1.5 because the checkbox's margin is half the padding.
 * The checkbox width is 20px.
 */
const SELECT_MULTIPLE_PANEL_PADDING_X = SELECT_PANEL_PADDING_X * 1.5 + 20;

/**
 * The select panel will only "fit" inside the viewport if it is positioned at
 * this value or more away from the viewport boundary.
 */
const SELECT_PANEL_VIEWPORT_PADDING = 8;

export class SimSelectBase {
  constructor(public _elementRef: ElementRef,
              public _defaultErrorStateMatcher: ErrorStateMatcher,
              public _parentForm: NgForm,
              public _parentFormGroup: FormGroupDirective,
              public ngControl: NgControl) { }
}
export const _SimSelectMixinBase = mixinTabIndex(mixinDisabled(mixinErrorState(mixinSize(SimSelectBase, 'md'))));


/** 当选择值发生更改时发出的更改事件对象。 */
export class SimSelectChange {
  constructor(
    /** 引用发出更改事件的select。 */
    public source: SelectComponent,
    /** 发出事件的select的当前值。 */
    public value: any) { }
}

/** Injection token that determines the scroll handling while a select is open. */
export const SIM_SELECT_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>('sim-select-scroll-strategy');


export function SIM_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay: Overlay):
  () => RepositionScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

export const SIM_SELECT_SCROLL_STRATEGY_PROVIDER = {
  provide: SIM_SELECT_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: SIM_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
};

let nextUniqueId = 0;

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    matSelectAnimations.transformPanel,
    matSelectAnimations.fadeInContent
  ],
  providers: [
    { provide: SimFormFieldControl, useExisting: SelectComponent },
    { provide: SIM_OPTION_PARENT_COMPONENT, useExisting: SelectComponent }
  ],
})
export class SelectComponent extends _SimSelectMixinBase implements OnInit, AfterContentInit, OnChanges,
  OnDestroy, OnInit, DoCheck, ControlValueAccessor, CanDisable, HasTabIndex,
  SimFormFieldControl<any>, CanUpdateErrorState, CanSize {
  @HostBinding('class.sim-select') true;


  /** 覆盖面板是否打开。 */
  private _panelOpen = false;

  /** 表单中是否需要填写select。 */
  private _required = false;

  /** 覆盖面板的滚动位置，计算为中心选定的选项。 */
  private _scrollTop = 0;

  /** 在select的触发器中显示的占位符。 */
  private _placeholder: string;

  /** 组件是否处于多个选择模式。 */
  private _multiple = false;

  /** 触发打开select。 */
  @ViewChild('trigger', { static: false }) trigger: ElementRef;

  /** 包含选择选项的面板。*/
  @ViewChild('panel', { static: false }) panel: ElementRef;

  /** 包含选项的覆盖面板。 */
  @ViewChild(CdkConnectedOverlay, { static: false }) overlayDir: CdkConnectedOverlay;

  /** 所有定义的选择选项。 */
  @ContentChildren(OptionComponent, { descendants: true }) options: QueryList<OptionComponent>;

  /** 所有定义的选择选项组。 */
  @ContentChildren(OptgroupComponent) optionGroups: QueryList<OptgroupComponent>;

  /** User-supplied override of the trigger element. */
  @ContentChild(SelectTriggerDirective, { static: false }) customTrigger: SelectTriggerDirective;



  /** 这个输入的唯一id。 */
  private _uid = `sim-select-${nextUniqueId++}`;

  /** 当组件被销毁时发出。 */
  private readonly _destroy = new Subject<void>();

  /** 触发器的客户端边界rect的最后一个测量值。*/
  _triggerRect: ClientRect;

  /** 在选择改进a11y时，由aria描述的属性。 */
  _ariaDescribedby: string;

  /** 触发器元素的缓存的字体大小。 */
  _triggerFontSize = 0;

  /** 处理选择逻辑。 */
  _selectionModel: SelectionModel<OptionComponent>;

  /** 为面板中的选项管理键盘事件。 */
  _keyManager: ActiveDescendantKeyManager<OptionComponent>;

  /** 子选项的id被传递给aria拥有属性。 */
  _optionIds = '';

  /** 选择面板的转换源属性的值。 */
  _transformOrigin = 'top';

  /** 面板的动画是否完成。 */
  _panelDoneAnimating = false;

  /** 当选择面板打开时，将用于处理滚动的策略。 */
  _scrollStrategy = this._scrollStrategyFactory();

  /**
   * The y-offset of the overlay panel in relation to the trigger's top start corner.
   * This must be adjusted to align the selected option text over the trigger text.
   * when the panel opens. Will change based on the y-position of the selected option.
   */
  _offsetY = 0;

  /**
   * This position config ensures that the top "start" corner of the overlay
   * is aligned with with the top "start" of the origin by default (overlapping
   * the trigger completely). If the panel cannot fit below the trigger, it
   * will fall back to a position above the trigger.
   */
  _positions = [
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'top',
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'bottom',
    },
  ];

  /** 该组件是否在触发器上禁用了活动选项的中心。 */
  private _disableOptionCentering = false;

  /** 选择是否集中。 */
  focused = false;

  /** 这个控件的名称可以被“sim-form-field”使用。 */
  controlType = 'sim-select';

  _filter: boolean;

  /** 如果没有选择任何值，则显示占位符。 */
  @Input()
  get filter(): boolean { return this._filter; }
  set filter(value: boolean) {
    this._filter = coerceBooleanProperty(value);
  }


  _search: boolean;

  /** 如果没有选择任何值，则显示占位符。 */
  @Input()
  get search(): boolean { return this._search; }
  set search(value: boolean) {
    this._search = coerceBooleanProperty(value);
  }

  /** 要传递给select面板的类。支持与“ngClass”相同的语法。 */
  @Input() panelClass: string | string[] | Set<string> | { [key: string]: any };

  /** 如果没有选择任何值，则显示占位符。 */
  @Input()
  get placeholder(): string { return this._placeholder; }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  /** 是否必填。*/
  @Input()
  @HostBinding('class.sim-select-required')
  get required(): boolean { return this._required; }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input() size: ThemeSize;

  @HostBinding('class.sim-select-disabled')
  @Input() disabled: boolean;

  @HostBinding('class.sim-select-composite')
  @Input() composite: boolean;

  /** Whether the user should be allowed to select multiple options. */
  @Input()
  @HostBinding('class.sim-select-multiple')
  get multiple(): boolean { return this._multiple; }
  set multiple(value: boolean) {
    if (this._selectionModel) {
      throw Error('无法更改初始化后的‘multiple’模式。');
    }
    this._multiple = coerceBooleanProperty(value);
  }

  /** Whether to center the active option over the trigger. */
  @Input()
  get disableOptionCentering(): boolean { return this._disableOptionCentering; }
  set disableOptionCentering(value: boolean) {
    this._disableOptionCentering = coerceBooleanProperty(value);
  }

  /**
   * A function to compare the option values with the selected values. The first argument
   * is a value from an option. The second is a value from the selection. A boolean
   * should be returned.
   */
  @Input()
  get compareWith() { return this._compareWith; }
  set compareWith(fn: (o1: any, o2: any) => boolean) {
    if (typeof fn !== 'function') {
      throw Error('“compareWith”必须是一个函数。');
    }
    this._compareWith = fn;
    if (this._selectionModel) {
      // A different comparator means the selection could change.
      this._initializeSelection();
    }
  }

  /** Value of the select control. */
  @Input()
  get value(): any { return this._value; }
  set value(newValue: any) {
    if (newValue !== this._value) {
      this.writeValue(newValue);
      this._value = newValue;
    }
  }
  private _value: any;

  /** Aria label of the select. If not specified, the placeholder will be used as label. */
  @HostBinding('attr.aria-label')
  @Input() ariaLabel = '';

  /** Input that can be used to specify the `aria-labelledby` attribute. */
  @HostBinding('attr.aria-labelledby')
  @Input() ariaLabelledby: string;

  /** An object used to control when error messages are shown. */
  @Input() errorStateMatcher: ErrorStateMatcher;

  @Input() data: any;
  /** Unique id of the element. */
  @Input()
  @HostBinding('attr.id')
  get id(): string { return this._id; }
  set id(value: string) {
    this._id = value || this._uid;
    this.stateChanges.next();
  }
  private _id: string;

  /** Combined stream of all of the child options' change events. */
  readonly optionSelectionChanges: Observable<SimOptionSelectionChange> = defer(() => {
    const options = this.options;

    if (options) {
      return options.changes.pipe(
        startWith(options),
        switchMap(() => merge(...options.map(option => option.selectionChange)))
      );
    }

    return this._ngZone.onStable
      .asObservable()
      .pipe(take(1), switchMap(() => this.optionSelectionChanges));
  }) as Observable<SimOptionSelectionChange>;

  /** Event emitted when the select panel has been toggled. */
  @Output() readonly openedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /** Event emitted when the select has been opened. */
  @Output() readonly opened: Observable<void> = this.openedChange.pipe(filter(o => o), map(() => { }));

  /** Event emitted when the select has been closed. */
  @Output() readonly closed: Observable<void> = this.openedChange.pipe(filter(o => !o), map(() => { }));

  /** 当用户更改所选值时发出的事件。 */
  @Output() readonly selectionChange: EventEmitter<SimSelectChange> =
    new EventEmitter<SimSelectChange>();

  /**
   * Event that emits whenever the raw value of the select changes. This is here primarily
   * to facilitate the two-way binding for the `value` input.
   * @docs-private
   */
  @Output() readonly valueChange: EventEmitter<any> = new EventEmitter<any>();


  /** `View -> model 当值发生变化时调用。` */
  _onChange: (value: any) => void = () => { };

  /** `View -> model 当选择被触摸时调用回调。` */
  _onTouched = () => { };

  /** 比较函数来指定显示哪个选项。默认为对象的平等。 */
  private _compareWith = (o1: any, o2: any) => o1 === o2;

  constructor(
    private _viewportRuler: ViewportRuler,
    private _changeDetectorRef: ChangeDetectorRef,
    private _ngZone: NgZone,
    _defaultErrorStateMatcher: ErrorStateMatcher,
    elementRef: ElementRef,
    @Optional() private _dir: Directionality,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    @Optional() private _parentFormField: FormFieldComponent,
    @Self() @Optional() public ngControl: NgControl,
    @Attribute('tabindex') tabIndex: string,
    @Inject(SIM_SELECT_SCROLL_STRATEGY) private _scrollStrategyFactory) {
    super(elementRef, _defaultErrorStateMatcher, _parentForm,
      _parentFormGroup, ngControl);

    if (this.ngControl) {
      // 注意:我们在这里提供了值访问器，而不是“提供者”以避免运行到循环导入。
      this.ngControl.valueAccessor = this;
    }

    this.tabIndex = parseInt(tabIndex, 10) || 0;

    // 在没有指定情况id的情况下调用Force setter。
    this.id = this.id;
  }

  ngOnInit() {
    this._selectionModel = new SelectionModel<OptionComponent>(this.multiple, undefined, false);
    this.stateChanges.next();
  }

  ngAfterContentInit() {
    this._initKeyManager();

    this.options.changes.pipe(startWith(null), takeUntil(this._destroy)).subscribe(() => {
      this._resetOptions();
      this._initializeSelection();
    });
  }

  ngDoCheck() {
    if (this.ngControl) {
      this.updateErrorState();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Updating the disabled state is handled by `mixinDisabled`, but we need to additionally let
    // the parent form field know to run change detection when the disabled state changes.
    if (changes.disabled) {
      this.stateChanges.next();
    }
  }

  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
    this.stateChanges.complete();
  }

  /** Toggles the overlay panel open or closed. */
  toggle(): void {
    this.panelOpen ? this.close() : this.open();
  }

  /** Opens the overlay panel. */
  open(): void {
    if (this.disabled || !this.options || !this.options.length || this._panelOpen) {
      return;
    }

    this._triggerRect = this.trigger.nativeElement.getBoundingClientRect();
    // Note: The computed font-size will be a string pixel value (e.g. "16px").
    // `parseInt` ignores the trailing 'px' and converts this to a number.
    this._triggerFontSize = parseInt(getComputedStyle(this.trigger.nativeElement)['font-size'], 10);

    this._panelOpen = true;
    this._keyManager.withHorizontalOrientation(null);
    this._calculateOverlayPosition();
    this._highlightCorrectOption();
    this._changeDetectorRef.markForCheck();

    // Set the font size on the panel element once it exists.
    this._ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
      if (this._triggerFontSize && this.overlayDir.overlayRef &&
        this.overlayDir.overlayRef.overlayElement) {
        this.overlayDir.overlayRef.overlayElement.style.fontSize = `${this._triggerFontSize}px`;
      }
    });
  }

  /** Closes the overlay panel and focuses the host element. */
  close(): void {
    if (this._panelOpen) {
      this._panelOpen = false;
      this._keyManager.withHorizontalOrientation(this._isRtl() ? 'rtl' : 'ltr');
      this._changeDetectorRef.markForCheck();
      this._onTouched();
    }
  }

  /**
   * Sets the select's value. Part of the ControlValueAccessor interface
   * required to integrate with Angular's core forms API.
   *
   * @param value New value to be written to the model.
   */
  writeValue(value: any): void {
    if (this.options) {
      this._setSelectionByValue(value);
    }
  }

  /**
   * Saves a callback function to be invoked when the select's value
   * changes from user input. Part of the ControlValueAccessor interface
   * required to integrate with Angular's core forms API.
   *
   * @param fn Callback to be triggered when the value changes.
   */
  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  /**
   * Saves a callback function to be invoked when the select is blurred
   * by the user. Part of the ControlValueAccessor interface required
   * to integrate with Angular's core forms API.
   *
   * @param fn Callback to be triggered when the component has been touched.
   */
  registerOnTouched(fn: () => {}): void {
    this._onTouched = fn;
  }

  /**
   * Disables the select. Part of the ControlValueAccessor interface required
   * to integrate with Angular's core forms API.
   *
   * @param isDisabled Sets whether the component is disabled.
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this._changeDetectorRef.markForCheck();
    this.stateChanges.next();
  }

  /** Whether or not the overlay panel is open. */
  get panelOpen(): boolean {
    return this._panelOpen;
  }

  /** The currently selected option. */
  get selected(): OptionComponent | OptionComponent[] {
    return this.multiple ? this._selectionModel.selected : this._selectionModel.selected[0];
  }

  /** The value displayed in the trigger. */
  get triggerValue(): string {
    if (this.empty) {
      return '';
    }

    if (this._multiple) {
      const selectedOptions = this._selectionModel.selected.map(option => option.viewValue);

      if (this._isRtl()) {
        selectedOptions.reverse();
      }

      // TODO(crisbeto): delimiter should be configurable for proper localization.
      return selectedOptions.join(', ');
    }

    return this._selectionModel.selected[0].viewValue;
  }

  /** Whether the element is in RTL mode. */
  _isRtl(): boolean {
    return this._dir ? this._dir.value === 'rtl' : false;
  }

  /** Handles all keydown events on the select. */
  @HostListener('keydown', ['$event'])
  _handleKeydown(event: KeyboardEvent): void {
    if (!this.disabled) {
      this.panelOpen ? this._handleOpenKeydown(event) : this._handleClosedKeydown(event);
    }
  }

  /** Handles keyboard events while the select is closed. */
  private _handleClosedKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;
    const isArrowKey = keyCode === DOWN_ARROW || keyCode === UP_ARROW ||
      keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW;
    const isOpenKey = keyCode === ENTER || keyCode === SPACE;

    // Open the select on ALT + arrow key to match the native <select>
    if (isOpenKey || ((this.multiple || event.altKey) && isArrowKey)) {
      event.preventDefault(); // prevents the page from scrolling down when pressing space
      this.open();
    } else if (!this.multiple) {
      this._keyManager.onKeydown(event);
    }
  }

  /** Handles keyboard events when the selected is open. */
  private _handleOpenKeydown(event: KeyboardEvent): void {
    console.log('_handleOpenKeydown', event);
    const keyCode = event.keyCode;
    const isArrowKey = keyCode === DOWN_ARROW || keyCode === UP_ARROW;
    const manager = this._keyManager;

    if (keyCode === HOME || keyCode === END) {
      event.preventDefault();
      keyCode === HOME ? manager.setFirstItemActive() : manager.setLastItemActive();
    } else if (isArrowKey && event.altKey) {
      // Close the select on ALT + arrow key to match the native <select>
      event.preventDefault();
      this.close();
    } else if ((keyCode === ENTER || keyCode === SPACE) && manager.activeItem) {
      event.preventDefault();
      manager.activeItem._selectViaInteraction();
    } else {
      const previouslyFocusedIndex = manager.activeItemIndex;

      manager.onKeydown(event);

      if (this._multiple && isArrowKey && event.shiftKey && manager.activeItem &&
        manager.activeItemIndex !== previouslyFocusedIndex) {
        manager.activeItem._selectViaInteraction();
      }
    }
  }

  /**
   * When the panel element is finished transforming in (though not fading in), it
   * emits an event and focuses an option if the panel is open.
   */
  _onPanelDone(): void {
    if (this.panelOpen) {
      this._scrollTop = 0;
      this.openedChange.emit(true);
    } else {
      this.openedChange.emit(false);
      this._panelDoneAnimating = false;
      this.overlayDir.offsetX = 0;
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * When the panel content is done fading in, the _panelDoneAnimating property is
   * set so the proper class can be added to the panel.
   */
  _onFadeInDone(): void {
    this._panelDoneAnimating = this.panelOpen;
    this._changeDetectorRef.markForCheck();
  }

  @HostListener('focus', [])
  _onFocus() {
    if (!this.disabled) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  /**
   * Calls the touched callback only if the panel is closed. Otherwise, the trigger will
   * "blur" to the panel when it opens, causing a false positive.
   */
  @HostListener('blur', [])
  _onBlur() {
    this.focused = false;

    if (!this.disabled && !this.panelOpen) {
      this._onTouched();
      this._changeDetectorRef.markForCheck();
      this.stateChanges.next();
    }
  }

  /**
   * Callback that is invoked when the overlay panel has been attached.
   */
  _onAttached(): void {
    this.overlayDir.positionChange.pipe(take(1)).subscribe(() => {
      this._changeDetectorRef.detectChanges();
      this._calculateOverlayOffsetX();
      this.panel.nativeElement.scrollTop = this._scrollTop;
    });
  }

  /** Whether the select has a value. */
  get empty(): boolean {
    return !this._selectionModel || this._selectionModel.isEmpty();
  }

  private _initializeSelection(): void {
    // Defer setting the value in order to avoid the "Expression
    // has changed after it was checked" errors from Angular.
    Promise.resolve().then(() => {
      this._setSelectionByValue(this.ngControl ? this.ngControl.value : this._value);
    });
  }

  /**
   * Sets the selected option based on a value. If no option can be
   * found with the designated value, the select trigger is cleared.
   */
  private _setSelectionByValue(value: any | any[], isUserInput = false): void {
    if (this.multiple && value) {
      if (!Array.isArray(value)) {
        throw Error('值必须是多选择模式下的数组。');
      }

      this._clearSelection();
      value.forEach((currentValue: any) => this._selectValue(currentValue, isUserInput));
      this._sortValues();
    } else {
      this._clearSelection();

      const correspondingOption = this._selectValue(value, isUserInput);

      // Shift focus to the active item. Note that we shouldn't do this in multiple
      // mode, because we don't know what option the user interacted with last.
      if (correspondingOption) {
        this._keyManager.setActiveItem(correspondingOption);
      }
    }

    this._changeDetectorRef.markForCheck();
  }

  /**
   * Finds and selects and option based on its value.
   * @returns Option that has the corresponding value.
   */
  private _selectValue(value: any, isUserInput = false): OptionComponent | undefined {
    const correspondingOption = this.options.find((option: OptionComponent) => {
      try {
        // 将null视为一个特殊的重置值。
        return option.value != null && this._compareWith(option.value, value);
      } catch (error) {
        if (isDevMode()) {
          // 在他们的比较器中通知开发人员错误。
          console.warn(error);
        }
        return false;
      }
    });

    if (correspondingOption) {
      isUserInput ? correspondingOption._selectViaInteraction() : correspondingOption.select();
      this._selectionModel.select(correspondingOption);
      this.stateChanges.next();
    }

    return correspondingOption;
  }


  /**
   * Clears the select trigger and deselects every option in the list.
   * @param skip Option that should not be deselected.
   */
  private _clearSelection(skip?: OptionComponent): void {
    this._selectionModel.clear();
    this.options.forEach(option => {
      if (option !== skip) {
        option.deselect();
      }
    });
    this.stateChanges.next();
  }

  /** Sets up a key manager to listen to keyboard events on the overlay panel. */
  private _initKeyManager() {
    this._keyManager = new ActiveDescendantKeyManager<OptionComponent>(this.options)
      .withTypeAhead()
      .withVerticalOrientation()
      .withHorizontalOrientation(this._isRtl() ? 'rtl' : 'ltr');

    this._keyManager.tabOut.pipe(takeUntil(this._destroy)).subscribe(() => {
      // Restore focus to the trigger before closing. Ensures that the focus
      // position won't be lost if the user got focus into the overlay.
      this.focus();
      this.close();
    });

    this._keyManager.change.pipe(takeUntil(this._destroy)).subscribe(() => {
      if (this._panelOpen && this.panel) {
        this._scrollActiveOptionIntoView();
      } else if (!this._panelOpen && !this.multiple && this._keyManager.activeItem) {
        this._keyManager.activeItem._selectViaInteraction();
      }
    });
  }

  /** Drops current option subscriptions and IDs and resets from scratch. */
  private _resetOptions(): void {
    const changedOrDestroyed = merge(this.options.changes, this._destroy);

    this.optionSelectionChanges
      .pipe(takeUntil(changedOrDestroyed), filter(event => event.isUserInput))
      .subscribe(event => {
        this._onSelect(event.source);

        if (!this.multiple && this._panelOpen) {
          this.close();
          this.focus();
        }
      });

    // Listen to changes in the internal state of the options and react accordingly.
    // Handles cases like the labels of the selected options changing.
    merge(...this.options.map(option => option._stateChanges))
      .pipe(takeUntil(changedOrDestroyed))
      .subscribe(() => {
        this._changeDetectorRef.markForCheck();
        this.stateChanges.next();
      });

    this._setOptionIds();
  }

  /** Invoked when an option is clicked. */
  private _onSelect(option: OptionComponent): void {
    const wasSelected = this._selectionModel.isSelected(option);

    // TODO(crisbeto): handle blank/null options inside multi-select.
    if (this.multiple) {
      this._selectionModel.toggle(option);
      this.stateChanges.next();
      wasSelected ? option.deselect() : option.select();
      this._keyManager.setActiveItem(option);
      this._sortValues();

      // In case the user select the option with their mouse, we
      // want to restore focus back to the trigger, in order to
      // prevent the select keyboard controls from clashing with
      // the ones from `mat-option`.
      this.focus();
    } else {
      this._clearSelection(option.value == null ? undefined : option);

      if (option.value == null) {
        this._propagateChanges(option.value);
      } else {
        this._selectionModel.select(option);
        this.stateChanges.next();
      }
    }

    if (wasSelected !== this._selectionModel.isSelected(option)) {
      this._propagateChanges();
    }
  }

  /**
   * Sorts the model values, ensuring that they keep the same
   * order that they have in the panel.
   */
  private _sortValues(): void {
    if (this._multiple) {
      this._selectionModel.clear();

      this.options.forEach(option => {
        if (option.selected) {
          this._selectionModel.select(option);
        }
      });
      this.stateChanges.next();
    }
  }

  /** Emits change event to set the model value. */
  private _propagateChanges(fallbackValue?: any): void {
    let valueToEmit: any = null;

    if (this.multiple) {
      valueToEmit = (this.selected as OptionComponent[]).map(option => option.value);
    } else {
      valueToEmit = this.selected ? (this.selected as OptionComponent).value : fallbackValue;
    }

    this._value = valueToEmit;
    this.valueChange.emit(valueToEmit);
    this._onChange(valueToEmit);
    this.selectionChange.emit(new SimSelectChange(this, valueToEmit));
    this._changeDetectorRef.markForCheck();
  }

  /** Records option IDs to pass to the aria-owns property. */
  private _setOptionIds() {
    this._optionIds = this.options.map(option => option.id).join(' ');
  }

  /**
   * Highlights the selected item. If no option is selected, it will highlight
   * the first item instead.
   */
  private _highlightCorrectOption(): void {
    if (this._keyManager) {
      if (this.empty) {
        this._keyManager.setFirstItemActive();
      } else {
        this._keyManager.setActiveItem(this._selectionModel.selected[0]);
      }
    }
  }

  /** Scrolls the active option into view. */
  private _scrollActiveOptionIntoView(): void {
    const activeOptionIndex = this._keyManager.activeItemIndex || 0;
    const labelCount = _countGroupLabelsBeforeOption(activeOptionIndex, this.options,
      this.optionGroups);

    this.panel.nativeElement.scrollTop = _getOptionScrollPosition(
      activeOptionIndex + labelCount,
      this._getItemHeight(),
      this.panel.nativeElement.scrollTop,
      SELECT_PANEL_MAX_HEIGHT
    );
  }

  /** Focuses the select element. */
  focus(): void {
    this._elementRef.nativeElement.focus();
  }

  /** Gets the index of the provided option in the option list. */
  private _getOptionIndex(option: OptionComponent): number | undefined {
    return this.options.reduce((result: number, current: OptionComponent, index: number) => {
      return result === undefined ? (option === current ? index : undefined) : result;
    }, undefined);
  }

  /** Calculates the scroll position and x- and y-offsets of the overlay panel. */
  private _calculateOverlayPosition(): void {
    const itemHeight = this._getItemHeight();
    const items = this._getItemCount();
    const panelHeight = Math.min(items * itemHeight, SELECT_PANEL_MAX_HEIGHT);
    const scrollContainerHeight = items * itemHeight;

    // The farthest the panel can be scrolled before it hits the bottom
    const maxScroll = scrollContainerHeight - panelHeight;

    // If no value is selected we open the popup to the first item.
    let selectedOptionOffset =
      this.empty ? 0 : this._getOptionIndex(this._selectionModel.selected[0]);

    selectedOptionOffset += _countGroupLabelsBeforeOption(selectedOptionOffset, this.options,
      this.optionGroups);

    // We must maintain a scroll buffer so the selected option will be scrolled to the
    // center of the overlay panel rather than the top.
    const scrollBuffer = panelHeight / 2;
    this._scrollTop = this._calculateOverlayScroll(selectedOptionOffset, scrollBuffer, maxScroll);
    this._offsetY = this._calculateOverlayOffsetY(selectedOptionOffset, scrollBuffer, maxScroll);

    this._checkOverlayWithinViewport(maxScroll);
  }

  /**
   * Calculates the scroll position of the select's overlay panel.
   *
   * Attempts to center the selected option in the panel. If the option is
   * too high or too low in the panel to be scrolled to the center, it clamps the
   * scroll position to the min or max scroll positions respectively.
   */
  _calculateOverlayScroll(selectedIndex: number, scrollBuffer: number,
                          maxScroll: number): number {
    const itemHeight = this._getItemHeight();
    const optionOffsetFromScrollTop = itemHeight * selectedIndex;
    const halfOptionHeight = itemHeight / 2;

    // Starts at the optionOffsetFromScrollTop, which scrolls the option to the top of the
    // scroll container, then subtracts the scroll buffer to scroll the option down to
    // the center of the overlay panel. Half the option height must be re-added to the
    // scrollTop so the option is centered based on its middle, not its top edge.
    const optimalScrollPosition = optionOffsetFromScrollTop - scrollBuffer + halfOptionHeight;
    return Math.min(Math.max(0, optimalScrollPosition), maxScroll);
  }

  /** Returns the aria-label of the select component. */
  get _ariaLabel(): string | null {
    // If an ariaLabelledby value has been set, the select should not overwrite the
    // `aria-labelledby` value by setting the ariaLabel to the placeholder.
    return this.ariaLabelledby ? null : this.ariaLabel || this.placeholder;
  }

  /** Determines the `aria-activedescendant` to be set on the host. */
  _getAriaActiveDescendant(): string | null {
    if (this.panelOpen && this._keyManager && this._keyManager.activeItem) {
      return this._keyManager.activeItem.id;
    }

    return null;
  }

  /**
   * Sets the x-offset of the overlay panel in relation to the trigger's top start corner.
   * This must be adjusted to align the selected option text over the trigger text when
   * the panel opens. Will change based on LTR or RTL text direction. Note that the offset
   * can't be calculated until the panel has been attached, because we need to know the
   * content width in order to constrain the panel within the viewport.
   */
  private _calculateOverlayOffsetX(): void {
    const overlayRect = this.overlayDir.overlayRef.overlayElement.getBoundingClientRect();
    const viewportSize = this._viewportRuler.getViewportSize();
    const isRtl = this._isRtl();
    const paddingWidth = this.multiple ? SELECT_MULTIPLE_PANEL_PADDING_X + SELECT_PANEL_PADDING_X :
      SELECT_PANEL_PADDING_X * 2;
    let offsetX: number;

    // Adjust the offset, depending on the option padding.
    if (this.multiple) {
      offsetX = SELECT_MULTIPLE_PANEL_PADDING_X;
    } else {
      const selected = this._selectionModel.selected[0] || this.options.first;
      offsetX = selected && selected.group ? SELECT_PANEL_INDENT_PADDING_X : SELECT_PANEL_PADDING_X;
    }

    // Invert the offset in LTR.
    if (!isRtl) {
      offsetX *= -1;
    }

    // Determine how much the select overflows on each side.
    const leftOverflow = 0 - (overlayRect.left + offsetX - (isRtl ? paddingWidth : 0));
    const rightOverflow = overlayRect.right + offsetX - viewportSize.width
      + (isRtl ? 0 : paddingWidth);

    // If the element overflows on either side, reduce the offset to allow it to fit.
    if (leftOverflow > 0) {
      offsetX += leftOverflow + SELECT_PANEL_VIEWPORT_PADDING;
    } else if (rightOverflow > 0) {
      offsetX -= rightOverflow + SELECT_PANEL_VIEWPORT_PADDING;
    }

    // Set the offset directly in order to avoid having to go through change detection and
    // potentially triggering "changed after it was checked" errors.
    console.log('offsetX', offsetX);
    this.overlayDir.offsetX = 0;
    this.overlayDir.overlayRef.updatePosition();
  }

  /**
   * Calculates the y-offset of the select's overlay panel in relation to the
   * top start corner of the trigger. It has to be adjusted in order for the
   * selected option to be aligned over the trigger when the panel opens.
   */
  private _calculateOverlayOffsetY(selectedIndex: number, scrollBuffer: number,
                                   maxScroll: number): number {
    const itemHeight = this._getItemHeight();
    const optionHeightAdjustment = (itemHeight - this._triggerRect.height) / 2;
    const maxOptionsDisplayed = Math.floor(SELECT_PANEL_MAX_HEIGHT / itemHeight);
    let optionOffsetFromPanelTop: number;

    // Disable offset if requested by user by returning 0 as value to offset
    if (this._disableOptionCentering) {
      return 0;
    }

    if (this._scrollTop === 0) {
      optionOffsetFromPanelTop = selectedIndex * itemHeight;
    } else if (this._scrollTop === maxScroll) {
      const firstDisplayedIndex = this._getItemCount() - maxOptionsDisplayed;
      const selectedDisplayIndex = selectedIndex - firstDisplayedIndex;

      // The first item is partially out of the viewport. Therefore we need to calculate what
      // portion of it is shown in the viewport and account for it in our offset.
      const partialItemHeight =
        itemHeight - (this._getItemCount() * itemHeight - SELECT_PANEL_MAX_HEIGHT) % itemHeight;

      // Because the panel height is longer than the height of the options alone,
      // there is always extra padding at the top or bottom of the panel. When
      // scrolled to the very bottom, this padding is at the top of the panel and
      // must be added to the offset.
      optionOffsetFromPanelTop = selectedDisplayIndex * itemHeight + partialItemHeight;
    } else {
      // If the option was scrolled to the middle of the panel using a scroll buffer,
      // its offset will be the scroll buffer minus the half height that was added to
      // center it.
      optionOffsetFromPanelTop = scrollBuffer - itemHeight / 2;
    }

    // The final offset is the option's offset from the top, adjusted for the height
    // difference, multiplied by -1 to ensure that the overlay moves in the correct
    // direction up the page.
    return optionOffsetFromPanelTop * -1 - optionHeightAdjustment;
  }

  /**
   * Checks that the attempted overlay position will fit within the viewport.
   * If it will not fit, tries to adjust the scroll position and the associated
   * y-offset so the panel can open fully on-screen. If it still won't fit,
   * sets the offset back to 0 to allow the fallback position to take over.
   */
  private _checkOverlayWithinViewport(maxScroll: number): void {
    const itemHeight = this._getItemHeight();
    const viewportSize = this._viewportRuler.getViewportSize();

    const topSpaceAvailable = this._triggerRect.top - SELECT_PANEL_VIEWPORT_PADDING;
    const bottomSpaceAvailable =
      viewportSize.height - this._triggerRect.bottom - SELECT_PANEL_VIEWPORT_PADDING;

    const panelHeightTop = Math.abs(this._offsetY);
    const totalPanelHeight =
      Math.min(this._getItemCount() * itemHeight, SELECT_PANEL_MAX_HEIGHT);
    const panelHeightBottom = totalPanelHeight - panelHeightTop - this._triggerRect.height;

    if (panelHeightBottom > bottomSpaceAvailable) {
      this._adjustPanelUp(panelHeightBottom, bottomSpaceAvailable);
    } else if (panelHeightTop > topSpaceAvailable) {
      this._adjustPanelDown(panelHeightTop, topSpaceAvailable, maxScroll);
    } else {
      this._transformOrigin = this._getOriginBasedOnOption();
    }
  }

  /** 调整覆盖面板，以适应视窗。 */
  private _adjustPanelUp(panelHeightBottom: number, bottomSpaceAvailable: number) {
    // 浏览器忽略了分数滚动偏移，所以我们需要循环。
    const distanceBelowViewport = Math.round(panelHeightBottom - bottomSpaceAvailable);

    // 将面板向上滚动，使其越过边界，然后调整偏移量，将面板向上移动到视口。
    this._scrollTop -= distanceBelowViewport;
    this._offsetY -= distanceBelowViewport;
    this._transformOrigin = this._getOriginBasedOnOption();

    // If the panel is scrolled to the very top, it won't be able to fit the panel
    // by scrolling, so set the offset to 0 to allow the fallback position to take
    // effect.
    if (this._scrollTop <= 0) {
      this._scrollTop = 0;
      this._offsetY = 0;
      this._transformOrigin = `50% bottom 0px`;
    }
  }

  /** 调整覆盖面板，以适应视窗。 */
  private _adjustPanelDown(panelHeightTop: number, topSpaceAvailable: number,
                           maxScroll: number) {
    // 浏览器忽略了分数滚动偏移，所以我们需要循环。
    const distanceAboveViewport = Math.round(panelHeightTop - topSpaceAvailable);

    // 将面板向下滚动，将其延伸至边界，然后调整偏移量，将面板向下移动到视口。
    this._scrollTop += distanceAboveViewport;
    this._offsetY += distanceAboveViewport;
    this._transformOrigin = this._getOriginBasedOnOption();

    // 如果面板被滚动到最底部，它将无法通过滚动来安装面板，因此将偏移量设置为0，以使回退位置生效。
    if (this._scrollTop >= maxScroll) {
      this._scrollTop = maxScroll;
      this._offsetY = 0;
      this._transformOrigin = `50% top 0px`;
      return;
    }
  }

  /** 根据所选的选项设置转换原点。 */
  private _getOriginBasedOnOption(): string {
    const itemHeight = this._getItemHeight();
    const optionHeightAdjustment = (itemHeight - this._triggerRect.height) / 2;
    const originY = Math.abs(this._offsetY) - optionHeightAdjustment + itemHeight / 2;
    return `50% ${originY}px 0px`;
  }

  /** 计算select中项目的数量。这包括选项和组标签。 */
  private _getItemCount(): number {
    return this.options.length + this.optionGroups.length;
  }

  /** 计算选择选项的高度。 */
  private _getItemHeight(): number {
    return this._triggerFontSize * 3;
  }

  /**
   * 作为SimFormFieldControl的一部分实现。
   */
  setDescribedByIds(ids: string[]) {
    this._ariaDescribedby = ids.join(' ');
  }

  /**
   * 作为SimFormFieldControl的一部分实现。
   */
  onContainerClick() {
    if (!this.composite) {
      this.focus();
      this.open();
    }
  }

  /**
   * 作为SimFormFieldControl的一部分实现。
   */
  get shouldLabelFloat(): boolean {
    return this._panelOpen || !this.empty;
  }

}


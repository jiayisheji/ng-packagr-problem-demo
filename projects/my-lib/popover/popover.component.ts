import {
  Component,
  HostListener,
  Input,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Directive,
  ChangeDetectorRef,
  ElementRef,
  ViewContainerRef,
  NgZone,
  Inject,
  Optional,
  InjectionToken,
  inject,
  HostBinding,
  AfterViewInit,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { simPopoverAnimations } from './popover-animations';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import {
  Overlay,
  ScrollDispatcher,
  ScrollStrategy,
  OverlayRef,
  FlexibleConnectedPositionStrategy,
  OriginConnectionPosition,
  OverlayConnectionPosition,
  HorizontalConnectionPos,
  VerticalConnectionPos
} from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';
import { ComponentPortal } from '@angular/cdk/portal';
import { toBoolean } from 'simple-ui/core';
import { takeUntil, take } from 'rxjs/operators';
import { ESCAPE } from '@angular/cdk/keycodes';
import { AnimationEvent } from '@angular/animations';
import { POSITION_MAP } from './overlay-position-map';

export type PopoverPosition = 'left' | 'right' | 'top' | 'bottom' |
  'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' |
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** 注入令牌，用于确定popover可见时的滚动处理 */
export const SIM_POPOVER_SCROLL_STRATEGY =
  new InjectionToken<() => ScrollStrategy>('sim-Popover-scroll-strategy', {
    providedIn: 'root',
    factory: SIM_POPOVER_SCROLL_STRATEGY_FACTORY,
  });

export function SIM_POPOVER_SCROLL_STRATEGY_FACTORY(): () => ScrollStrategy {
  const overlay = inject(Overlay);
  // 滚动事件后节制重新定位的时间20毫秒
  return () => overlay.scrollStrategies.reposition({ scrollThrottle: 20 });
}

/** 默认的`simPopover`选项可以被覆盖 */
export interface SimPopoverDefaultOptions {
  showDelay: number;
  hideDelay: number;
  touchendHideDelay: number;
}

/** 注入令牌用于覆盖`simPopover`的默认选项 */
export const SIM_POPOVER_DEFAULT_OPTIONS =
  new InjectionToken<SimPopoverDefaultOptions>('sim-popover-default-options', {
    providedIn: 'root',
    factory: SIM_POPOVER_DEFAULT_OPTIONS_FACTORY
  });

export function SIM_POPOVER_DEFAULT_OPTIONS_FACTORY(): SimPopoverDefaultOptions {
  return {
    showDelay: 0,
    hideDelay: 0,
    touchendHideDelay: 1500,
  };
}

export type PopoverVisibility = 'initial' | 'visible' | 'hidden';
export type triggerType = 'hover' | 'focus' | 'click';
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [simPopoverAnimations.popoverState]
})
export class PopoverComponent {
  @HostBinding('class')
  get hostClass(): string {
    return 'sim-popover ' + this.positionClass.join(' ');
  }

  /** 触发事件 */
  trigger: triggerType;
  /** 显示在工具提示中的消息 */
  message: TemplateRef<void>;

  position: string[] = [];

  positionClass: string[] = [];

  /** 要添加到工具提示中的类。支持与“ngClass”相同的语法。 */
  overlayClass: string | string[] | Set<string> | { [key: string]: any };

  /** 显示工具提示的当前计时器的超时ID */
  _showTimeoutId;

  /** 任何当前定时器设置的超时ID，以隐藏工具提示。 */
  _hideTimeoutId;

  _hideState: boolean = true;

  /** 由动画框架观看以显示或隐藏工具提示的属性。 */
  _visibility: PopoverVisibility = 'initial';

  /** 页面上的交互是否应该关闭工具提示 */
  private _closeOnInteraction: boolean = false;

  /** 用于通知工具提示被隐藏在视图之外 */
  private readonly _onHide: Subject<any> = new Subject();

  private readonly _onHover: Subject<boolean> = new Subject();

  /** 发送用户是否有一个手机大小的显示。  */
  _isHandset: Observable<BreakpointState> = this._breakpointObserver.observe(Breakpoints.Handset);

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _breakpointObserver: BreakpointObserver) { }

  @HostBinding('style.zoom')
  get styleZoom() {
    return this._visibility === 'visible' ? 1 : null;
  }

  /**
   * 显示popover，其中包含提供的动画
   */
  show(delay: number): void {
    // 清除已存在的定时器
    if (this._hideTimeoutId) {
      clearTimeout(this._hideTimeoutId);
    }

    // 如果显示延迟，主体交互应该取消popover
    this._closeOnInteraction = true;
    this._showTimeoutId = setTimeout(() => {
      this._visibility = 'visible';

      // 标记为检查，因此如果任何父组件已经将 ChangeDetectionStrategy 设置为OnPush，它将被检查
      this._markForCheck();
    }, delay);
  }

  /**
   * 开始动画以后提供的延迟（ms）后隐藏popover。
   */
  hide(delay: number = 1000): void {
    // 清除已存在的定时器
    if (this._showTimeoutId) {
      clearTimeout(this._showTimeoutId);
    }

    this._hideTimeoutId = setTimeout(() => {
      if (this._hideState) {
        this._visibility = 'hidden';

        // 标记为检查，因此如果任何父组件已经将 ChangeDetectionStrategy 设置为OnPush，它将被检查
        this._markForCheck();
      }
    }, delay);
  }

  onMouseEnter() {
    this._hideState = false;
    clearTimeout(this._hideTimeoutId);
    this._onHover.next(true);
  }

  onMouseLeave() {
    this._hideState = true;
    this._onHover.next(false);
  }
  /** 返回一个可观察对象，该对象在popover从视图中隐藏时发出通知 */
  afterHidden(): Observable<void> {
    return this._onHide.asObservable();
  }

  /** 返回一个可观察对象，该对象在popover从视图中 hover 发出通知 */
  hoverToggle(): Observable<boolean> {
    return this._onHover.asObservable();
  }

  /** 是否显示popover */
  isVisible(): boolean {
    return this._visibility === 'visible';
  }

  _animationStart() {
    this._closeOnInteraction = false;
  }

  _animationDone(event: AnimationEvent): void {
    const toState = event.toState as PopoverVisibility;

    if (toState === 'hidden' && !this.isVisible()) {
      this._onHide.next();
    }

    if (toState === 'visible' || toState === 'hidden') {
      this._closeOnInteraction = true;
    }
  }

  /**
   * 标记在下一次变更检测运行中需要检查工具提示。
   * 主要用于在放置工具提示之前呈现初始文本，
   * 这在使用OnPush更改检测的组件中可能存在问题。
   */
  _markForCheck(): void {
    this._changeDetectorRef.markForCheck();
  }

}

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[sim-popover],[simPopover]',
  exportAs: 'simPopover'
})
export class PopoverDirective implements AfterViewInit, OnDestroy {
  element: HTMLElement;
  delayTimer: number;
  _overlayRef: OverlayRef | null;
  _PopoverInstance: PopoverComponent | null;

  private _portal: ComponentPortal<PopoverComponent>;
  private _position: PopoverPosition = 'top';
  private _fallbackPosition: PopoverPosition = null;
  private _disabled: boolean = false;
  private _popoverClass: string | string[] | Set<string> | { [key: string]: any };

  /** 允许用户定义工具提示相对于父元素的位置 */
  @Input()
  get position(): PopoverPosition { return this._position; }
  set position(value: PopoverPosition) {
    if (value !== this._position) {
      // 允许写驼峰，topLeft 允许写中划线 top-left
      this._position = this.camelCase2(value) as PopoverPosition;
      if (this._overlayRef) {
        this._updatePosition();

        if (this._PopoverInstance) {
          this._PopoverInstance.show(0);
        }

        this._overlayRef.updatePosition();
      }
    }
  }

  @Input()
  get trigger(): triggerType { return this._trigger; }
  set trigger(value: triggerType) {
    if (value !== this._trigger) {
      this._trigger = value;
      if (this._overlayRef) {
        this._overlayRef.dispose();
        this._PopoverInstance = null;
      }
      if (this._PopoverInstance) {
        this._PopoverInstance.trigger = value;
        this._PopoverInstance._markForCheck();
      }
      // 如果存在事件监听，先清理构造函数中设置的事件侦听器 防止重复添加
      this.destroyEvent();
      // 重新添加构造函数中设置的事件侦听器
      this.bindEvent();
    }

  }
  _trigger: triggerType = 'hover';

  /** 禁用popover的显示 */
  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value) {
    this._disabled = toBoolean(value);

    // 如果popover被禁用，立即隐藏。
    if (this._disabled) {
      this.hide(0);
    }
  }

  /** 调用 show 后显示 popover 之前的默认延迟 */
  @Input() showDelay = this._defaultOptions.showDelay;

  /** 调用 hide 后隐藏 popover 之前的默认延迟 */
  @Input() hideDelay = this._defaultOptions.hideDelay;


  _message: TemplateRef<void>;
  /** 要在popover中显示的消息 */
  @Input()
  get message() { return this._message; }
  set message(value: any) {
    this._message = value;
    this._updatePopoverMessage();
  }

  /** 要传递到popover的类。支持与“ngClass”相同的语法 */
  @Input()
  get overlayClass() { return this._popoverClass; }
  set overlayClass(value: string | string[] | Set<string> | { [key: string]: any }) {
    this._popoverClass = value;
    if (this._PopoverInstance) {
      this._setPopoverClass(this._popoverClass);
    }
  }

  private _manualListeners = new Map<string, Function>();

  /** 当组件被销毁时发出 */
  private readonly _destroyed = new Subject<void>();

  constructor(
    private _overlay: Overlay,
    private _elementRef: ElementRef,
    private _scrollDispatcher: ScrollDispatcher,
    private _viewContainerRef: ViewContainerRef,
    private _ngZone: NgZone,
    private _platform: Platform,
    @Inject(SIM_POPOVER_SCROLL_STRATEGY) private _scrollStrategy,
    @Optional() @Inject(SIM_POPOVER_DEFAULT_OPTIONS)
    private _defaultOptions: SimPopoverDefaultOptions
  ) {
    this.element = _elementRef.nativeElement;
  }

  ngAfterViewInit() {
    this.bindEvent();
    if (this.element.nodeName === 'INPUT' || this.element.nodeName === 'TEXTAREA') {
      // 当我们在一个元素上绑定一个手势事件（在这种情况下是`longpress`）时，
      // 默认情况下HammerJS会添加一些内联样式，包括`user-select：none`。
      // 这在iOS上存在问题，因为它会阻止用户输入输入。
      // 如果我们在iOS上并且工具提示附加在输入或textarea上，我们清除`user-select`以避免这些问题。
      this.element.style.webkitUserSelect = this.element.style.userSelect = '';
    }
  }

  ngOnDestroy() {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._PopoverInstance = null;
    }

    this.destroyEvent();

    this._destroyed.next();
    this._destroyed.complete();
  }

  private bindEvent() {
    if (!this._platform.IOS) {
      switch (this.trigger) {
        case 'hover':
          this._manualListeners.set('mouseenter', () => this.delayEnterLeave(true, true, 0.15));
          this._manualListeners.set('mouseleave', () => this.delayEnterLeave(true, false, 0.1));
          break;
        case 'focus':
          this._manualListeners.set('focus', () => this.show());
          this._manualListeners.set('blur', () => this.hide());
          break;
        case 'click':
          this._manualListeners.set('click', (e: Event) => {
            e.preventDefault();
            this.show();
          });
          break;
        default:
          throw Error(`${this.trigger} is not 'hover' | 'focus' | 'click'`);
      }
      this._manualListeners.forEach((listener, event) => this._elementRef.nativeElement.addEventListener(event, listener));
    }
  }

  private destroyEvent() {
    // 清理构造函数中设置的事件侦听器
    if (!this._platform.IOS) {
      this._manualListeners.forEach((listener, event) =>
        this._elementRef.nativeElement.removeEventListener(event, listener));

      this._manualListeners.clear();
    }
  }

  private delayEnterLeave(isOrigin: boolean, isEnter: boolean, delay: number = -1): void {
    if (this.delayTimer) { // Clear timer during the delay time
      window.clearTimeout(this.delayTimer);
      this.delayTimer = null;
    } else if (delay > 0) {
      this.delayTimer = window.setTimeout(() => {
        this.delayTimer = null;
        isEnter ? this.show() : this.hide();
      }, delay * 1000);
    } else {
      isEnter && isOrigin ? this.show() : this.hide();
    }
  }

  /** 在delay ms 后显示 popover，默认为popover延迟显示，如果没有输入则显示为0ms */
  @HostListener('longpress', [])
  show(delay: number = this.showDelay): void {
    if (this.disabled || !this.message) { return; }

    const overlayRef = this._createOverlay();

    this._detach();
    this._portal = this._portal || new ComponentPortal(PopoverComponent, this._viewContainerRef);
    this._PopoverInstance = overlayRef.attach(this._portal).instance;
    this._PopoverInstance.trigger = this.trigger;
    this._PopoverInstance.afterHidden()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._detach());
    this._PopoverInstance.hoverToggle()
      .pipe(takeUntil(this._destroyed))
      .subscribe((hover) => {
        if (hover) {
          this.delayEnterLeave(false, true);
        } else {
          this.delayEnterLeave(false, false);
        }
      });
    this._setPopoverClass(this._popoverClass);
    this._updatePopoverMessage();
    this._PopoverInstance.show(delay);
  }

  /** delay ms 后隐藏 popover，默认为popover延迟隐藏，如果没有输入则默认为0ms */
  hide(delay: number = this.hideDelay): void {
    if (this._PopoverInstance) {
      this._PopoverInstance.hide(delay);
    }
  }

  /** 切换显示隐藏 */
  toggle(): void {
    this._isPopoverVisible() ? this.hide() : this.show();
  }

  /** 如果popover当前对用户可见，则返回true */
  _isPopoverVisible(): boolean {
    return !!this._PopoverInstance && this._PopoverInstance.isVisible();
  }

  /** 处理宿主元素上的keydown事件 */
  @HostListener('keydown', ['$event'])
  _handleKeydown(e: KeyboardEvent) {
    if (this._isPopoverVisible() && e.keyCode === ESCAPE) {
      e.stopPropagation();
      this.hide(0);
    }
  }

  /** 处理宿主元素上的touchend事件 */
  @HostListener('touchend', [])
  _handleTouchend() {
    this.hide(this._defaultOptions.touchendHideDelay);
  }

  /** 创建覆盖配置和位置策略 */
  _createOverlay(): OverlayRef {
    if (this._overlayRef) {
      return this._overlayRef;
    }

    const origin = this._getOriginAndOverlayPosition().origin;
    const overlay = this._getOriginAndOverlayPosition().overlay;
    // 创建连接位置策略，侦听要重新定位的滚动事件。
    const strategy = this._overlay.position()
      .flexibleConnectedTo(this._elementRef)
      .withFlexibleDimensions(false)
      .withViewportMargin(8)
      .withPositions([
        { ...origin.main, ...overlay.main },
        { ...origin.fallback, ...overlay.fallback }
      ]);

    const scrollableAncestors = this._scrollDispatcher.getAncestorScrollContainers(this._elementRef);

    strategy.withScrollableContainers(scrollableAncestors);

    strategy.positionChanges.pipe(takeUntil(this._destroyed)).subscribe(change => {
      if (this._PopoverInstance) {
        if (change.scrollableViewProperties.isOverlayClipped && this._PopoverInstance.isVisible()) {
          // 当位置发生变化，覆盖被父滚动器剪切后，关闭popover。
          this._ngZone.run(() => this.hide(0));
        }
        const { overlayX, overlayY } = change.connectionPair;
        const position = this._PopoverInstance.position;
        if (overlayX !== position[0] || overlayY !== position[1]) {
          this._PopoverInstance.position = [overlayX, overlayY];
          this._PopoverInstance.positionClass = this.getPositionClass(!!position.length);
          this._PopoverInstance._markForCheck();
        }
      }
    });

    this._overlayRef = this._overlay.create({
      hasBackdrop: this.trigger === 'click',
      backdropClass: '',
      positionStrategy: strategy,
      panelClass: 'sim-popover-panel',
      scrollStrategy: this._scrollStrategy()
    });

    this._overlayRef.detachments()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._detach());

    this._overlayRef.backdropClick()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => {
      if (this._isPopoverVisible()) {
        this._ngZone.run(() => this.hide(0));
      }
    });

    return this._overlayRef;
  }

  /** 获取方向class */
  private getPositionClass(fallback?: boolean): string[] {
    if (fallback) {
      if (/^left/.test(this._fallbackPosition)) {
        this._fallbackPosition = this._fallbackPosition.replace('left', 'right') as PopoverPosition;
      } else if (/^right/.test(this._fallbackPosition)) {
        this._fallbackPosition = this._fallbackPosition.replace('right', 'left') as PopoverPosition;
      } else if (/^top/.test(this._fallbackPosition)) {
        this._fallbackPosition = this._fallbackPosition.replace('top', 'bottom') as PopoverPosition;
      } else if (/^bottom/.test(this._fallbackPosition)) {
        this._fallbackPosition = this._fallbackPosition.replace('bottom', 'top') as PopoverPosition;
      }
    } else {
      this._fallbackPosition = this.position;
    }
    const withPositions = this._fallbackPosition.split('-');
    const placement = withPositions[1] ? this._fallbackPosition : 'center';
    return [withPositions[0], placement];
  }

  /** 分离当前附加的popover */
  _detach() {
    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }

    this._PopoverInstance = null;
  }

  /** 更新当前popover的位置 */
  private _updatePosition() {
    const position = this._overlayRef.getConfig().positionStrategy as FlexibleConnectedPositionStrategy;
    const origin = this._getOriginAndOverlayPosition().origin;
    const overlay = this._getOriginAndOverlayPosition().overlay;

    position.withPositions([
      { ...origin.main, ...overlay.main },
      { ...origin.fallback, ...overlay.fallback  }
    ]);
  }


  _getOriginAndOverlayPosition(): {
    origin: { main: OriginConnectionPosition, fallback: OriginConnectionPosition }
    overlay: { main: OverlayConnectionPosition, fallback: OverlayConnectionPosition }
  } {
    const position = POSITION_MAP[this.camelCase(this.position)];
    if (!position) {
      // 如果用户提供了无效的popover位置，则创建要引发的错误
      throw Error(`Popover position "${position}" is invalid.`);
    }
    const originPosition: OriginConnectionPosition = { originX: position.originX, originY: position.originY };
    const overlayPosition: OverlayConnectionPosition = { overlayX: position.overlayX, overlayY: position.overlayY };
    const { x: originX, y: originY } = this._invertPosition(originPosition.originX, originPosition.originY);
    const { x: overlayX, y: overlayY } = this._invertPosition(overlayPosition.overlayX, overlayPosition.overlayY);
    return {
      origin: {
        main: originPosition,
        fallback: { originX, originY }
      },
      overlay: {
        main: overlayPosition,
        fallback: { overlayX, overlayY }
      }
    };
  }

  /** 中划线转驼峰 */
  private camelCase(str: string): string {
    return str.replace(/^-/, '').replace(/-([\da-z])/gi, (...args) => args[1].toUpperCase());
  }

  /** 驼峰转中划线 */
  private camelCase2(str: string): string {
    return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase();
  }

  /** 更新popover消息，并根据新的消息长度重新定位覆盖 */
  private _updatePopoverMessage() {
    // 必须等待消息被绘制到popover，以便覆盖可以根据文本的大小正确计算正确的位置。
    if (this._PopoverInstance) {
      this._PopoverInstance.message = this.message;
      this._PopoverInstance._markForCheck();

      this._ngZone.onMicrotaskEmpty.asObservable().pipe(
        take(1),
        takeUntil(this._destroyed)
      ).subscribe(() => {
        if (this._PopoverInstance) {
          this._overlayRef.updatePosition();
        }
      });
    }
  }

  /** 更新popover class */
  private _setPopoverClass(PopoverClass: string | string[] | Set<string> | { [key: string]: any }) {
    if (this._PopoverInstance) {
      this._PopoverInstance.overlayClass = PopoverClass;
      this._PopoverInstance._markForCheck();
    }
  }

  /** 反转叠加位置 */
  private _invertPosition(x: HorizontalConnectionPos, y: VerticalConnectionPos) {
    if (/^(top|bottom)/.test(this.position)) {
      if (y === 'top') {
        y = 'bottom';
      } else if (y === 'bottom') {
        y = 'top';
      }
    } else {
      if (x === 'end') {
        x = 'start';
      } else if (x === 'start') {
        x = 'end';
      }
    }
    return { x, y };
  }

}

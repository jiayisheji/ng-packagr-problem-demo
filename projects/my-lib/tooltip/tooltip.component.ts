import {
  Component,
  OnInit,
  Directive,
  HostListener,
  ElementRef,
  ViewContainerRef,
  NgZone,
  Input,
  InjectionToken,
  inject,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Inject,
  Optional,
  HostBinding
} from '@angular/core';
import {
  Overlay,
  ScrollDispatcher,
  OverlayRef,
  ScrollStrategy,
  FlexibleConnectedPositionStrategy,
  OriginConnectionPosition,
  OverlayConnectionPosition,
  HorizontalConnectionPos,
  VerticalConnectionPos
} from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';
import { AriaDescriber, FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { Subject, Observable } from 'rxjs';
import { toBoolean } from 'simple-ui/core';
import { takeUntil, take } from 'rxjs/operators';
import { ComponentPortal } from '@angular/cdk/portal';
import { simTooltipAnimations } from './tooltip-animations';
import { AnimationEvent } from '@angular/animations';
import { BreakpointState, Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { ESCAPE } from '@angular/cdk/keycodes';


export type TooltipPosition = 'left' | 'right' | 'above' | 'below' | 'before' | 'after';

/** Time in ms to throttle repositioning after scroll events. */
export const SCROLL_THROTTLE_MS = 20;

/** CSS class that will be attached to the overlay panel. */
export const TOOLTIP_PANEL_CLASS = 'sim-tooltip-panel';

/** Creates an error to be thrown if the user supplied an invalid tooltip position. */
export function getMatTooltipInvalidPositionError(position: string) {
  return Error(`Tooltip position "${position}" is invalid.`);
}

/** Injection token that determines the scroll handling while a tooltip is visible. */
export const SIM_TOOLTIP_SCROLL_STRATEGY =
  new InjectionToken<() => ScrollStrategy>('sim-tooltip-scroll-strategy', {
    providedIn: 'root',
    factory: SIM_TOOLTIP_SCROLL_STRATEGY_FACTORY,
  });

/** @docs-private */
export function SIM_TOOLTIP_SCROLL_STRATEGY_FACTORY(): () => ScrollStrategy {
  const overlay = inject(Overlay);
  return () => overlay.scrollStrategies.reposition({ scrollThrottle: SCROLL_THROTTLE_MS });
}

/** Default `matTooltip` options that can be overridden. */
export interface SimTooltipDefaultOptions {
  showDelay: number;
  hideDelay: number;
  touchendHideDelay: number;
}

/** Injection token to be used to override the default options for `matTooltip`. */
export const SIM_TOOLTIP_DEFAULT_OPTIONS =
  new InjectionToken<SimTooltipDefaultOptions>('sim-tooltip-default-options', {
    providedIn: 'root',
    factory: SIM_TOOLTIP_DEFAULT_OPTIONS_FACTORY
  });

export function SIM_TOOLTIP_DEFAULT_OPTIONS_FACTORY(): SimTooltipDefaultOptions {
  return {
    showDelay: 0,
    hideDelay: 0,
    touchendHideDelay: 1500,
  };
}

export type TooltipVisibility = 'initial' | 'visible' | 'hidden';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [simTooltipAnimations.tooltipState]
})
export class TooltipComponent {
  /** 显示在工具提示中的消息 */
  message: string;

  /** 要添加到工具提示中的类。支持与“ngClass”相同的语法。 */
  overlayClass: string | string[] | Set<string> | { [key: string]: any };

  /** 显示工具提示的当前计时器的超时ID */
  _showTimeoutId;

  /** 任何当前定时器设置的超时ID，以隐藏工具提示。 */
  _hideTimeoutId;

  /** 由动画框架观看以显示或隐藏工具提示的属性。 */
  _visibility: TooltipVisibility = 'initial';

  /** 页面上的交互是否应该关闭工具提示 */
  private _closeOnInteraction = false;

  /** 用于通知工具提示被隐藏在视图之外 */
  private readonly _onHide: Subject<any> = new Subject();

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
   * Shows the tooltip with an animation originating from the provided origin
   * @param delay Amount of milliseconds to the delay showing the tooltip.
   */
  show(delay: number): void {
    // Cancel the delayed hide if it is scheduled
    if (this._hideTimeoutId) {
      clearTimeout(this._hideTimeoutId);
    }

    // Body interactions should cancel the tooltip if there is a delay in showing.
    this._closeOnInteraction = true;
    this._showTimeoutId = setTimeout(() => {
      this._visibility = 'visible';

      // Mark for check so if any parent component has set the
      // ChangeDetectionStrategy to OnPush it will be checked anyways
      this._markForCheck();
    }, delay);
  }

  /**
   * Begins the animation to hide the tooltip after the provided delay in ms.
   * @param delay Amount of milliseconds to delay showing the tooltip.
   */
  hide(delay: number): void {
    // Cancel the delayed show if it is scheduled
    if (this._showTimeoutId) {
      clearTimeout(this._showTimeoutId);
    }

    this._hideTimeoutId = setTimeout(() => {
      this._visibility = 'hidden';

      // Mark for check so if any parent component has set the
      // ChangeDetectionStrategy to OnPush it will be checked anyways
      this._markForCheck();
    }, delay);
  }

  /** Returns an observable that notifies when the tooltip has been hidden from view. */
  afterHidden(): Observable<void> {
    return this._onHide.asObservable();
  }

  /** Whether the tooltip is being displayed. */
  isVisible(): boolean {
    return this._visibility === 'visible';
  }

  _animationStart() {
    this._closeOnInteraction = false;
  }

  _animationDone(event: AnimationEvent): void {
    const toState = event.toState as TooltipVisibility;

    if (toState === 'hidden' && !this.isVisible()) {
      this._onHide.next();
    }

    if (toState === 'visible' || toState === 'hidden') {
      this._closeOnInteraction = true;
    }
  }

  /**
   * HTML主体上的交互应该按照材料设计规范中定义的那样立即关闭工具提示。
   */
  @HostListener('body:click')
  _handleBodyInteraction(): void {
    if (this._closeOnInteraction) {
      this.hide(0);
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


/**
 * 工具提示附加到主元素的指令。动画显示和隐藏工具提示提供的位置(默认为元素下面)。
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[sim-tooltip],[simTooltip]',
  exportAs: 'simTooltip'
})
export class TooltipDirective implements OnDestroy {
  _overlayRef: OverlayRef | null;
  _tooltipInstance: TooltipComponent | null;

  _portal: ComponentPortal<TooltipComponent>;
  private _position: TooltipPosition = 'below';
  private _disabled = false;
  private _tooltipClass: string | string[] | Set<string> | { [key: string]: any };

  /** Allows the user to define the position of the tooltip relative to the parent element */
  @Input()
  get position(): TooltipPosition { return this._position; }
  set position(value: TooltipPosition) {
    if (value !== this._position) {
      this._position = value;

      if (this._overlayRef) {
        this._updatePosition();

        if (this._tooltipInstance) {
          this._tooltipInstance.show(0);
        }

        this._overlayRef.updatePosition();
      }
    }
  }

  /** Disables the display of the tooltip. */
  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value) {
    this._disabled = toBoolean(value);

    // If tooltip is disabled, hide immediately.
    if (this._disabled) {
      this.hide(0);
    }
  }

  /** The default delay in ms before showing the tooltip after show is called */
  @Input() showDelay = this._defaultOptions.showDelay;

  /** The default delay in ms before hiding the tooltip after hide is called */
  @Input() hideDelay = this._defaultOptions.hideDelay;

  private _message = '';

  /** The message to be displayed in the tooltip */
  @Input()
  get message() { return this._message; }
  set message(value: string) {
    this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this._message);

    // If the message is not a string (e.g. number), convert it to a string and trim it.
    this._message = value != null ? `${value}`.trim() : '';

    if (!this._message && this._isTooltipVisible()) {
      this.hide(0);
    } else {
      this._updateTooltipMessage();
      this._ariaDescriber.describe(this._elementRef.nativeElement, this.message);
    }
  }

  /** Classes to be passed to the tooltip. Supports the same syntax as `ngClass`. */
  @Input()
  get overlayClass() { return this._tooltipClass; }
  set overlayClass(value: string | string[] | Set<string> | { [key: string]: any }) {
    this._tooltipClass = value;
    if (this._tooltipInstance) {
      this._setTooltipClass(this._tooltipClass);
    }
  }

  private _manualListeners = new Map<string, Function>();

  /** Emits when the component is destroyed. */
  private readonly _destroyed = new Subject<void>();

  constructor(
    private _overlay: Overlay,
    private _elementRef: ElementRef,
    private _scrollDispatcher: ScrollDispatcher,
    private _viewContainerRef: ViewContainerRef,
    private _ngZone: NgZone,
    private _platform: Platform,
    private _ariaDescriber: AriaDescriber,
    private _focusMonitor: FocusMonitor,
    @Inject(SIM_TOOLTIP_SCROLL_STRATEGY) private _scrollStrategy,
    @Optional() private _dir: Directionality,
    @Optional() @Inject(SIM_TOOLTIP_DEFAULT_OPTIONS)
    private _defaultOptions: SimTooltipDefaultOptions) {

    const element: HTMLElement = _elementRef.nativeElement;

    // The mouse events shouldn't be bound on iOS devices, because
    // they can prevent the first tap from firing its click event.
    if (!_platform.IOS) {
      this._manualListeners.set('mouseenter', () => this.show());
      this._manualListeners.set('mouseleave', () => this.hide());

      this._manualListeners
        .forEach((listener, event) => _elementRef.nativeElement.addEventListener(event, listener));
    } else if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
      // When we bind a gesture event on an element (in this case `longpress`), HammerJS
      // will add some inline styles by default, including `user-select: none`. This is
      // problematic on iOS, because it will prevent users from typing in inputs. If
      // we're on iOS and the tooltip is attached on an input or textarea, we clear
      // the `user-select` to avoid these issues.
      element.style.webkitUserSelect = element.style.userSelect = '';
    }

    _focusMonitor.monitor(element).pipe(takeUntil(this._destroyed)).subscribe(origin => {
      // Note that the focus monitor runs outside the Angular zone.
      if (!origin) {
        _ngZone.run(() => this.hide(0));
      } else if (origin !== 'program') {
        _ngZone.run(() => this.show());
      }
    });
  }

  /**
   * Dispose the tooltip when destroyed.
   */
  ngOnDestroy() {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._tooltipInstance = null;
    }

    // Clean up the event listeners set in the constructor
    if (!this._platform.IOS) {
      this._manualListeners.forEach((listener, event) =>
        this._elementRef.nativeElement.removeEventListener(event, listener));

      this._manualListeners.clear();
    }

    this._destroyed.next();
    this._destroyed.complete();

    this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this.message);
    this._focusMonitor.stopMonitoring(this._elementRef.nativeElement);
  }

  /** Shows the tooltip after the delay in ms, defaults to tooltip-delay-show or 0ms if no input */
  @HostListener('longpress', [])
  show(delay: number = this.showDelay): void {
    if (this.disabled || !this.message) { return; }

    const overlayRef = this._createOverlay();

    this._detach();
    this._portal = this._portal || new ComponentPortal(TooltipComponent, this._viewContainerRef);
    this._tooltipInstance = overlayRef.attach(this._portal).instance;
    this._tooltipInstance.afterHidden()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._detach());
    this._setTooltipClass(this._tooltipClass);
    this._updateTooltipMessage();
    this._tooltipInstance.show(delay);
  }

  /** Hides the tooltip after the delay in ms, defaults to tooltip-delay-hide or 0ms if no input */
  hide(delay: number = this.hideDelay): void {
    if (this._tooltipInstance) {
      this._tooltipInstance.hide(delay);
    }
  }

  /** Shows/hides the tooltip */
  toggle(): void {
    this._isTooltipVisible() ? this.hide() : this.show();
  }

  /** Returns true if the tooltip is currently visible to the user */
  _isTooltipVisible(): boolean {
    return !!this._tooltipInstance && this._tooltipInstance.isVisible();
  }

  /** Handles the keydown events on the host element. */
  @HostListener('keydown', ['$event'])
  _handleKeydown(e: KeyboardEvent) {
    if (this._isTooltipVisible() && e.keyCode === ESCAPE) {
      e.stopPropagation();
      this.hide(0);
    }
  }

  /** Handles the touchend events on the host element. */
  @HostListener('touchend', [])
  _handleTouchend() {
    this.hide(this._defaultOptions.touchendHideDelay);
  }

  /** Create the overlay config and position strategy */
  _createOverlay(): OverlayRef {
    if (this._overlayRef) {
      return this._overlayRef;
    }

    const origin = this._getOrigin();
    const overlay = this._getOverlayPosition();
    const direction = this._dir ? this._dir.value : 'ltr';

    // Create connected position strategy that listens for scroll events to reposition.
    const strategy = this._overlay.position()
      .flexibleConnectedTo(this._elementRef)
      .withFlexibleDimensions(false)
      .withViewportMargin(8)
      .withPositions([
        { ...origin.main, ...overlay.main },
        { ...origin.fallback, ...overlay.fallback }
      ]);

    const scrollableAncestors = this._scrollDispatcher
      .getAncestorScrollContainers(this._elementRef);

    strategy.withScrollableContainers(scrollableAncestors);

    strategy.positionChanges.pipe(takeUntil(this._destroyed)).subscribe(change => {
      if (this._tooltipInstance) {
        if (change.scrollableViewProperties.isOverlayClipped && this._tooltipInstance.isVisible()) {
          // After position changes occur and the overlay is clipped by
          // a parent scrollable then close the tooltip.
          this._ngZone.run(() => this.hide(0));
        }
      }
    });

    this._overlayRef = this._overlay.create({
      direction,
      positionStrategy: strategy,
      panelClass: TOOLTIP_PANEL_CLASS,
      scrollStrategy: this._scrollStrategy()
    });

    this._overlayRef.detachments()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._detach());

    return this._overlayRef;
  }

  /** Detaches the currently-attached tooltip. */
  _detach() {
    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }

    this._tooltipInstance = null;
  }

  /** Updates the position of the current tooltip. */
  private _updatePosition() {
    const position =
      this._overlayRef.getConfig().positionStrategy as FlexibleConnectedPositionStrategy;
    const origin = this._getOrigin();
    const overlay = this._getOverlayPosition();

    position
      .withPositions([
        { ...origin.main, ...overlay.main },
        { ...origin.fallback, ...overlay.fallback }
      ]);
  }

  /**
   * Returns the origin position and a fallback position based on the user's position preference.
   * The fallback position is the inverse of the origin (e.g. `'below' -> 'above'`).
   */
  _getOrigin(): { main: OriginConnectionPosition, fallback: OriginConnectionPosition } {
    const isLtr = !this._dir || this._dir.value === 'ltr';
    const position = this.position;
    let originPosition: OriginConnectionPosition;

    if (position === 'above' || position === 'below') {
      originPosition = { originX: 'center', originY: position === 'above' ? 'top' : 'bottom' };
    } else if (
      position === 'before' ||
      (position === 'left' && isLtr) ||
      (position === 'right' && !isLtr)) {
      originPosition = { originX: 'start', originY: 'center' };
    } else if (
      position === 'after' ||
      (position === 'right' && isLtr) ||
      (position === 'left' && !isLtr)) {
      originPosition = { originX: 'end', originY: 'center' };
    } else {
      throw getMatTooltipInvalidPositionError(position);
    }

    const { x, y } = this._invertPosition(originPosition.originX, originPosition.originY);

    return {
      main: originPosition,
      fallback: { originX: x, originY: y }
    };
  }

  /** Returns the overlay position and a fallback position based on the user's preference */
  _getOverlayPosition(): { main: OverlayConnectionPosition, fallback: OverlayConnectionPosition } {
    const isLtr = !this._dir || this._dir.value === 'ltr';
    const position = this.position;
    let overlayPosition: OverlayConnectionPosition;

    if (position === 'above') {
      overlayPosition = { overlayX: 'center', overlayY: 'bottom' };
    } else if (position === 'below') {
      overlayPosition = { overlayX: 'center', overlayY: 'top' };
    } else if (
      position === 'before' ||
      (position === 'left' && isLtr) ||
      (position === 'right' && !isLtr)) {
      overlayPosition = { overlayX: 'end', overlayY: 'center' };
    } else if (
      position === 'after' ||
      (position === 'right' && isLtr) ||
      (position === 'left' && !isLtr)) {
      overlayPosition = { overlayX: 'start', overlayY: 'center' };
    } else {
      throw getMatTooltipInvalidPositionError(position);
    }

    const { x, y } = this._invertPosition(overlayPosition.overlayX, overlayPosition.overlayY);

    return {
      main: overlayPosition,
      fallback: { overlayX: x, overlayY: y }
    };
  }

  /** Updates the tooltip message and repositions the overlay according to the new message length */
  private _updateTooltipMessage() {
    // Must wait for the message to be painted to the tooltip so that the overlay can properly
    // calculate the correct positioning based on the size of the text.
    if (this._tooltipInstance) {
      this._tooltipInstance.message = this.message;
      this._tooltipInstance._markForCheck();

      this._ngZone.onMicrotaskEmpty.asObservable().pipe(
        take(1),
        takeUntil(this._destroyed)
      ).subscribe(() => {
        if (this._tooltipInstance) {
          this._overlayRef.updatePosition();
        }
      });
    }
  }

  /** Updates the tooltip class */
  private _setTooltipClass(tooltipClass: string | string[] | Set<string> | { [key: string]: any }) {
    if (this._tooltipInstance) {
      this._tooltipInstance.overlayClass = tooltipClass;
      this._tooltipInstance._markForCheck();
    }
  }

  /** Inverts an overlay position. */
  private _invertPosition(x: HorizontalConnectionPos, y: VerticalConnectionPos) {
    if (this.position === 'above' || this.position === 'below') {
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

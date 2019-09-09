import { LiveAnnouncer } from '@angular/cdk/a11y';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType, PortalInjector, TemplatePortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  EmbeddedViewRef,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  Optional,
  SkipSelf,
  TemplateRef,
} from '@angular/core';
import { MessageComponent } from './message/message.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { NotificationComponent } from './notification/notification.component';
import { SIM_TOAST_DATA, SimToastConfig } from './toast-config';
import { ToastComponent } from './toast.component';
import { SimToastRef } from './toast-ref';
import { takeUntil, take } from 'rxjs/operators';
export type ConfirmType = 'info' | 'warning' | 'success' | 'danger' | 'primary';
export type ToastType = 'info' | 'warning' | 'success' | 'danger' | 'loading' | 'blank';

@Injectable()
export class SimToastService {
  /**
   * Reference to the current snack bar in the view *at this level* (in the Angular injector tree).
   * If there is a parent snack-bar service, all operations should delegate to that parent
   * via `_openedSnackBarRef`.
   */
  private _snackBarRefAtThisLevel: SimToastRef<any> | null = null;

  /** Reference to the currently opened snackbar at *any* level. */
  get _openedSnackBarRef(): SimToastRef<any> | null {
    const parent = this._parentSnackBar;
    return parent ? parent._openedSnackBarRef : this._snackBarRefAtThisLevel;
  }

  set _openedSnackBarRef(value: SimToastRef<any> | null) {
    if (this._parentSnackBar) {
      this._parentSnackBar._openedSnackBarRef = value;
    } else {
      this._snackBarRefAtThisLevel = value;
    }
  }

  constructor(
    private _overlay: Overlay,
    private _live: LiveAnnouncer,
    private _injector: Injector,
    private _breakpointObserver: BreakpointObserver,
    @Optional() @SkipSelf() private _parentSnackBar: SimToastService) { }

  /**
   * Creates and dispatches a snack bar with a custom component for the content, removing any
   * currently opened snack bars.
   *
   * @param component Component to be instantiated.
   * @param config Extra configuration for the snack bar.
   */
  openFromComponent<T>(component: ComponentType<T>, config?: SimToastConfig): SimToastRef<T> {
    const _config = _applyConfigDefaults(config);
    const snackBarRef = this._attach(component, _config);

    // When the snackbar is dismissed, clear the reference to it.
    snackBarRef.afterDismissed().subscribe(() => {
      // Clear the snackbar ref if it hasn't already been replaced by a newer snackbar.
      if (this._openedSnackBarRef === snackBarRef) {
        this._openedSnackBarRef = null;
      }
    });

    if (this._openedSnackBarRef) {
      // If a snack bar is already in view, dismiss it and enter the
      // new snack bar after exit animation is complete.
      this._openedSnackBarRef.afterDismissed().subscribe(() => {
        snackBarRef.containerInstance.enter();
      });
      this._openedSnackBarRef.dismiss();
    } else {
      // If no snack bar is in view, enter the new snack bar.
      snackBarRef.containerInstance.enter();
    }

    // If a dismiss timeout is provided, set up dismiss based on after the snackbar is opened.
    if (_config.duration && _config.duration > 0) {
      snackBarRef.afterOpened().subscribe(() => snackBarRef._dismissAfter(_config.duration));
    }

    if (_config.announcementMessage) {
      this._live.announce(_config.announcementMessage, _config.politeness);
    }

    this._openedSnackBarRef = snackBarRef;
    return this._openedSnackBarRef;
  }

  /**
   * Opens a snackbar with a message and an optional action.
   * @param message The message to show in the snackbar.
   * @param action The label for the snackbar action.
   * @param config Additional configuration options for the snackbar.
   */
  /*   open(message: string, action: string = '', config?: SimToastConfig):
      SimToastRef<SimpleSnackBar> {
      const _config = _applyConfigDefaults(config);

      // Since the user doesn't have access to the component, we can
      // override the data to pass in our own message and action.
      _config.data = { message, action };
      _config.announcementMessage = message;

      return this.openFromComponent(SimpleSnackBar, _config);
    } */

  confirm(message: string,
    actions: {
      confirm: string,
      cancel: string,
      confirmType: ConfirmType,
      title: string
    } = {
        confirm: '确定',
        cancel: '取消',
        confirmType: 'primary',
        title: '提示',
    }, config?: SimToastConfig): SimToastRef<ConfirmComponent> {
    const _config = _applyConfigDefaults(config);
    // Since the user doesn't have access to the component, we can
    // override the data to pass in our own message and action.
    _config.data = { message, actions };
    _config.announcementMessage = message;
    _config.verticalPosition = 'center';
    return this.openFromComponent(ConfirmComponent, _config);
  }

  message(message: string, type: ToastType = 'info', config?: SimToastConfig): SimToastRef<MessageComponent> {
    const _config = _applyConfigDefaults(config);
    if (type === 'success') {
      _config.duration = 1800;
    }
    if (type === 'info' || type === 'warning' || type === 'blank') {
      _config.duration = 2500;
    }
    if (type === 'danger') {
      _config.duration = 3000;
    }
    if (type === 'loading') {
      _config.duration = 0;
    }
    // Since the user doesn't have access to the component, we can
    // override the data to pass in our own message and action.
    _config.data = { message, type };
    _config.announcementMessage = message;
    _config.verticalPosition = 'top';
    return this.openFromComponent(MessageComponent, _config);
  }

  notification(
    title: string, content: string | TemplateRef<{}>,
    type: ToastType | '' = '',
    config?: SimToastConfig
  ): SimToastRef<NotificationComponent> {
    const _config = _applyConfigDefaults(config);
    type = type || 'blank';
    // Since the user doesn't have access to the component, we can
    // override the data to pass in our own message and action.
    if (type === 'success') {
      _config.duration = 3600;
    }
    if (type === 'info' || type === 'warning' || type === 'blank') {
      _config.duration = 5000;
    }
    if (type === 'danger') {
      _config.duration = 6000;
    }
    if (type === 'loading') {
      throw Error('notification not type loading');
    }

    if (!['top', 'bottom'].includes(_config.verticalPosition)) {
      _config.verticalPosition = 'top';
    }
    if (!['left', 'right', 'start', 'end'].includes(_config.horizontalPosition)) {
      _config.horizontalPosition = 'right';
    }
    const state = _config.horizontalPosition === 'right' ? 'enterLeft' : 'enterRight';
    console.log(_config);
    _config.data = { title, content, type, state };
    _config.announcementMessage = title;

    return this.openFromComponent(NotificationComponent, _config);
  }


  /**
   * Dismisses the currently-visible snack bar.
   */
  dismiss(): void {
    if (this._openedSnackBarRef) {
      this._openedSnackBarRef.dismiss();
    }
  }

  /**
   * Attaches the snack bar container component to the overlay.
   */
  private _attachSnackBarContainer(overlayRef: OverlayRef,
    config: SimToastConfig): ToastComponent {
    const containerPortal = new ComponentPortal(ToastComponent, config.viewContainerRef);
    const containerRef: ComponentRef<ToastComponent> = overlayRef.attach(containerPortal);
    containerRef.instance.simToastConfig = config;
    return containerRef.instance;
  }

  /**
   * Places a new component as the content of the snack bar container.
   */
  private _attach<T>(component: ComponentType<T>, config: SimToastConfig): SimToastRef<T> {
    const overlayRef = this._createOverlay(config);
    const container = this._attachSnackBarContainer(overlayRef, config);
    const snackBarRef = new SimToastRef<T>(container, overlayRef);
    const injector = this._createInjector(config, snackBarRef);
    const portal = new ComponentPortal(component, undefined, injector);
    const contentRef = container.attachComponentPortal(portal);

    // We can't pass this via the injector, because the injector is created earlier.
    snackBarRef.instance = contentRef.instance;

    // Subscribe to the breakpoint observer and attach the mat-snack-bar-handset class as
    // appropriate. This class is applied to the overlay element because the overlay must expand to
    // fill the width of the screen for full width snackbars.
    this._breakpointObserver.observe(Breakpoints.Handset).pipe(takeUntil(overlayRef.detachments().pipe(take(1)))).subscribe(state => {
      if (state.matches) {
        overlayRef.overlayElement.classList.add('sim-toast-handset');
      } else {
        overlayRef.overlayElement.classList.remove('sim-toast-handset');
      }
    });

    return snackBarRef;
  }

  /**
   * Creates a new overlay and places it in the correct location.
   * @param config The user-specified snack bar config.
   */
  private _createOverlay(config: SimToastConfig): OverlayRef {
    const overlayConfig = new OverlayConfig();
    overlayConfig.direction = config.direction;

    const positionStrategy = this._overlay.position().global();
    // Set horizontal position.
    const isRtl = config.direction === 'rtl';
    const isLeft = (
      config.horizontalPosition === 'left' ||
      (config.horizontalPosition === 'start' && !isRtl) ||
      (config.horizontalPosition === 'end' && isRtl));
    const isRight = !isLeft && config.horizontalPosition !== 'center';
    if (isLeft) {
      positionStrategy.left('0');
    } else if (isRight) {
      positionStrategy.right('0');
    } else {
      positionStrategy.centerHorizontally();
    }
    // Set horizontal position.
    if (config.verticalPosition === 'top') {
      positionStrategy.top('0');
    } else if (config.verticalPosition === 'bottom') {
      positionStrategy.bottom('0');
    } else {
      positionStrategy.centerVertically();
    }

    overlayConfig.positionStrategy = positionStrategy;
    return this._overlay.create(overlayConfig);
  }

  /**
   * Creates an injector to be used inside of a snack bar component.
   * @param config Config that was used to create the snack bar.
   * @param snackBarRef Reference to the snack bar.
   */
  private _createInjector<T>(
    config: SimToastConfig,
    snackBarRef: SimToastRef<T>): PortalInjector {

    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;
    const injectionTokens = new WeakMap();

    injectionTokens.set(SimToastRef, snackBarRef);
    injectionTokens.set(SIM_TOAST_DATA, config.data);

    return new PortalInjector(userInjector || this._injector, injectionTokens);
  }
}

/**
 * Applies default options to the snackbar config.
 * @param config The configuration to which the defaults will be applied.
 * @returns The new configuration object with defaults applied.
 */
function _applyConfigDefaults(config?: SimToastConfig): SimToastConfig {
  return { ...new SimToastConfig(), ...config };
}

import { Directionality } from '@angular/cdk/bidi';
import {
  Overlay,
  OverlayConfig,
  OverlayContainer,
  OverlayRef,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType, PortalInjector, TemplatePortal } from '@angular/cdk/portal';
import { Location } from '@angular/common';
import {
  ComponentRef,
  Inject,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  Optional,
  SkipSelf,
  TemplateRef,
} from '@angular/core';
import { defer, Observable, of as observableOf, Subject } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SimDialogConfig } from './dialog-config';
import { DialogComponent } from './dialog.component';
import { SimDialogRef } from './dialog-ref';

/** 注入令牌，可用于访问传入对话框的数据。 */
export const SIM_DIALOG_DATA = new InjectionToken<any>('SimDialogData');

/** 注入令牌，可用于指定默认对话框选项。 */
export const SIM_DIALOG_DEFAULT_OPTIONS =
  new InjectionToken<SimDialogConfig>('sim-dialog-default-options');

/** 注入令牌，用于在对话框打开时确定滚动处理。 */
export const SIM_DIALOG_SCROLL_STRATEGY =
  new InjectionToken<() => ScrollStrategy>('sim-dialog-scroll-strategy', {
    providedIn: 'root',
    factory: SIM_DIALOG_SCROLL_STRATEGY_FACTORY,
  });

/** @docs-private */
export function SIM_DIALOG_SCROLL_STRATEGY_FACTORY(): () => ScrollStrategy {
  const overlay = inject(Overlay);
  return () => overlay.scrollStrategies.block();
}

/** @docs-private */
export function SIM_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay: Overlay):
  () => ScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

/** @docs-private */
export const SIM_DIALOG_SCROLL_STRATEGY_PROVIDER = {
  provide: SIM_DIALOG_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: SIM_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY,
};


/**
 * 服务打开Simerial Design模式对话框。
 */
@Injectable()
export class SimDialogService {
  private _openDialogsAtThisLevel: SimDialogRef<any>[] = [];
  private readonly _afterAllClosedAtThisLevel = new Subject<void>();
  private readonly _afterOpenAtThisLevel = new Subject<SimDialogRef<any>>();
  private _ariaHiddenElements = new Map<Element, string | null>();

  /** 跟踪当前打开的对话框。 */
  get openDialogs(): SimDialogRef<any>[] {
    return this._parentDialog ? this._parentDialog.openDialogs : this._openDialogsAtThisLevel;
  }

  /** 在打开对话框时发出的流。 */
  get afterOpen(): Subject<SimDialogRef<any>> {
    return this._parentDialog ? this._parentDialog.afterOpen : this._afterOpenAtThisLevel;
  }

  get _afterAllClosed() {
    const parent = this._parentDialog;
    return parent ? parent._afterAllClosed : this._afterAllClosedAtThisLevel;
  }

  /**
   * 当所有打开的对话框完成关闭时发出的流。 如果没有打开的对话框，将在订阅时发出。
   */
  readonly afterAllClosed: Observable<any> = defer<any>(() => this.openDialogs.length ?
    this._afterAllClosed :
    this._afterAllClosed.pipe(startWith(undefined)));

  constructor(
    private _overlay: Overlay,
    private _injector: Injector,
    @Optional() private _location: Location,
    @Optional() @Inject(SIM_DIALOG_DEFAULT_OPTIONS) private _defaultOptions,
    @Inject(SIM_DIALOG_SCROLL_STRATEGY) private _scrollStrategy,
    @Optional() @SkipSelf() private _parentDialog: SimDialogService,
    private _overlayContainer: OverlayContainer) { }

  /**
   * 打开一个包含给定组件的模式对话框。
   * @param componentOrTemplateRef 要加载到对话框中的组件的类型，或作为对话框内容实例化的TemplateRef。
   * @param config 额外的配置选项。
   * @returns 新打开的对话框。
   */
  open<T, D = any, R = any>(componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    config?: SimDialogConfig<D>): SimDialogRef<T, R> {

    config = _applyConfigDefaults(config, this._defaultOptions || new SimDialogConfig());

    if (config.id && this.getDialogById(config.id)) {
      throw Error(`Dialog with id "${config.id}" exists already. The dialog id must be unique.`);
    }

    const overlayRef = this._createOverlay(config);
    const dialogContainer = this._attachDialogContainer(overlayRef, config);
    const dialogRef = this._attachDialogContent<T, R>(componentOrTemplateRef,
      dialogContainer,
      overlayRef,
      config);

    // 如果这是我们打开的第一个对话框，请隐藏所有非叠加内容。
    if (!this.openDialogs.length) {
      this._hideNonDialogContentFromAssistiveTechnology();
    }

    this.openDialogs.push(dialogRef);
    dialogRef.afterClosed().subscribe(() => this._removeOpenDialog(dialogRef));
    this.afterOpen.next(dialogRef);

    return dialogRef;
  }

  /**
   * 关闭所有当前打开的对话框。
   */
  closeAll(): void {
    let i = this.openDialogs.length;

    while (i--) {
      // 关闭之后`_openDialogs`属性不会更新，直到rxjs订阅在下一个微任务上运行为止，此外还修改了阵列，因为我们正在审阅它。
      // 我们循环浏览所有这些内容，并在不假定它们即时从列表中删除的情况下致电关闭。
      this.openDialogs[i].close();
    }
  }

  /**
   * 通过其ID找到一个打开的对话框。
   * @param id 查看对话框时使用的ID。
   */
  getDialogById(id: string): SimDialogRef<any> | undefined {
    return this.openDialogs.find(dialog => dialog.id === id);
  }

  /**
   * 创建将加载对话框的覆盖层。
   * @param config 配置的对话框。
   * @returns 对创建的覆盖层的OverlayRef的解析承诺。
   */
  private _createOverlay(config: SimDialogConfig): OverlayRef {
    const overlayConfig = this._getOverlayConfig(config);
    return this._overlay.create(overlayConfig);
  }

  /**
   * 从对话框配置创建覆盖配置。
   * @param dialogConfig 配置的对话框。
   * @returns 覆盖配置。
   */
  private _getOverlayConfig(dialogConfig: SimDialogConfig): OverlayConfig {
    const state = new OverlayConfig({
      positionStrategy: this._overlay.position().global(),
      scrollStrategy: dialogConfig.scrollStrategy || this._scrollStrategy(),
      panelClass: dialogConfig.panelClass,
      hasBackdrop: dialogConfig.hasBackdrop,
      direction: dialogConfig.direction,
      minWidth: dialogConfig.minWidth,
      minHeight: dialogConfig.minHeight,
      maxWidth: dialogConfig.maxWidth,
      maxHeight: dialogConfig.maxHeight
    });

    if (dialogConfig.backdropClass) {
      state.backdropClass = dialogConfig.backdropClass;
    }

    return state;
  }

  /**
   * 将对话框组件附加到已经创建的对话框覆盖层。
   * @param overlay 引用对话框的基础覆盖。
   * @param config 配置的对话框。
   * @returns 对附加容器的ComponentRef的解析承诺。
   */
  private _attachDialogContainer(overlay: OverlayRef, config: SimDialogConfig): DialogComponent {
    const containerPortal = new ComponentPortal(DialogComponent, config.viewContainerRef);
    const containerRef: ComponentRef<DialogComponent> = overlay.attach(containerPortal);
    containerRef.instance._config = config;

    return containerRef.instance;
  }

  /**
   * Attaches the user-provided component to the already-created DialogComponent.
   * @param componentOrTemplateRef The type of component being loaded into the dialog,
   *     or a TemplateRef to instantiate as the content.
   * @param dialogContainer Reference to the wrapping DialogComponent.
   * @param overlayRef Reference to the overlay in which the dialog resides.
   * @param config The dialog configuration.
   * @returns A promise resolving to the SimDialogRef that should be returned to the user.
   */
  private _attachDialogContent<T, R>(
    componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    dialogContainer: DialogComponent,
    overlayRef: OverlayRef,
    config: SimDialogConfig): SimDialogRef<T, R> {

    // Create a reference to the dialog we're creating in order to give the user a handle
    // to modify and close it.
    const dialogRef =
      new SimDialogRef<T, R>(overlayRef, dialogContainer, this._location, config.id);

    // When the dialog backdrop is clicked, we want to close it.
    if (config.hasBackdrop) {
      overlayRef.backdropClick().subscribe(() => {
        if (!dialogRef.disableClose) {
          dialogRef.close();
        }
      });
    }

    if (componentOrTemplateRef instanceof TemplateRef) {
      dialogContainer.attachTemplatePortal(
        new TemplatePortal<T>(componentOrTemplateRef, null,
          { $implicit: config.data, dialogRef } as any));
    } else {
      const injector = this._createInjector<T>(config, dialogRef, dialogContainer);
      const contentRef = dialogContainer.attachComponentPortal<T>(
        new ComponentPortal(componentOrTemplateRef, undefined, injector));
      dialogRef.componentInstance = contentRef.instance;
    }

    dialogRef
      .updateSize(config.width, config.height)
      .updatePosition(config.position);

    return dialogRef;
  }

  /**
   * 创建要在对话框中使用的自定义注入器。这允许在对话框中加载的组件关闭自己，或者返回值。
   * @param config 用于构造对话框的配置对象。
   * @param dialogRef 引用对话框。
   * @param container 包装所有内容的对话框容器元素。
   * @returns 可在对话框中使用的自定义注入器。
   */
  private _createInjector<T>(
    config: SimDialogConfig,
    dialogRef: SimDialogRef<T>,
    dialogContainer: DialogComponent): PortalInjector {

    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;
    const injectionTokens = new WeakMap();

    // 对话组件作为对话组件注入到门户中，对话框的内容是在相同的ViewContainerRef中创建的，因此，出于注入器的目的，
    // 它们是兄弟。为了允许预期的层次结构，对话组件被显式地添加到注入令牌中。
    injectionTokens
      .set(DialogComponent, dialogContainer)
      .set(SIM_DIALOG_DATA, config.data)
      .set(SimDialogRef, dialogRef);

    if (!userInjector || !userInjector.get<Directionality | null>(Directionality, null)) {
      injectionTokens.set(Directionality, {
        value: config.direction,
        change: observableOf()
      });
    }

    return new PortalInjector(userInjector || this._injector, injectionTokens);
  }

  /**
   * 从打开的对话框中删除一个对话框。
   * @param dialogRef 对话框被删除。
   */
  private _removeOpenDialog(dialogRef: SimDialogRef<any>) {
    const index = this.openDialogs.indexOf(dialogRef);

    if (index > -1) {
      this.openDialogs.splice(index, 1);

      // 如果所有的对话框都关闭了，删除/恢复'兄弟隐藏' 给兄弟姐妹并发送到`afterAllClosed`流。
      if (!this.openDialogs.length) {
        this._ariaHiddenElements.forEach((previousValue, element) => {
          if (previousValue) {
            element.setAttribute('aria-hidden', previousValue);
          } else {
            element.removeAttribute('aria-hidden');
          }
        });

        this._ariaHiddenElements.clear();
        this._afterAllClosed.next();
      }
    }
  }

  /**
   * 隐藏所有不属于辅助技术覆盖范围的内容。
   */
  private _hideNonDialogContentFromAssistiveTechnology() {
    const overlayContainer = this._overlayContainer.getContainerElement();

    // 确保覆盖容器已连接到DOM。
    if (overlayContainer.parentElement) {
      const siblings = overlayContainer.parentElement.children;
      for (let i = siblings.length - 1; i > -1; i--) {
        const sibling = siblings[i];

        if (sibling !== overlayContainer &&
          sibling.nodeName !== 'SCRIPT' &&
          sibling.nodeName !== 'STYLE' &&
          !sibling.hasAttribute('aria-live')) {
          this._ariaHiddenElements.set(sibling, sibling.getAttribute('aria-hidden'));
          sibling.setAttribute('aria-hidden', 'true');
        }
      }
    }

  }

}

/**
 * 将默认选项应用于对话框配置。
 * @param config 配置将被修改。
 * @param defaultOptions 提供了默认选项。
 * @returns 新的配置对象。
 */
function _applyConfigDefaults(config?: SimDialogConfig, defaultOptions?: SimDialogConfig): SimDialogConfig {
  return { ...defaultOptions, ...config };
}


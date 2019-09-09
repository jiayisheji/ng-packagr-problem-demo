import {
  Component,
  ComponentRef,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Inject,
  Optional,
  ChangeDetectorRef,
  ViewChild,
  ViewEncapsulation,
  HostBinding,
  HostListener,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AnimationEvent } from '@angular/animations';
import { simDialogAnimations } from './dialog-animations';
import {
  BasePortalOutlet,
  ComponentPortal,
  CdkPortalOutlet,
  TemplatePortal
} from '@angular/cdk/portal';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { SimDialogConfig } from './dialog-config';

/**
 * 当ComponentPortal附加到没有源的DomPortalOutlet时引发异常。
 */
export function throwSimDialogContentAlreadyAttachedError() {
  throw Error('Attempting to attach dialog content after content is already attached');
}

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-dialog-container',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [simDialogAnimations.slideDialog],
})
export class DialogComponent extends BasePortalOutlet {
  @HostBinding('class.sim-dialog-container') true;
  /** 将此对话框内容加载到的容器内的入口插座。 */
  @ViewChild(CdkPortalOutlet, { static: false }) _portalOutlet: CdkPortalOutlet;

  /** 在对话框中捕捉和管理焦点的类。 */
  private _focusTrap: FocusTrap;

  /** 在对话框打开之前关注的元素。 保存这个以在关闭时恢复。 */
  private _elementFocusedBeforeDialogWasOpened: HTMLElement | null = null;

  /** 对话框配置。 */
  _config: SimDialogConfig;

  /** 对话动画的状态。 */
  @HostBinding('@slideDialog')
  _state: 'void' | 'enter' | 'exit' = 'enter';

  /** 动画状态发生变化时发出。 */
  _animationStateChanged = new EventEmitter<AnimationEvent>();

  /** 应该被视为对话框标签的元素的ID。 */
  _ariaLabelledBy: string | null = null;

  /** 容器DOM元素的ID。 */
  @HostBinding('attr.id')
  _id: string;

  @HostBinding('tabindex')
  get tabindex() {
    return -1;
  }

  @HostBinding('attr.role')
  get attrRole() {
    return this._config && this._config.role;
  }
  @HostBinding('attr.aria-labelledby')
  get attrLabelledby() {
    return (this._config && this._config.ariaLabel) ? null : this._ariaLabelledBy;
  }
  @HostBinding('attr.aria-label')
  get attrAriaLabel() {
    return this._config && this._config.ariaLabel;
  }
  @HostBinding('attr.aria-describedby')
  get attrAriaDescribedby() {
    return (this._config && this._config.ariaDescribedBy) || null;
  }

  constructor(
    private _elementRef: ElementRef,
    private _focusTrapFactory: FocusTrapFactory,
    private _changeDetectorRef: ChangeDetectorRef,
    @Optional() @Inject(DOCUMENT) private _document: any) {
    super();
  }

  /**
   * 将ComponentPortal作为内容附加到此对话框容器中。
   * @param portal Portal 被附加为对话内容。
   */
  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    if (this._portalOutlet.hasAttached()) {
      throwSimDialogContentAlreadyAttachedError();
    }

    this._savePreviouslyFocusedElement();
    return this._portalOutlet.attachComponentPortal(portal);
  }

  /**
   * 将TemplatePortal作为内容附加到此对话框容器中。
   * @param portal Portal 被附加为对话内容。
   */
  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    if (this._portalOutlet.hasAttached()) {
      throwSimDialogContentAlreadyAttachedError();
    }

    this._savePreviouslyFocusedElement();
    return this._portalOutlet.attachTemplatePortal(portal);
  }

  /** 将焦点移动到聚焦内。 */
  private _trapFocus() {
    if (!this._focusTrap) {
      this._focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement);
    }

    // 如果试图立即聚焦，那么在变化检测必须先运行的情况下，对话框的内容还没有准备好。
    // 为了解决这个问题，我们只需等待microtask队列为空。
    if (this._config.autoFocus) {
      this._focusTrap.focusInitialElementWhenReady();
    }
  }

  /** 将焦点恢复到打开对话框之前关注的元素。 */
  private _restoreFocus() {
    const toFocus = this._elementFocusedBeforeDialogWasOpened;

    // 我们需要额外的检查，因为IE可以在某些情况下将`activeElement`设置为null。
    if (toFocus && typeof toFocus.focus === 'function') {
      toFocus.focus();
    }

    if (this._focusTrap) {
      this._focusTrap.destroy();
    }
  }

  /** 保存对打开对话框前聚焦的元素的引用。 */
  private _savePreviouslyFocusedElement() {
    if (this._document) {
      this._elementFocusedBeforeDialogWasOpened = this._document.activeElement as HTMLElement;

      // 请注意，在服务器上呈现时没有焦点方法。
      if (this._elementRef.nativeElement.focus) {
        // 立即将焦点移到对话框上，以防止用户同时意外打开多个对话框。
        // 需要是异步的，因为元素可能无法立即聚焦。
        Promise.resolve().then(() => this._elementRef.nativeElement.focus());
      }
    }
  }

  /** 动画回调，当宿主上的动画开始时调用。 */
  @HostListener('@slideDialog.start', ['$event'])
  _onAnimationStart(event: AnimationEvent) {
    this._animationStateChanged.emit(event);
  }

  /** 动画回调，当宿主上的动画完成时调用。 */
  @HostListener('@slideDialog.done', ['$event'])
  _onAnimationDone(event: AnimationEvent) {
    if (event.toState === 'enter') {
      this._trapFocus();
    } else if (event.toState === 'exit') {
      this._restoreFocus();
    }

    this._animationStateChanged.emit(event);
  }

  /** 开始对话框退出动画。 */
  _startExitAnimation(): void {
    this._state = 'exit';

    // 标记容器以进行检查，以便在视图容器正在使用OnPush更改检测时做出反应。
    this._changeDetectorRef.markForCheck();
  }

}

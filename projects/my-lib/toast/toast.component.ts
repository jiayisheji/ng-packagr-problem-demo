import { AnimationEvent } from '@angular/animations';
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  ComponentPortal,
  TemplatePortal,
} from '@angular/cdk/portal';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  EmbeddedViewRef,
  NgZone,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  HostBinding,
  HostListener,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { simToastAnimations } from './toast-animations';
import { SimToastConfig } from './toast-config';
import { take } from 'rxjs/operators';
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [simToastAnimations.toastState],
})
export class ToastComponent extends BasePortalOutlet implements OnDestroy {
  @HostBinding('class.sim-toast-container') true;

  @HostBinding('attr.role')
  get setRole() {
    return 'alert';
  }

  /** 组件是否已被销毁。 */
  private _destroyed = false;

  /** 该容器内的门户插座将装载到toast内容。 */
  @ViewChild(CdkPortalOutlet, { static: false }) _portalOutlet: CdkPortalOutlet;

  /** 标题为通知toast已退出视野。 */
  readonly _onExit: Subject<any> = new Subject();

  /** 标题为通知toast完成进入视图。 */
  readonly _onEnter: Subject<any> = new Subject();

  /** toast动画的状态。 */
  @HostBinding('@state')
  _animationState = 'void';


  /**toast的配置。 */
  simToastConfig: SimToastConfig;

  constructor(
    private _ngZone: NgZone,
    private _elementRef: ElementRef,
    private _changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  /** 将组件门户作为内容附加到该toast容器。 */
  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    this._assertNotAttached();
    this._applySnackBarClasses();
    return this._portalOutlet.attachComponentPortal(portal);
  }

  /** 将模板门户作为内容附加到该toast容器中。 */
  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    this._assertNotAttached();
    this._applySnackBarClasses();
    return this._portalOutlet.attachTemplatePortal(portal);
  }

  /** 处理动画的结尾，更新toast的状态。 */
  @HostListener('@state.done', ['$event'])
  onAnimationEnd(event: AnimationEvent) {
    const { fromState, toState } = event;

    if ((toState === 'void' && fromState !== 'void') || toState.startsWith('hidden')) {
      this._completeExit();
    }

    if (toState.startsWith('visible')) {
      // 我们不应该在区域回调中使用`this`，因为它会导致内存泄漏。
      const onEnter = this._onEnter;

      this._ngZone.run(() => {
        onEnter.next();
        onEnter.complete();
      });
    }
  }

  /** 开始toast入口的动画进入视野。 */
  enter(): void {
    if (!this._destroyed) {
      this._animationState = `visible-${this.simToastConfig.verticalPosition}`;
      this._changeDetectorRef.detectChanges();
    }
  }

  /** 开始从视图中退出的toast的动画。 */
  exit(): Observable<void> {
    this._animationState = `hidden-${this.simToastConfig.verticalPosition}`;
    return this._onExit;
  }

  /** 确保在元素销毁时调用退出回调。 */
  ngOnDestroy() {
    this._destroyed = true;
    this._completeExit();
  }

  /**
   * 在去除元素之前等待区域解决。 帮助防止出现错误，最终删除动画中间的元素。
   */
  private _completeExit() {
    this._ngZone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
      this._onExit.next();
      this._onExit.complete();
    });
  }

  /** 将各种定位和用户配置的CSS类应用到toast。 */
  private _applySnackBarClasses() {
    const element: HTMLElement = this._elementRef.nativeElement;
    const panelClasses = this.simToastConfig.panelClass;

    if (panelClasses) {
      if (Array.isArray(panelClasses)) {
        // 请注意，我们不能在这里使用传播，因为IE不支持多个参数。
        panelClasses.forEach(cssClass => element.classList.add(cssClass));
      } else {
        element.classList.add(panelClasses);
      }
    }

    if (this.simToastConfig.horizontalPosition === 'center') {
      element.classList.add('sim-toast-center');
    }

    if (this.simToastConfig.verticalPosition === 'top') {
      element.classList.add('sim-toast-top');
    }
  }

  /** 如果没有内容已经附加到容器。 */
  private _assertNotAttached() {
    if (this._portalOutlet.hasAttached()) {
      throw Error('Attempting to attach snack bar content after content is already attached');
    }
  }

}

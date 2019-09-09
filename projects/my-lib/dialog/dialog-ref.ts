import { ESCAPE } from '@angular/cdk/keycodes';
import { GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { Location } from '@angular/common';
import { Observable, Subject, Subscription, SubscriptionLike } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { DialogPosition } from './dialog-config';
import { DialogComponent } from './dialog.component';

// 计数器用于唯一对话框自增ID。
let uniqueId = 0;

/**
 * 引用通过SimDialog服务打开的对话框。
 */
export class SimDialogRef<T, R = any> {
    /** 组件的实例在对话框中打开。 */
    componentInstance: T;

    /** 是否允许用户关闭对话框。 */
    disableClose: boolean | undefined = this._containerInstance._config.disableClose;

    /** 用于通知用户对话已完成打开。 */
    private readonly _afterOpen = new Subject<void>();

    /** 用于通知用户对话已完成关闭。 */
    private readonly _afterClosed = new Subject<R | undefined>();

    /** 用于通知用户对话已经开始关闭。*/
    private readonly _beforeClose = new Subject<R | undefined>();

    /** 结果传递给afterClosed。 */
    private _result: R | undefined;

    /** 订阅用户位置的更改。 */
    private _locationChanges: SubscriptionLike = Subscription.EMPTY;

    constructor(
        private _overlayRef: OverlayRef,
        public _containerInstance: DialogComponent,
        location?: Location,
        readonly id: string = `mat-dialog-${uniqueId++}`) {

        // 将id传给容器。
        _containerInstance._id = id;

        // 打开动画完成时发出
        _containerInstance._animationStateChanged.pipe(
            filter((event: any) => event.phaseName === 'done' && event.toState === 'enter'),
            take(1)
        )
            .subscribe(() => {
                this._afterOpen.next();
                this._afterOpen.complete();
            });

        // 关闭动画完成时处理叠加
        _containerInstance._animationStateChanged.pipe(
            filter((event: any) => event.phaseName === 'done' && event.toState === 'exit'),
            take(1)
        )
            .subscribe(() => {
                this._overlayRef.dispose();
                this._locationChanges.unsubscribe();
                this._afterClosed.next(this._result);
                this._afterClosed.complete();
                this.componentInstance = null;
            });

        _overlayRef.keydownEvents()
            .pipe(filter(event => event.keyCode === ESCAPE && !this.disableClose))
            .subscribe(() => this.close());

        if (location) {
            // 当用户在历史记录中向前/向后或位置散列更改时关闭对话框。
            // 请注意，这通常不包括点击链接（除非用户正在使用`HashLocationStrategy`）。
            this._locationChanges = location.subscribe(() => {
                if (this._containerInstance._config.closeOnNavigation) {
                    this.close();
                }
            });
        }
    }

    /**
     * 关闭对话框。
     * @param dialogResult 可选结果返回到对话框。
     */
    close(dialogResult?: R): void {
        this._result = dialogResult;

        // 与对话并行转换背景。
        this._containerInstance._animationStateChanged.pipe(
            filter((event: any) => event.phaseName === 'start'),
            take(1)
        )
            .subscribe(() => {
                this._beforeClose.next(dialogResult);
                this._beforeClose.complete();
                this._overlayRef.detachBackdrop();
            });

        this._containerInstance._startExitAnimation();
    }

    /**
     * 获取当对话框完成打开时通知的observable。
     */
    afterOpen(): Observable<void> {
        return this._afterOpen.asObservable();
    }

    /**
     * 获取当对话框完成关闭时通知的observable。
     */
    afterClosed(): Observable<R | undefined> {
        return this._afterClosed.asObservable();
    }

    /**
     * 获取当对话框开始关闭时通知的observable。
     */
    beforeClose(): Observable<R | undefined> {
        return this._beforeClose.asObservable();
    }

    /**
     * 获取当叠加层的背景被点击时发出的可观察值。
     */
    backdropClick(): Observable<MouseEvent> {
        return this._overlayRef.backdropClick();
    }

    /**
     * 获取当keydown事件针对叠加层时发出的observable。
     */
    keydownEvents(): Observable<KeyboardEvent> {
        return this._overlayRef.keydownEvents();
    }

    /**
     * 更新对话框的位置。
     * @param position 新的对话位置。
     */
    updatePosition(position?: DialogPosition): this {
        const strategy = this._getPositionStrategy();

        if (position && (position.left || position.right)) {
            position.left ? strategy.left(position.left) : strategy.right(position.right);
        } else {
            strategy.centerHorizontally();
        }

        if (position && (position.top || position.bottom)) {
            position.top ? strategy.top(position.top) : strategy.bottom(position.bottom);
        } else {
            strategy.centerVertically();
        }

        this._overlayRef.updatePosition();

        return this;
    }

    /**
     * 更新对话框的宽度和高度。
     * @param width 对话框的新宽度。
     * @param height 对话框的新高度。
     */
    updateSize(width: string = 'auto', height: string = 'auto'): this {
        this._getPositionStrategy().width(width).height(height);
        this._overlayRef.updatePosition();
        return this;
    }

    maximize(): this {
        this.updateSize('100%', '100%');
        return this;
    }

    /** 从叠加引用中获取位置策略对象。 */
    private _getPositionStrategy(): GlobalPositionStrategy {
        return this._overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;
    }
}

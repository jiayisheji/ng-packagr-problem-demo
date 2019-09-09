import { OverlayRef } from '@angular/cdk/overlay';
import { Observable, Subject } from 'rxjs';
import { ToastComponent } from './toast.component';


/** Event that is emitted when a snack bar is dismissed. */
export interface SimToastDismiss {
    /** Whether the snack bar was dismissed using the action button. */
    dismissedByAction: boolean;
}

/**
 * Reference to a snack bar dispatched from the snack bar service.
 */
export class SimToastRef<T> {
    /** The instance of the component making up the content of the snack bar. */
    instance: T;

    /**
     * The instance of the component making up the content of the snack bar.
     * @docs-private
     */
    containerInstance: ToastComponent;

    /** Subject for notifying the user that the snack bar has been dismissed. */
    private readonly _afterDismissed = new Subject<SimToastDismiss>();

    /** Subject for notifying the user that the snack bar has opened and appeared. */
    private readonly _afterOpened = new Subject<void>();

    /** Subject for notifying the user that the snack bar action was called. */
    private readonly _onAction = new Subject<boolean | null>();

    /**
     * Timeout ID for the duration setTimeout call. Used to clear the timeout if the snackbar is
     * dismissed before the duration passes.
     */
    private _durationTimeoutId: number;

    /** 无论toast是否使用操作按钮被解雇。 */
    private _dismissedByAction = false;

    constructor(containerInstance: ToastComponent,
        private _overlayRef: OverlayRef) {
        this.containerInstance = containerInstance;
        // 关闭toast
        this.onAction().subscribe(() => this.dismiss());
        containerInstance._onExit.subscribe(() => this._finishDismiss());
    }

    /** 关闭toast */
    dismiss(): void {
        if (!this._afterDismissed.closed) {
            this.containerInstance.exit();
        }
        clearTimeout(this._durationTimeoutId);
    }

    /** 标记点击了toast动作。 */
    dismissWithAction(value): void {
        if (!this._onAction.closed) {
            this._dismissedByAction = true;
            this._onAction.next(value);
            this._onAction.complete();
        }
    }

    /**
     * 关闭toast
     */
    closeWithAction(): void {
        this.dismissWithAction(null);
    }

    /** 经过一段时间后将toast关闭 */
    _dismissAfter(duration: number): void {
        this._durationTimeoutId = window.setTimeout(() => this.dismiss(), duration);
    }

    /** 将toast标记为打开 */
    _open(): void {
        if (!this._afterOpened.closed) {
            this._afterOpened.next();
            this._afterOpened.complete();
        }
    }

    /** 关闭后清理DOM。 */
    private _finishDismiss(): void {
        this._overlayRef.dispose();

        if (!this._onAction.closed) {
            this._onAction.complete();
        }

        this._afterDismissed.next({ dismissedByAction: this._dismissedByAction });
        this._afterDismissed.complete();
        this._dismissedByAction = false;
    }

    /** 获得一个观察值，当toast完成关闭时会收到通知。 */
    afterDismissed(): Observable<SimToastDismiss> {
        return this._afterDismissed.asObservable();
    }

    /** 获得一个观察点，当toast打开并出现时会收到通知。 */
    afterOpened(): Observable<void> {
        return this.containerInstance._onEnter;
    }

    /** 获得一个观察值，当调用toast操作时会收到通知。 */
    onAction(): Observable<boolean | null> {
        return this._onAction.asObservable();
    }
}

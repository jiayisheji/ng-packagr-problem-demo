import { ViewContainerRef } from '@angular/core';
import { Direction } from '@angular/cdk/bidi';
import { ScrollStrategy } from '@angular/cdk/overlay';

/** 对话框元素的有效aria角色。 */
export type DialogRole = 'dialog' | 'alertdialog';

/** 可能的对话框位置的覆盖。 */
export interface DialogPosition {
    /** 覆盖对话框的顶部位置。 */
    top?: string;

    /** 覆盖对话框的底部位置。 */
    bottom?: string;

    /** 覆盖对话框的左侧位置。 */
    left?: string;

    /** 覆盖对话框的右侧位置。 */
    right?: string;
}



/**
 * 使用SimDialog服务打开模式对话框的配置。
 */
export class SimDialogConfig<D = any> {

    /**
     * 附加组件应该位于Angular的* logical *组件树中。
     * 这将影响可用于注入的内容以及在对话框中实例化的组件的更改检测顺序。 这不会影响对话内容的呈现位置。
     */
    viewContainerRef?: ViewContainerRef;

    /** 对话框的ID。 如果省略，将生成唯一的一个。 */
    id?: string;

    /** 对话框元素的ARIA角色。*/
    role?: DialogRole = 'dialog';

    /** 覆盖窗格的自定义类。 */
    panelClass?: string | string[] = '';

    /** 对话是否有背景。 */
    hasBackdrop?: boolean = true;

    /** 自定义类的遮罩背景 */
    backdropClass?: string = '';

    /** 用户是否可以使用转义或点击外部关闭模式。 */
    disableClose?: boolean = false;

    /** 对话框的宽度。 */
    width?: string = '';

    /** 对话框的高度。 */
    height?: string = '';

    /** 对话框的最小宽度。 如果提供了一个数字，则假定像素单位。 */
    minWidth?: number | string;

    /** 对话框的最小高度。 如果提供了一个数字，则假定像素单位。 */
    minHeight?: number | string;

    /** 对话框的最大宽度。 如果提供了一个数字，则假定像素单位。 默认为100vw */
    maxWidth?: number | string = '100vw';

    /** 对话框的最大高度。 如果提供了一个数字，则假定像素单位。 默认为100vh */
    maxHeight?: number | string = '100vh';

    /** 位置覆盖。 */
    position?: DialogPosition;

    /** 被注入到子组件中的数据。 */
    data?: D | null = null;

    /** 对话框内容的布局方向。 */
    direction?: Direction;

    /** 描述对话的元素的ID。 */
    ariaDescribedBy?: string | null = null;

    /** Aria标签分配给对话框元素 */
    ariaLabel?: string | null = null;

    /** 对话是否应该把第一个关注点放在开放的位置上。 */
    autoFocus?: boolean = true;

    /** 滚动策略用于对话框。 */
    scrollStrategy?: ScrollStrategy;

    /** 当用户在历史中向后/向前移动时，对话框是否应该关闭。 */
    closeOnNavigation?: boolean = true;

}

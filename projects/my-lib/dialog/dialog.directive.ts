import {
  Directive,
  Input,
  OnChanges,
  OnInit,
  Optional,
  SimpleChanges,
  ElementRef,
  HostBinding,
  HostListener,
} from '@angular/core';
import { SimDialogRef } from './dialog-ref';
import { SimDialogService } from './dialog.service';

/** 用于为对话框元素生成唯一ID的计数器。 */
let dialogElementUid = 0;

/**
 * 将关闭当前对话框的按钮。
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: `button[sim-dialog-close], button[simDialogClose]`,
  exportAs: 'simDialogClose',
})
export class DialogCloseDirective implements OnInit, OnChanges {
  @HostBinding('class.sim-dialog-close') true;
  /** 该按钮的屏幕阅读器标签。 */
  @HostBinding('attr.aria-label')
  @Input() ariaLabel: string = 'Close dialog';

  /** Dialog close input. */
  @Input() dialogResult: any;

  @Input() simDialogClose: any;

  @HostBinding('attr.type')
  get attrType() {
    // 防止意外表单提交。
    return 'button';
  }

  constructor(
    @Optional() protected dialogRef: SimDialogRef<any>,
    protected _elementRef: ElementRef,
    protected _dialog: SimDialogService) { }

  ngOnInit() {
    if (!this.dialogRef) {
      // 当通过TemplateRef（而不是在组件）中将此指令包含在对话框中时，DialogRef不能通过注入使用，因为嵌入的视图不能使用自定义注入器。
      // 相反，我们通过ID查找DialogRef。 这必须出现在`onInit`中，因为对话框容器的ID绑定不会在构造函数时解析。
      this.dialogRef = getClosestDialog(this._elementRef, this._dialog.openDialogs);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const proxiedChange = changes.simDialogClose || changes._simDialogCloseResult;

    if (proxiedChange) {
      this.dialogResult = proxiedChange.currentValue;
    }
  }

  @HostListener('click', ['$event'])
  _closeDialog(event: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.dialogRef.close(this.dialogResult);
  }
}

/**
 * 将关闭当前对话框的按钮。
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: `button[sim-dialog-maximize], button[simDialogMaximize]`,
  exportAs: 'simDialogMaximize',
})
export class DialogMaximizeDirective implements OnInit {
  @HostBinding('class.sim-dialog-maximize') true;
  /** 该按钮的屏幕阅读器标签。 */
  @HostBinding('attr.aria-label')
  @Input() ariaLabel: string = 'Maximize dialog';


  @HostBinding('attr.type')
  get attrType() {
    // 防止意外表单提交。
    return 'button';
  }

  constructor(
    @Optional() protected dialogRef: SimDialogRef<any>,
    protected _elementRef: ElementRef,
    protected _dialog: SimDialogService) { }

  ngOnInit() {
    if (!this.dialogRef) {
      // 当通过TemplateRef（而不是在组件）中将此指令包含在对话框中时，DialogRef不能通过注入使用，因为嵌入的视图不能使用自定义注入器。
      // 相反，我们通过ID查找DialogRef。 这必须出现在`onInit`中，因为对话框容器的ID绑定不会在构造函数时解析。
      this.dialogRef = getClosestDialog(this._elementRef, this._dialog.openDialogs);
    }
  }

  @HostListener('click', ['$event'])
  _closeDialog(event: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.dialogRef.maximize();
  }
}


/**
 * 将取消当前对话框的按钮。
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: `button[sim-dialog-cancel], button[simDialogCancel]`,
  exportAs: 'simDialogCancel',
})
export class DialogCancelDirective implements OnInit, OnChanges {
  @HostBinding('class.sim-dialog-cancel') true;

  /** 该按钮的屏幕阅读器标签。 */
  @HostBinding('attr.aria-label')
  @Input() ariaLabel: string = 'Cancel dialog';

  /** Dialog close input. */
  @Input() dialogResult: any;

  @Input() simDialogCancel: any;

  @HostBinding('attr.type')
  get attrType() {
    // 防止意外表单提交。
    return 'button';
  }

  constructor(
    @Optional() protected dialogRef: SimDialogRef<any>,
    protected _elementRef: ElementRef,
    protected _dialog: SimDialogService) { }

  ngOnInit() {
    if (!this.dialogRef) {
      // 当通过TemplateRef（而不是在组件）中将此指令包含在对话框中时，DialogRef不能通过注入使用，因为嵌入的视图不能使用自定义注入器。
      // 相反，我们通过ID查找DialogRef。 这必须出现在`onInit`中，因为对话框容器的ID绑定不会在构造函数时解析。
      this.dialogRef = getClosestDialog(this._elementRef, this._dialog.openDialogs);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const proxiedChange = changes.simDialogCancel || changes._simDialogCloseResult;

    if (proxiedChange) {
      this.dialogResult = proxiedChange.currentValue;
    }
  }

  @HostListener('click', ['$event'])
  _closeDialog(event: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.dialogRef.close(this.dialogResult);
  }
}

/**
 * 对话元素的标题。 滚动时固定在对话框的顶部。
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[sim-dialog-title], [simDialogTitle]',
})
export class DialogTitleDirective implements OnInit {
  @HostBinding('class.sim-dialog-title') true;

  @HostBinding('attr.id')
  @Input() id = `sim-dialog-title-${dialogElementUid++}`;

  constructor(
    @Optional() private _dialogRef: SimDialogRef<any>,
    private _elementRef: ElementRef,
    private _dialog: SimDialogService) { }

  ngOnInit() {
    if (!this._dialogRef) {
      this._dialogRef = getClosestDialog(this._elementRef, this._dialog.openDialogs);
    }

    if (this._dialogRef) {
      Promise.resolve().then(() => {
        const container = this._dialogRef._containerInstance;
        if (container && !container._ariaLabelledBy) {
          container._ariaLabelledBy = this.id;
        }
      });
    }
  }
}



/**
 * 对话框中头部操作标题的容器。滚动时固定在头部。
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: `[sim-dialog-header], sim-dialog-header, [simDialogheader]`
})
export class DialogHeaderDirective {
  @HostBinding('class.sim-dialog-header') true;
}

/**
 * 对话框的可滚动内容容器。
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: `[sim-dialog-content], sim-dialog-content, [simDialogContent]`,
})
export class DialogContentDirective {
  @HostBinding('class.sim-dialog-content') true;
}


/**
 * 对话框中底部操作按钮的容器。 滚动时固定在底部。
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: `[sim-dialog-actions], sim-dialog-actions, [simDialogActions]`,
})
export class DialogActionsDirective {
  @HostBinding('class.sim-dialog-actions') true;
}

/**
 * 通过查看DOM来查找元素的最近SimDialogRef。
 * @param element 相对于查找对话框的元素。
 * @param openDialogs 参考当前打开的对话框。
 */
function getClosestDialog(element: ElementRef, openDialogs: SimDialogRef<any>[]) {
  let parent: HTMLElement | null = element.nativeElement.parentElement;

  while (parent && !parent.classList.contains('sim-dialog-container')) {
    parent = parent.parentElement;
  }

  return parent ? openDialogs.find(dialog => dialog.id === (parent && parent.id)) : null;
}

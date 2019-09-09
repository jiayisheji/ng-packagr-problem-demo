import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  Input,
  QueryList,
  ViewChild,
  ViewEncapsulation,
  HostBinding
} from '@angular/core';

import { coerceBooleanProperty } from '@angular/cdk/coercion';

import { EMPTY, merge } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SuffixDirective } from './suffix.directive';
import { PrefixDirective } from './prefix.directive';
import { HintDirective } from './hint.directive';
import { ErrorDirective } from './error.directive';
import { LabelDirective } from './label.directive';
import { SimFormFieldControl } from './form-field-control';
import { simFormFieldAnimations } from './form-field-animations';
import { ButtonComponent } from 'simple-ui/button';
import { TipsDirective } from './tips.directive';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  animations: [simFormFieldAnimations.transitionMessages],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent implements AfterContentInit, AfterViewInit {
  @HostBinding('class.sim-form-field') true;

  _subscriptAnimationState = '';

  // label for input id
  labelForId: string;
  // label show input required
  labelRequired: boolean;

  @ViewChild('connectionContainer', { static: false }) _connectionContainerRef: ElementRef;
  @ContentChild(LabelDirective, { static: false }) _labelChild: LabelDirective;
  @ContentChildren(ErrorDirective) _errorChildren: QueryList<ErrorDirective>;
  @ContentChildren(TipsDirective) _tipsChildren: QueryList<TipsDirective>;
  @ContentChildren(HintDirective) _hintChildren: QueryList<HintDirective>;
  @ContentChildren(PrefixDirective) _prefixChildren: QueryList<PrefixDirective>;
  @ContentChildren(SuffixDirective) _suffixChildren: QueryList<SuffixDirective>;
  @ContentChildren(ButtonComponent) _buttonChildren: QueryList<ButtonComponent>;

  @ContentChild(SimFormFieldControl, { static: false }) _control: SimFormFieldControl<any>;

  @Input() onlyButton = false;
  @Input() label: string;
  @Input() labelWidth = '10%';
  // 配合动态添加必填使用
  @Input()
  set required(value: boolean) {
    this.labelRequired = coerceBooleanProperty(value);
    this._changeDetectorRef.markForCheck();
  }

  @HostBinding('class.sim-form-field-invalid')
  get simFormFieldInvalid() {
    return this._control && this._control.errorState;
  }
  @HostBinding('class.sim-form-field-disabled')
  get simFormFieldDisabled() {
    return this._control && this._control.disabled;
  }
  @HostBinding('class.sim-form-field-autofilled')
  get simFormFieldAutofilled() {
    return this._control && this._control.autofilled;
  }

  @HostBinding('class.ng-untouched')
  get classNgUntouched() {
    return this._shouldForward('untouched');
  }
  @HostBinding('class.ng-touched')
  get classNgTouched() {
    return this._shouldForward('touched');
  }
  @HostBinding('class.ng-pristine')
  get classNgPristine() {
    return this._shouldForward('pristine');
  }
  @HostBinding('class.ng-dirty')
  get classNgDirty() {
    return this._shouldForward('dirty');
  }
  @HostBinding('class.ng-valid')
  get classNgValid() {
    return this._shouldForward('valid');
  }
  @HostBinding('class.ng-invalid')
  get classNgInvlid() {
    return this._shouldForward('invalid');
  }
  @HostBinding('class.ng-pending')
  get classNgPending() {
    return this._shouldForward('pending');
  }

  constructor(
    public _elementRef: ElementRef,
    private _changeDetectorRef: ChangeDetectorRef,
  ) { }

  /**
   * 获取元素的ElementRef，该元素与表单字段关联的覆盖层应该相对放置。
   */
  getConnectedOverlayOrigin(): ElementRef {
    return this._connectionContainerRef || this._elementRef;
  }

  ngAfterContentInit() {
    this._buttonChildren.changes.pipe(startWith(null)).subscribe((data) => {
      this._changeDetectorRef.markForCheck();
    });

    // 如果没有子控件直接返回
    if (!this._control) {
      return;
    }
    if (this._control.controlType) {
      this._elementRef.nativeElement.classList
        .add(`sim-form-field-type-${this._control.controlType}`);
    }
    // 如果没有自定义label 需要手动设置id为input输入框id
    if (!this._labelChild && this.label) {
      this.labelForId = this._control.id;
    }
    // 设置必填
    this.labelRequired = this._control.required;

    // 订阅子控件状态中的更改以更新表单域 UI。
    this._control.stateChanges.pipe(startWith(null)).subscribe(() => {
      this._syncDescribedByIds();
      this._changeDetectorRef.markForCheck();
    });

    // 如果值、前缀或后缀发生更改, 则运行更改检测。
    const valueChanges = this._control.ngControl && this._control.ngControl.valueChanges || EMPTY;
    merge(valueChanges, this._prefixChildren.changes, this._suffixChildren.changes)
      .subscribe(() => this._changeDetectorRef.markForCheck());

    // 在提示信息更改时重新验证。
    this._hintChildren.changes.pipe(startWith(null)).subscribe(() => {
      this._processHints();
      this._changeDetectorRef.markForCheck();
    });

    // 当错误数量发生变化时描述。
    this._errorChildren.changes.pipe(startWith(null)).subscribe(() => {
      this._syncDescribedByIds();
      this._changeDetectorRef.markForCheck();
    });
  }

  ngAfterViewInit() {
    // 避免加载时出现动画。
    this._subscriptAnimationState = 'enter';
    this._changeDetectorRef.detectChanges();
  }

  _getDisplayedMessages(): 'error' | 'hint' {
    return (this._errorChildren && this._errorChildren.length > 0 && this._control.errorState) ? 'error' : 'hint';
  }

  protected _validateControlChild() {
    if (!this._control) {
      throw Error('sim-form-field must contain a SimFormFieldControl.');
    }
  }

  protected _shouldForward(prop: string): boolean {
    const ngControl = this._control ? this._control.ngControl : null;
    return ngControl && (ngControl as any)[prop];
  }

  /** 执行处理提示时需要的其他处理。 */
  private _processHints() {
    this._validateHints();
    this._syncDescribedByIds();
  }

  /**
   * 确保指定的每个'<sim-hint>'对齐最多只有一个，属性被认为是 'align="start"'。
   */
  private _validateHints() {
    if (this._hintChildren) {
      let startHint: HintDirective;
      let endHint: HintDirective;
      this._hintChildren.forEach((hint: HintDirective) => {
        if (hint.align === 'start') {
          if (startHint) {
            throw Error(`A hint was already declared for 'align="start"'.`);
          }
          startHint = hint;
        } else if (hint.align === 'end') {
          if (endHint) {
            throw Error(`A hint was already declared for 'align="end"'.`);
          }
          endHint = hint;
        }
      });
    }
  }

  /**
   * 设置描述子控件的元素id列表。这允许控件相应地更新其“aria-describedby”属性。
   */
  private _syncDescribedByIds() {
    if (this._control) {
      let ids: string[] = [];

      if (this._getDisplayedMessages() === 'hint') {
        const startHint = this._hintChildren ?
          this._hintChildren.find(hint => hint.align === 'start') : null;
        const endHint = this._hintChildren ?
          this._hintChildren.find(hint => hint.align === 'end') : null;

        if (startHint) {
          ids.push(startHint.id);
        }

        if (endHint) {
          ids.push(endHint.id);
        }
      } else if (this._errorChildren) {
        ids = this._errorChildren.map(error => error.id);
      }

      this._control.setDescribedByIds(ids);
    }
  }


}

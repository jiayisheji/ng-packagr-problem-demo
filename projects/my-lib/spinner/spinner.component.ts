import {
  Component,
  OnInit,
  HostBinding,
  Input,
  TemplateRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  NgZone,
  ViewEncapsulation,
  ChangeDetectionStrategy
} from '@angular/core';
import { coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, first } from 'rxjs/internal/operators';
import { mixinSize, CanSize, ThemeSize } from 'simple-ui/core';

export class SimSpinnerBase {
  constructor(public _elementRef: ElementRef) { }
}
export const _SimSpinnerMixinBase = mixinSize(SimSpinnerBase, 'md');


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent extends _SimSpinnerMixinBase implements AfterViewInit, CanSize {
  @HostBinding('class.sim-spinner') true;
  isNested = false;
  baseSpinning$ = new BehaviorSubject(true);
  _element: HTMLElement;
  resultSpinning$: Observable<boolean> = this.baseSpinning$.asObservable().pipe(debounceTime(this.delay));
  @ViewChild('containerElement', { static: false }) containerElement: ElementRef;

  @Input() indicator: TemplateRef<void>;

  /** 尺寸 */
  @Input() size: ThemeSize;

  private _spinner: boolean;
  /** 如果没有选择任何值，则显示占位符。 */
  @Input()
  get spinner(): boolean { return this._spinner; }
  set spinner(value: boolean) {
    this._spinner = coerceBooleanProperty(value);
    this.baseSpinning$.next(this._spinner);
  }

  private _delay = 0;
  /** 如果没有选择任何值，则显示占位符。 */
  @Input()
  get delay(): number { return this._delay; }
  set delay(value: number) {
    this._delay = coerceNumberProperty(value, 0);
    if (!!this._delay) {
      this.resultSpinning$ = this.baseSpinning$.asObservable().pipe(debounceTime(this._delay));
    }
  }

  private _placeholder: string;
  /** 如果没有选择任何值，则显示占位符。 */
  @Input()
  get placeholder(): string { return this._placeholder; }
  set placeholder(value: string) {
    this._placeholder = value;
  }

  constructor(private elementRef: ElementRef, private renderer: Renderer2, private zone: NgZone) {
    super(elementRef);
    this._element = this.elementRef.nativeElement;
  }

  checkNested(): void {
    /** no way to detect empty https://github.com/angular/angular/issues/12530 **/
    if (!!this.containerElement.nativeElement) {
      this.isNested = true;
      this.renderer.setStyle(this._element, 'display', 'block');
    } else {
      this.renderer.removeStyle(this._element, 'display');
      this.isNested = false;
    }
  }

  ngAfterViewInit(): void {
    this.zone.onStable.pipe(first()).subscribe(() => {
      this.checkNested();
    });
  }

}

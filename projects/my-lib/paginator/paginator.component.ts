import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  HostBinding,
  Output,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { mixinSize, ThemeSize, CanSize } from 'simple-ui/core';
import { toBoolean, toNumber } from 'simple-ui/core';

// 默认第一页
const FIRST_INDEX = 1;
// 默认每页10条数据
const PAGE_SIZE = 10;
// 每页条数选择配置
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40];

/**
 * 更改事件对象，当用户选择不同的每页条数或导航到另一个页面时，该对象将被释放。
 */
export class PageEvent {
  /** 当前页数 */
  pageIndex: number;
  /**
   * 先前选择的页数。
   */
  previousPageIndex?: number;
  /** 每页条数  */
  pageSize: number;
  /** 当前被分页的项的总数 */
  pageTotal: number;
}

export class SimPaginatorBase {
  constructor(public _elementRef: ElementRef) { }
}
export const _SimPaginatorMixinBase = mixinSize(SimPaginatorBase, 'md');

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PaginatorComponent extends _SimPaginatorMixinBase implements OnInit, CanSize {
  @HostBinding('class.sim-paginator') true;

  @ViewChild('quickJumperInput', { static: false }) _quickJumperInputRef: ElementRef;
  // 是否被初始化完成
  private _initialized: boolean;

  firstIndex = FIRST_INDEX;

  pages = [];

  @Input() size: ThemeSize;

  /** 显示列表项的从零开始的页面索引。默认为1。 */
  @Input()
  get pageIndex(): number { return this._pageIndex; }
  set pageIndex(value: number) {
    if (this._pageIndex === value) {
      return;
    }
    let pageIndex = toNumber(value, FIRST_INDEX);
    if (pageIndex > this.lastIndex) {
      pageIndex = this.lastIndex;
    } else if (pageIndex < this.firstIndex) {
      pageIndex = this.firstIndex;
    }
    this._pageIndex = pageIndex;
    this.buildIndexes();
  }
  _pageIndex: number = FIRST_INDEX;

  /** 在页面上显示的项数。默认设置为10。 */
  @Input()
  get pageSize(): number { return this._pageSize; }
  set pageSize(value: number) {
    this._pageSize = toNumber(value, PAGE_SIZE);
    const pageIndexOverflow = this.pageIndex > this.lastIndex;
    if (pageIndexOverflow) {
      this.pageIndex = this.lastIndex;
      this._updateDisplayedPageSizeOptions();
    }
  }
  private _pageSize: number = PAGE_SIZE;

  /** 显示给用户的一组提供的页面大小选项。默认设置为[10, 20, 30, 40]。 */
  @Input()
  get pageSizeOptions(): number[] { return this._pageSizeOptions; }
  set pageSizeOptions(value: number[]) {
    if (value && value.length) {
      this._pageSizeOptions = (value || []).map(p => toNumber(p));
      this._updateDisplayedPageSizeOptions();
    }
  }
  private _pageSizeOptions: number[] = PAGE_SIZE_OPTIONS;

  /** 被分页的项的总数的长度。默认为undefined。 */
  @Input()
  get pageTotal(): number { return this._pageTotal; }
  set pageTotal(value: number) {
    this._pageTotal = value;
    this.buildIndexes();
  }
  _pageTotal: number;

  /** 是否隐藏页面大小选择。默认为true */
  @Input()
  get hidePageSize(): boolean { return this._hidePageSize; }
  set hidePageSize(value: boolean) {
    this._hidePageSize = toBoolean(value);
  }
  private _hidePageSize = true;

  /** 是否隐藏页面大小选择。默认为true */
  @Input()
  get hideJumperPage(): boolean { return this._hideJumperPage; }
  set hideJumperPage(value: boolean) {
    this._hideJumperPage = toBoolean(value);
  }
  private _hideJumperPage = true;

  /** 是否向用户显示第一个/最后一个按钮。默认为false */
  @Input()
  get showFirstLastButtons(): boolean { return this._showFirstLastButtons; }
  set showFirstLastButtons(value: boolean) {
    this._showFirstLastButtons = toBoolean(value);
  }
  private _showFirstLastButtons = true;

  /** 显示一组页面大小选项。将被排序，并包括当前页大小。 */
  _displayedPageSizeOptions: number[];

  /** 当paginator更改页面大小或页面索引时发出的事件。 */
  @Output() readonly page: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();

  constructor(
    _elementRef: ElementRef,
    private _changeDetectorRef: ChangeDetectorRef,
  ) {
    super(_elementRef);
  }

  ngOnInit() {
    this._initialized = true;
    this._updateDisplayedPageSizeOptions();
  }

  /** 计算最大页数。 */
  get lastIndex(): number {
    // 如果pageTotal为0 那么直接返回当前pageIndex
    if (!this.pageTotal) {
      return this.pageIndex;
    }
    return Math.ceil(this.pageTotal / this.pageSize);
  }

  /** 是否第一页 */
  get isFirstIndex(): boolean {
    return this.pageIndex === this.firstIndex;
  }

  /** 是否最后一页 */
  get isLastIndex(): boolean {
    return this.pageIndex === this.lastIndex;
  }

  /** 生成索引列表 */
  buildIndexes(): void {
    const tmpPages = [];
    if (this.lastIndex <= 9) {
      for (let i = 2; i <= this.lastIndex - 1; i++) {
        tmpPages.push({ index: i });
      }
    } else {
      const current = this.pageIndex;
      let left = Math.max(2, current - 2);
      let right = Math.min(current + 2, this.lastIndex - 1);

      if (current - 1 <= 2) {
        right = 5;
      }

      if (this.lastIndex - current <= 2) {
        left = this.lastIndex - 4;
      }

      for (let i = left; i <= right; i++) {
        tmpPages.push({ index: i });
      }
    }
    this.pages = tmpPages;
    this._changeDetectorRef.markForCheck();
  }

  // 处理跳转分页
  jumpPage(index: number): void {
    let pageIndex = this.pageIndex;
    if (index === pageIndex) {
      return;
    }
    if (index < this.firstIndex) {
      pageIndex = this.firstIndex;
    } else if (index > this.lastIndex) {
      pageIndex = this.lastIndex;
    } else {
      pageIndex = index;
    }
    const previousPageIndex = this.pageIndex;
    this.pageIndex = pageIndex;
    this._emitPageEvent(previousPageIndex);
    // 如果快速跳转有值，就需要去更新 或者直接干掉
    if (this._quickJumperInputRef && !!this._quickJumperInputRef.nativeElement.value) {
      this._quickJumperInputRef.nativeElement.value = pageIndex;
    }
  }
  /** 移到后前五页。 */
  previousFive(): void {
    this.jumpPage(this.pageIndex - 5);
  }

  /** 移到后五页。 */
  nextFive(): void {
    this.jumpPage(this.pageIndex + 5);
  }

  /** 移到下一页。 */
  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }
    this.jumpPage(this.pageIndex + 1);
  }

  /** 移到上一页。 */
  previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }
    this.jumpPage(this.pageIndex - 1);
  }

  /** 移到第一页。 */
  firstPage(): void {
    this.jumpPage(this.firstIndex);
  }

  /** 移到最后一页 */
  lastPage(): void {
    this.jumpPage(this.lastIndex);
  }

  /** 是否有上一页。 */
  hasPreviousPage(): boolean {
    return !this.isFirstIndex;
  }

  /** 是否有下一页。 */
  hasNextPage(): boolean {
    return !this.isLastIndex;
  }

  /**
   * 更改页面大小，以便在页面上显示的第一项仍然使用新页面大小显示。
   *
   * 例如，如果页面大小为10，并且在第二个页面上(项目索引为10-19)，
   * 那么切换到页面大小为5，则将第三页设置为当前页面，这样第10项仍然会显示出来。
   */
  _changePageSize(pageSize: number) {
    // 当前页面需要更新以反映新的页面大小。导航到包含前一个页面的第一项的页面。
    const startIndex = this.pageIndex * this.pageSize;
    const previousPageIndex = this.pageIndex;

    this.pageIndex = Math.floor(startIndex / pageSize) || 1;
    this.pageSize = pageSize;
    this._emitPageEvent(previousPageIndex);
    this.buildIndexes();
  }

  // 处理输入跳转的键盘事件
  handleKeyDown(event: Event, input: HTMLInputElement) {
    if (event) {
      event.stopPropagation();
    }
    const target = input;
    if (this.pageTotal === 1) {
      // 更新ui
      target.value = `${this.pageIndex}`;
      target.blur();
      return;
    }
    const inputValue = target.value;
    const currentInputValue = this.pageIndex;
    let value;
    // 处理输入的input值
    if (inputValue === '') {
      value = inputValue;
    } else if (isNaN(parseInt(inputValue, 10))) {
      value = currentInputValue;
    } else {
      value = parseInt(inputValue, 10);
    }
    this.jumpPage(value);
    // 更新ui
    target.value = `${this.pageIndex}`;
    target.blur();
  }

  /**
   * 更新页面大小选项列表以显示给用户。包括确保页面大小是一个选项，并且列表是有序的。
   */
  private _updateDisplayedPageSizeOptions() {
    if (!this._initialized) { return; }

    // 如果没有提供页面大小，请使用第一个页面大小选项或默认页面大小。
    if (!this.pageSize) {
      this._pageSize = this.pageSizeOptions.length !== 0 ?
        this.pageSizeOptions[0] : 50;
    }

    this._displayedPageSizeOptions = this.pageSizeOptions.slice();

    if (this._displayedPageSizeOptions.indexOf(this.pageSize) === -1) {
      this._displayedPageSizeOptions.push(this.pageSize);
    }

    // 使用特定于数字的排序函数对数字排序。
    this._displayedPageSizeOptions.sort((a, b) => a - b);
    this.buildIndexes();
  }

  /** 发出一个事件，通知已触发paginator属性的更改。 */
  private _emitPageEvent(previousPageIndex: number) {
    this.page.emit({
      previousPageIndex,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      pageTotal: this.pageTotal
    });
  }

}

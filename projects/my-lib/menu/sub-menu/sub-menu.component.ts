import {
  Component,
  OnInit,
  HostBinding,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter,
  Optional,
  SkipSelf,
  ChangeDetectorRef,
  AfterContentInit,
  ContentChildren,
  QueryList,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { simMenuAnimations } from '../menu.animations';
import { toBoolean } from 'simple-ui/core';
import { MenuComponent } from '../menu.component';
import { Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { auditTime, map, takeUntil } from 'rxjs/operators';
import { CdkConnectedOverlay, ConnectionPositionPair, ConnectedOverlayPositionChange } from '@angular/cdk/overlay';

const POSITION_MAP: { [key: string]: ConnectionPositionPair } = {
  leftTop: {
    originX: 'start',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'top',
  },
  rightTop: {
    originX: 'end',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'top',
  },
  bottomLeft: {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
  }
} as {} as { [key: string]: ConnectionPositionPair };


@Component({
  // tslint:disable-next-line:component-selector
  selector: '[sim-submenu]',
  templateUrl: './sub-menu.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: [
    simMenuAnimations.expandAnimation
  ],
})
export class SubMenuComponent implements OnInit, AfterContentInit, OnDestroy {
  @HostBinding('class.sim-menu-submenu') true;
  $subOpen = new BehaviorSubject<boolean>(false);
  private $mouseSubject = new Subject<boolean>();
  private unsubscribe$ = new Subject<void>();

  placement = 'rightTop';
  isInSubMenu = false;
  level = 1;
  triggerWidth = null;

  @ContentChildren(SubMenuComponent, { descendants: true }) subMenus: QueryList<SubMenuComponent>;
  @ViewChild(CdkConnectedOverlay, { static: false }) cdkOverlay: CdkConnectedOverlay;
  @ViewChild('trigger', { static: false }) trigger: ElementRef;

  @Input()
  set open(value: boolean) {
    this._open = toBoolean(value);
    this.setTriggerWidth();
    this.cdr.detectChanges();
  }
  get open(): boolean {
    return this._open;
  }
  _open = false;

  @Output() openChange: EventEmitter<boolean> = new EventEmitter();

  get expandState(): string {
    if (this.open && this.subMenuMode === 'inline') {
      return 'expand';
    } else if (this.open && this.subMenuMode === 'horizontal') {
      return 'bottom';
    } else if (this.open && this.subMenuMode === 'vertical') {
      return 'fade';
    } else {
      return 'hidden';
    }
  }

  get subMenuMode(): string {
    if (this.menuComponent.mode === 'inline') {
      return 'inline';
    } else if ((this.menuComponent.mode === 'vertical') || (this.isInSubMenu)) {
      return 'vertical';
    } else {
      return 'horizontal';
    }
  }


  @HostBinding('class.sim-menu-submenu-inline')
  get setMenuInlineClass(): boolean {
    return (this.subMenuMode === 'inline');
  }

  get overlayPositions(): ConnectionPositionPair[] {
    if (this.subMenuMode === 'horizontal') {
      return [POSITION_MAP.bottomLeft];
    } else {
      return [POSITION_MAP.rightTop, POSITION_MAP.leftTop];
    }
  }

  constructor(
    public menuComponent: MenuComponent,
    private cdr: ChangeDetectorRef,
    @SkipSelf() @Optional() private subMenuComponent: SubMenuComponent
  ) { }


  ngOnInit() {
    this.menuComponent.subMenus.push(this);
    const $combineAll = combineLatest(
      this.$subOpen,
      this.$mouseSubject.asObservable()
    ).pipe(map(value => value[0] || value[1]), auditTime(150));
    $combineAll.pipe(takeUntil(this.unsubscribe$)).subscribe(this.handleOpenEvent);
  }

  ngAfterContentInit(): void {
    if (this.subMenus && this.subMenus.length) {
      this.subMenus.filter(x => x !== this).forEach(menu => {
        if (this.subMenuMode === 'inline') {
          Promise.resolve().then(() => menu.level = this.level + 1);
        }
        menu.isInSubMenu = true;
      });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * 标题点击展开收起事件
   */
  clickSubMenuTitle($event: MouseEvent): void {
    if (this.subMenuMode === 'inline') {
      this.open = !this.open;
      this.openChange.next(this.open);
    }
  }

  onMouseEnterEvent(e: MouseEvent): void {
    if ((this.subMenuMode === 'horizontal') || (this.subMenuMode === 'vertical')) {
      this.$mouseSubject.next(true);
    }
  }

  onMouseLeaveEvent(e: MouseEvent): void {
    if ((this.subMenuMode === 'horizontal') || (this.subMenuMode === 'vertical')) {
      this.$mouseSubject.next(false);
    }
  }

  onPositionChange($event: ConnectedOverlayPositionChange): void {
    if ($event.connectionPair) {
      const originMap = {
        originX: $event.connectionPair.originX,
        originY: $event.connectionPair.originY,
        overlayX: $event.connectionPair.overlayX,
        overlayY: $event.connectionPair.overlayY
      };
      const keyList = ['originX', 'originY', 'overlayX', 'overlayY'];
      if (keyList.every(key => originMap[key] === POSITION_MAP.leftTop[key])) {
        this.placement = 'leftTop';
      } else if (keyList.every(key => originMap[key] === POSITION_MAP.rightTop[key])) {
        this.placement = 'rightTop';
      }
      this.cdr.detectChanges();
    }
  }

  handleOpenEvent = (data: boolean) => {
    if (this.open !== data) {
      this.open = data;
      this.openChange.emit(this.open);
    }
    if (this.subMenuComponent) {
      this.subMenuComponent.$subOpen.next(this.open);
    }
  }

  setTriggerWidth(): void {
    if (this.subMenuMode === 'horizontal') {
      this.triggerWidth = this.trigger.nativeElement.getBoundingClientRect().width;
      /** should remove after after https://github.com/angular/material2/pull/8765 merged **/
      if (this.cdkOverlay && this.cdkOverlay.overlayRef) {
        this.cdkOverlay.overlayRef.updateSize({
          width: this.triggerWidth
        });
      }
    }

  }

}

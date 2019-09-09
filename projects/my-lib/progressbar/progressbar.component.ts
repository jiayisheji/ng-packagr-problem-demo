import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  EventEmitter,
  ViewEncapsulation,
  HostBinding,
  ElementRef
} from '@angular/core';
import { ProgressbarService } from './progressbar.service';
import { ProgressbarRef } from './progressbar-ref';
import { ProgressbarState } from './progressbar.interface';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-progressbar',
  templateUrl: './progressbar.component.html',
  styleUrls: ['./progressbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressbarComponent implements OnInit, OnChanges, OnDestroy {
  @HostBinding('class.sim-progressbar') true;

  private _started$: Subscription;
  private _completed$: Subscription;

  /** Progress bar worker */
  progressRef: ProgressbarRef;

  /** Progress state stream */
  state$: Observable<{ active: boolean, transform: string }>;

  /** Creates a new instance if id is not already exists */
  @Input() id = 'root';
  /** Initializes inputs from the global config */
  @Input() spinnerPosition: 'left' | 'right' = this._ngProgress.config.spinnerPosition;
  @Input() direction: 'ltr+' | 'ltr-' | 'rtl+' | 'rtl-' = this._ngProgress.config.direction;
  @Input() ease: string = this._ngProgress.config.ease;
  @Input() color: string = this._ngProgress.config.color;
  @Input() meteor: boolean = this._ngProgress.config.meteor;
  @Input() spinner: boolean = this._ngProgress.config.spinner;
  @Input() thick: boolean = this._ngProgress.config.thick;
  @Input() max: number = this._ngProgress.config.max;
  @Input() min: number = this._ngProgress.config.min;
  @Input() speed: number = this._ngProgress.config.speed;
  @Input() trickleSpeed: number = this._ngProgress.config.trickleSpeed;
  @Input() trickleFunc: (n: number) => number = this._ngProgress.config.trickleFunc;
  @Input() debounceTime: number = this._ngProgress.config.debounceTime;
  @Output() started = new EventEmitter();
  @Output() completed = new EventEmitter();

  constructor(private _ngProgress: ProgressbarService) {
  }

  ngOnChanges() {
    if (this.progressRef instanceof ProgressbarRef) {
      // Update progress bar config when inputs change
      this.progressRef.setConfig({
        max: (this.max > 0 && this.max <= 100) ? this.max : 100,
        min: (this.min < 100 && this.min >= 0) ? this.min : 0,
        speed: this.speed,
        trickleSpeed: this.trickleSpeed,
        trickleFunc: this.trickleFunc,
        debounceTime: this.debounceTime
      });
    }
  }

  ngOnInit() {
    // Get progress bar service instance
    this.progressRef = this._ngProgress.ref(this.id, {
      max: this.max,
      min: this.min,
      speed: this.speed,
      trickleSpeed: this.trickleSpeed,
      debounceTime: this.debounceTime
    });
    this.state$ = this.progressRef.state$.pipe(map((state: ProgressbarState) => ({
      active: state.active,
      transform: `translate3d(${state.value - 100}%,0,0)`
    })));
    /** Subscribes to started and completed events when user used them */
    if (this.started.observers.length) {
      this._started$ = this.progressRef.started.subscribe(() => this.started.emit());
    }
    if (this.completed.observers.length) {
      this._completed$ = this.progressRef.completed.subscribe(() => this.completed.emit());
    }
  }

  ngOnDestroy() {
    if (this._started$) {
      this._started$.unsubscribe();
    }
    if (this._completed$) {
      this._completed$.unsubscribe();
    }
    this._ngProgress.destroy(this.id);
  }


  @HostBinding('attr.role')
  get attrRole() {
    return 'progressbar';
  }
  @HostBinding('attr.dir')
  get attrDir() {
    return this.direction;
  }
  @HostBinding('attr.thick')
  get attrThick() {
    return this.thick;
  }


  start() {
    this.progressRef.start();
  }

  complete() {
    this.progressRef.complete();
  }

  inc(n ?: number) {
    this.progressRef.inc(n);
  }

  set(n: number) {
    this.progressRef.set(n);
  }

  get isStarted() {
    return this.progressRef.isStarted;
  }
}

import { Component, Input, HostBinding, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { mixinDisabled } from 'simple-ui/core';

export class SimOptgroupBase { }
export const _SimOptgroupMixinBase = mixinDisabled(SimOptgroupBase);

// 计数器的唯一 optgroup ID。
let _uniqueOptgroupIdCounter = 0;

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-optgroup',
  templateUrl: './optgroup.component.html',
  styleUrls: ['./optgroup.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptgroupComponent {
  @HostBinding('class.sim-optgroup') true;

  @HostBinding('class.sim-optgroup-disabled')
  @Input() disabled: boolean;
  // 选项组的标签。
  @Input() label: string;

  @HostBinding('attr.aria-labelledby')
  _labelId = `mat-optgroup-label-${_uniqueOptgroupIdCounter++}`;

}

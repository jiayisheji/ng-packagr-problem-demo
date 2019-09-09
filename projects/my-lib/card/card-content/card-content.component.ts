import {
  Component,
  ContentChild,
  TemplateRef,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  HostBinding
} from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-card-content',
  templateUrl: './card-content.component.html',
  styleUrls: ['./card-content.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardContentComponent {
  @HostBinding('class.sim-card-content') true;

  @ContentChild('skeleton', { static: false }) skeleton: TemplateRef<any>;

  // 标题
  @Input() loading: boolean;

}

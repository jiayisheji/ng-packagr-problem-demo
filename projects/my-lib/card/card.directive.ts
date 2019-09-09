import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-card-title,[sim-card-title], [simCardTitle]'
})
export class CardTitleDirective {
  @HostBinding('class.sim-card-title') true;

}


@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-card-subtitle,[sim-card-subtitle], [simCardSubtitle]'
})
export class CardSubtitleDirective {
  @HostBinding('class.sim-card-subtitle') true;

}

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-card-actions'
})
export class CardActionsDirective {
  @HostBinding('class.sim-card-actions') true;

  /** 卡内部动作的位置。 */
  @Input() align: 'start' | 'end' = 'start';

  @HostBinding('class.sim-card-actions-align-end')
  get cardActionsAlign() {
    return this.align === 'end';
  }

}

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[sim-card-avatar], [simCardAvatar]'
})
export class CardAvatarDirective {
  @HostBinding('class.sim-card-avatar') true;
}

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[sim-card-extra],[simCardExtra]'
})
export class CardExtraDirective {
  @HostBinding('class.sim-card-extra') true;
}

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'sim-card-footer'
})
export class CardFooterDirective {
  @HostBinding('class.sim-card-footer') true;

}


@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[sim-card-images], [simCardImage]'
})
export class CardImageDirective {
  @HostBinding('class.sim-card-images') true;

  @Input() size: string;

  @HostBinding('class.sim-card-sm-image')
  get cardSmImage () {
    return this.size === 'sm';
  }

  @HostBinding('class.sim-card-md-image')
  get cardMdImage() {
    return this.size === 'md';
  }

  @HostBinding('class.sim-card-lg-image')
  get cardLgImage() {
    return this.size === 'lg';
  }

  @HostBinding('class.sim-card-xl-image')
  get cardXlImage() {
    return this.size === 'xl';
  }

}

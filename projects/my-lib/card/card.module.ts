import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card.component';
import { CardHeaderComponent } from './card-header/card-header.component';
import { CardContentComponent } from './card-content/card-content.component';
import {
  CardActionsDirective,
  CardFooterDirective,
  CardTitleDirective,
  CardSubtitleDirective,
  CardImageDirective,
  CardAvatarDirective,
  CardExtraDirective
} from './card.directive';
import { CardSkeletonComponent } from './card-skeleton/card-skeleton.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardActionsDirective,
    CardFooterDirective,
    CardTitleDirective,
    CardSubtitleDirective,
    CardImageDirective,
    CardAvatarDirective,
    CardSkeletonComponent,
    CardExtraDirective,
  ],
  exports: [
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardActionsDirective,
    CardFooterDirective,
    CardTitleDirective,
    CardSubtitleDirective,
    CardImageDirective,
    CardAvatarDirective,
    CardExtraDirective,
  ]
})
export class CardModule { }

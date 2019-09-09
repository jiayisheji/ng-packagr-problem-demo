import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormDirective } from './form.directive';
import { ErrorDirective } from './error.directive';
import { HintDirective } from './hint.directive';
import { PrefixDirective } from './prefix.directive';
import { SuffixDirective } from './suffix.directive';
import { LabelDirective } from './label.directive';
import { FormFieldComponent } from './form-field.component';
import { ButtonModule } from 'simple-ui/button';
import { TipsDirective } from './tips.directive';


@NgModule({
    declarations: [
        FormDirective,
        ErrorDirective,
        HintDirective,
        PrefixDirective,
        SuffixDirective,
        LabelDirective,
        FormFieldComponent,
        TipsDirective
    ],
    imports: [CommonModule, ButtonModule],
    exports: [
        ButtonModule,
        FormDirective,
        ErrorDirective,
        HintDirective,
        PrefixDirective,
        SuffixDirective,
        LabelDirective,
        FormFieldComponent,
        TipsDirective
    ],
})
export class FormFieldModule { }

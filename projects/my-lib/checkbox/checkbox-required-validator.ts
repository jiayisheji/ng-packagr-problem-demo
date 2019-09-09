import {
    Directive,
    forwardRef,
    HostBinding,
} from '@angular/core';
import {
    CheckboxRequiredValidator,
    NG_VALIDATORS,
} from '@angular/forms';


/**
 * Validator for Material checkbox's required attribute in template-driven checkbox.
 * Current CheckboxRequiredValidator only work with `input type=checkbox` and does not
 * work with `sim-checkbox`.
 */
@Directive({
    // tslint:disable-next-line:directive-selector
    selector: `sim-checkbox[required][formControlName],
             sim-checkbox[required][formControl], sim-checkbox[required][ngModel]`,
    providers: [{
        provide: NG_VALIDATORS,
        useExisting: forwardRef(() => CheckboxRequiredValidatorDirective),
        multi: true
    }]
})
export class CheckboxRequiredValidatorDirective extends CheckboxRequiredValidator {
    @HostBinding('attr.required')
    get attrRequired() {
        return this.required ? '' : null;
    }
}

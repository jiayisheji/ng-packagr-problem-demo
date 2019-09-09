import { Constructor } from './constructor';
import { ElementRef } from '@angular/core';

/** @docs-private */
export interface CanColor {
    /** Theme color palette for the component. */
    color: ThemePalette;
}

/** @docs-private */
export interface HasElementRef {
    _elementRef: ElementRef;
}

/** Possible color palette values. */
export type ThemePalette = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | undefined;

/** Mixin to augment a directive with a `color` property. */
export function mixinColor<T extends Constructor<HasElementRef>>(base: T,
    defaultColor?: ThemePalette): Constructor<CanColor> & T {
    return class extends base {
        private _color: ThemePalette;

        get color(): ThemePalette { return this._color; }
        set color(value: ThemePalette) {
            const colorPalette = value || defaultColor;

            if (colorPalette !== this._color) {
                if (this._color) {
                    this._elementRef.nativeElement.classList.remove(`sim-${this._color}`);
                }
                if (colorPalette) {
                    this._elementRef.nativeElement.classList.add(`sim-${colorPalette}`);
                }

                this._color = colorPalette;
            }
        }

        constructor(...args: any[]) {
            super(...args);

            // Set the default color that can be specified from the mixin.
            this.color = defaultColor;
        }
    };
}


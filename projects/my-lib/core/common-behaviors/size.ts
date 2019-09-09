import { Constructor } from './constructor';
import { ElementRef } from '@angular/core';
import { HasElementRef } from './color';

/** @docs-private */
export interface CanSize {
    /** 组件的主题尺寸。 */
    size: ThemeSize;
}


/** 可能的尺寸值。 */
export type ThemeSize = 'lg' | 'sm' | 'md' | undefined;

/** Mixin 使用尺寸属性来增加指令。*/
export function mixinSize<T extends Constructor<HasElementRef>>(base: T,
    defaultSize?: ThemeSize): Constructor<CanSize> & T {
    return class extends base {
        private _size: ThemeSize;

        get size(): ThemeSize { return this._size; }
        set size(value: ThemeSize) {
            const size = value || defaultSize;
            if (size !== this._size) {
                if (this._size) {
                    this._elementRef.nativeElement.classList.remove(`sim-${this._size}`);
                }
                if (size) {
                    this._elementRef.nativeElement.classList.add(`sim-${size}`);
                }
                this._size = size;
            }
        }

        constructor(...args: any[]) {
            super(...args);

            // 设置可从 mixin 指定的默认尺寸。
            this.size = defaultSize;
        }
    };
}

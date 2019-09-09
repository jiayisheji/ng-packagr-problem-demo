import { InjectionToken } from '@angular/core';


/**
 * 此令牌用于将值应该设置为“SimInput”的对象注入。
 * 如果没有提供，则使用本机“HTMLInputElement”。
 * 像' SimDatepickerInput '这样的指令可以为这个令牌提供它们自己，以便让'SimInput'将值的获取和设置委托给它们。
 */
export const SIM_INPUT_VALUE_ACCESSOR = new InjectionToken<{ value: any }>('SIM_INPUT_VALUE_ACCESSOR');

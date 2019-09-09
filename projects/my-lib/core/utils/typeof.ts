/** 判断是否字符串 */
export const isString = (value: any): boolean => typeof value === 'string';
/** 判断是否undefined */
export const isUndefined = (value: any): boolean => typeof value === 'undefined';
/** 判断是否null */
export const isNull = (value: any): boolean => value == null;
/** 判断是否为array */
export const isArray = (value: any): boolean => Array.isArray(value);
/** 判断是否为function */
export const isFunction = (value: any): boolean => typeof value === 'function';
/** 判断是否为object */
export const isObject = (value: any): boolean => typeof value === 'object' && !isNull(value) && !isArray(value) && !isFunction(value);
/** 判断是否为数组对象 */
export const isArrayObject = (value: any): boolean => Array.isArray(value) && isObject(value[0]);
/** 判断是否为number 排除NaN */
export const isNumber = (value: any): boolean => typeof value === 'number' && value === value;
/** 判断是否为boolean */
export const isBoolean = (value: any): boolean => typeof value === 'boolean';
/** 判断是否为promise */
export const isPromise = (value: any): boolean => Object.prototype.toString.call(value) === '[object Promise]';
/** 判断是否为date */
export const isDate1 = (obj: any): boolean => obj instanceof Date || Object.prototype.toString.call(obj) === '[object Date]';
/** 判断是无 */
export const isNil = (value: any): boolean => value === undefined || value === null;
/** 判断对象属性存在 */
export const hasOwnProp = (value: any, prop: string): boolean => isObject(value) && value.hasOwnProperty(prop);
/**
 * 判断是否为空
 * 1. 空字符串
 * 2. 空数组
 * 3. 空对象
 * 4. null
 * 5. undefined
 */
export const isEmpty = (value: any): boolean =>
    isNil(value) ||
    value === '' ||
    (isArray(value) && !value.length) ||
    (isObject(value) && !Object.keys(value).length);
/** 判断字符串是否可以转换成json */
export const isValidJSON = (text: string) => {
    if (!isString(text)) {
        return false;
    }
    try {
        JSON.parse(text);
        return true;
    } catch (unusedVariable) {
        return false;
    }
};

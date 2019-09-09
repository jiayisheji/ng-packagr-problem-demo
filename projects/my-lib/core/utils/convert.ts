/** 强制转换成数组 */
export const toArray = <T>(value: T | T[]): T[] => {
    return Array.isArray(value) ? value : [value];
};

/** 强制转换成布尔值 */
export const toBoolean = (value: any): boolean => {
    return value != null && `${value}` !== 'false';
};

/** 强制转换成数字 */
export const toNumber = (value: any, fallbackValue = 0): number => {
    return isNaN(parseFloat(value as any)) || isNaN(Number(value)) ? fallbackValue : Number(value);
};

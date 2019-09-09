export class ProgressbarConfig {
    meteor?: boolean = true;
    spinner?: boolean = true;
    thick?: boolean = false;
    ease?: string = 'linear';
    spinnerPosition?: 'left' | 'right' = 'right';
    direction?: 'ltr+' | 'ltr-' | 'rtl+' | 'rtl-' = 'ltr+';
    color?: string = '#1B95E0';
    max?: number = 100;
    min?: number = 8;
    speed?: number = 200;
    trickleSpeed?: number = 300;
    debounceTime?: number = 0;
    trickleFunc?: (n: number) => number;
}

import { ViewContainerRef, InjectionToken } from '@angular/core';
import { AriaLivePoliteness } from '@angular/cdk/a11y';
import { Direction } from '@angular/cdk/bidi';

/** Injection token that can be used to access the data that was passed in to a snack bar. */
export const SIM_TOAST_DATA = new InjectionToken<any>('SimToastData');

/** Possible values for horizontalPosition on SimToastConfig. */
export type SimToastHorizontalPosition = 'start' | 'center' | 'end' | 'left' | 'right';

/** Possible values for verticalPosition on SimToastConfig. */
export type SimToastVerticalPosition = 'top' | 'center'|  'bottom';

/**
 * Configuration used when opening a snack-bar.
 */
export class SimToastConfig<D = any> {
    /** The politeness level for the SimAriaLiveAnnouncer announcement. */
    politeness?: AriaLivePoliteness = 'assertive';

    /** Message to be announced by the SimAriaLiveAnnouncer */
    announcementMessage?: string = '';

    /** The view container to place the overlay for the snack bar into. */
    viewContainerRef?: ViewContainerRef;

    /** The length of time in milliseconds to wait before autoSimically dismissing the snack bar. */
    duration?: number = 0;

    /** Extra CSS classes to be added to the snack bar container. */
    panelClass?: string | string[];

    /** Text layout direction for the snack bar. */
    direction?: Direction;

    /** Data being injected into the child component. */
    data?: D | null = null;

    /** The horizontal position to place the snack bar. */
    horizontalPosition?: SimToastHorizontalPosition = 'center';

    /** The vertical position to place the snack bar. */
    verticalPosition?: SimToastVerticalPosition = 'bottom';
}

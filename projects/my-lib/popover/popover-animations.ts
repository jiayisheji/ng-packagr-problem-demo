import {
    AnimationTriggerMetadata,
    trigger,
    state,
    style,
    animate,
    transition
} from '@angular/animations';

/** simPopover动画 */
export const simPopoverAnimations: {
    readonly popoverState: AnimationTriggerMetadata;
} = {
    /** popover输入和输出的动画。 */
    popoverState: trigger('state', [
        state('initial, void, hidden', style({ transform: 'scale(0)' })),
        state('visible', style({
            opacity: 1,
            transform: `scale(1)`
        })),
        transition('* => visible', [
            style({
                opacity: 0,
                transform: `scale(0)`
            }),
            animate(`200ms cubic-bezier(0.25, 0.8, 0.25, 1)`)
        ]),
        transition('* => hidden', [
            animate('50ms 100ms linear', style({ opacity: 0 }))
        ]),
    ]),
};

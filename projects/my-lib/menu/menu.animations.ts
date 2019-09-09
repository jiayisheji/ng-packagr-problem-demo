import {
    animate,
    state,
    style,
    transition,
    trigger,
    AnimationTriggerMetadata,
} from '@angular/animations';

/** Animations used by the MatFormField. */
export const simMenuAnimations: {
    readonly expandAnimation: AnimationTriggerMetadata
} = {
    /** Animation that transitions the form field's error and hint messages. */
    expandAnimation: trigger('expandAnimation', [
        state('expand', style({ height: '*' })),
        state('hidden', style({ height: 0, overflow: 'hidden' })),
        transition('expand => hidden', animate(150)),
        transition('hidden => expand', animate(150)),
        state('fade', style({ opacity: 1 })),
        transition('fade => void', [
            animate(150, style({ opacity: 0 }))
        ]),
        transition('void => fade', [
            style({ opacity: '0' }),
            animate(150)
        ]),
        state('bottom', style({
            opacity: 1,
            transform: 'scaleY(1)',
            transformOrigin: '0% 0%'
        })),
        transition('void => bottom', [
            style({
                opacity: 0,
                transform: 'scaleY(0.8)',
                transformOrigin: '0% 0%'
            }),
            animate('150ms cubic-bezier(0.23, 1, 0.32, 1)')
        ]),
        transition('bottom => void', [
            animate('150ms cubic-bezier(0.23, 1, 0.32, 1)', style({
                opacity: 0,
                transform: 'scaleY(0.8)',
                transformOrigin: '0% 0%'
            }))
        ])
    ])
};

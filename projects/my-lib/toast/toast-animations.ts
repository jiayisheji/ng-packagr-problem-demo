import {
    animate,
    state,
    style,
    transition,
    trigger,
    AnimationTriggerMetadata,
} from '@angular/animations';

/** @docs-private */
export class AnimationCurves {
    static STANDARD_CURVE = 'cubic-bezier(0.4,0.0,0.2,1)';
    static DECELERATION_CURVE = 'cubic-bezier(0.0,0.0,0.2,1)';
    static ACCELERATION_CURVE = 'cubic-bezier(0.4,0.0,1,1)';
    static SHARP_CURVE = 'cubic-bezier(0.4,0.0,0.6,1)';
}


/** @docs-private */
export class AnimationDurations {
    static COMPLEX = '375ms';
    static ENTERING = '225ms';
    static EXITING = '195ms';
}

/** Animations used by the Material snack bar. */
export const simToastAnimations: {
    readonly contentFade: AnimationTriggerMetadata;
    readonly toastState: AnimationTriggerMetadata;
    readonly messageState: AnimationTriggerMetadata;
    readonly notificationState: AnimationTriggerMetadata;
} = {
        /** Animation that slides the dialog in and out of view and fades the opacity. */
        contentFade: trigger('contentFade', [
            state('enter', style({ transform: 'none', opacity: 1 })),
            state('void', style({ transform: 'translate3d(0, 25%, 0) scale(0.9)', opacity: 0 })),
            state('exit', style({ transform: 'translate3d(0, 25%, 0)', opacity: 0 })),
            transition('* => *', animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)')),
        ]),

        /** Animation that shows and hides a snack bar. */
        toastState: trigger('state', [
            state('visible-top, visible-bottom', style({ transform: 'translateY(0%)' })),
            transition('visible-top => hidden-top, visible-bottom => hidden-bottom',
                animate(`${AnimationDurations.EXITING} ${AnimationCurves.ACCELERATION_CURVE}`)),
            transition('void => visible-top, void => visible-bottom',
                animate(`${AnimationDurations.ENTERING} ${AnimationCurves.DECELERATION_CURVE}`)),
        ]),

        messageState: trigger('message', [
            state('enter', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('* => enter', [
                style({ opacity: 0, transform: 'translateY(-50%)' }),
                animate('100ms linear')
            ]),
            state('leave', style({ opacity: 0, transform: 'translateY(-50%)' })),
            transition('* => leave', [
                style({ opacity: 1, transform: 'translateY(0)' }),
                animate('100ms linear')
            ])
        ]),

        notificationState: trigger('notification', [
            state('enterRight', style({ opacity: 1, transform: 'translateX(0)' })),
            transition('* => enterRight', [
                style({ opacity: 0, transform: 'translateX(5%)' }),
                animate('100ms linear')
            ]),
            state('enterLeft', style({ opacity: 1, transform: 'translateX(0)' })),
            transition('* => enterLeft', [
                style({ opacity: 0, transform: 'translateX(-5%)' }),
                animate('100ms linear')
            ]),
            state('leave', style({
                opacity: 0,
                transform: 'scaleY(0.8)',
                transformOrigin: '0% 0%'
            })),
            transition('* => leave', [
                style({
                    opacity: 1,
                    transform: 'scaleY(1)',
                    transformOrigin: '0% 0%'
                }),
                animate('100ms linear')
            ])
        ])
    };

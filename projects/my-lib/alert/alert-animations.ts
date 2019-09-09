import {
    animate,
    state,
    style,
    transition,
    trigger,
    AnimationTriggerMetadata,
} from '@angular/animations';

/** simAlert使用的动画。 */
export const simAlertAnimations: {
    readonly fadeAlert: AnimationTriggerMetadata;
} = {
    /** 将对话框滑入和滑出视图并淡化不透明度的动画。*/
    fadeAlert: trigger('fadeAlert', [
        state('*', style({ opacity: 1 })),
        transition('void => *', [
            style({ opacity: 0 }),
            animate('300ms cubic-bezier(0.78, 0.14, 0.15, 0.86)')
        ]),
        state('void', style({ opacity: 0 })),
        transition('* => void', [
            style({ opacity: 1 }),
            animate('300ms cubic-bezier(0.78, 0.14, 0.15, 0.86)')
        ])
    ])
};




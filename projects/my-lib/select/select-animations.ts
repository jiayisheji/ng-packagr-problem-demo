import {
    animate,
    AnimationTriggerMetadata,
    state,
    style,
    transition,
    trigger,
    query,
    animateChild,
    group,
} from '@angular/animations';

/**
 * The following are all the animations for the mat-select component, with each
 * const containing the metadata for one animation.
 *
 * The values below match the implementation of the AngularJS Material mat-select animation.
 */
export const matSelectAnimations: {
    readonly transformPanel: AnimationTriggerMetadata;
    readonly fadeInContent: AnimationTriggerMetadata;
} = {
        /**
         * 该动画将选择的覆盖面板在页面上和页面上进行转换。
         *
         * 当面板连接到DOM时，它的宽度会随着填充量的增加而增加，
         * 在Y轴上扩展到100%，在边框中逐渐消失，并稍微向上平移，
         * 以确保选项文本正确地与触发文本重叠。
         *
         * 当面板从DOM中删除时，它只是线性淡出。
         */
        transformPanel: trigger('transformPanel', [
            state('void', style({
                transform: 'scaleY(0)',
                minWidth: '100%',
                opacity: 0
            })),
            state('showing', style({
                opacity: 1,
                transform: 'scaleY(1)'
            })),
            state('showing-multiple', style({
                opacity: 1,
                transform: 'scaleY(1)'
            })),
            transition('void => *', group([
                query('@fadeInContent', animateChild()),
                animate('150ms cubic-bezier(0.25, 0.8, 0.25, 1)')
            ])),
            transition('* => void', [
                animate('250ms 100ms linear', style({ opacity: 0 }))
            ])
        ]),

        /**
         * 此动画在选择选项的背景色和文本内容中逐渐消失。
         * 在覆盖面板发生转换后，时间延迟到100ms。
         */
        fadeInContent: trigger('fadeInContent', [
            state('showing', style({ opacity: 1 })),
            transition('void => showing', [
                style({ opacity: 0 }),
                animate('150ms 100ms cubic-bezier(0.55, 0, 0.55, 0.2)')
            ])
        ])
    };

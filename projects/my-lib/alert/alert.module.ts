import { NgModule, ModuleWithProviders, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertComponent } from './alert.component';
import { AlertTipsDirective, AlertNotesDirective, USE_ALERT_TIPS_ICON, USE_ALERT_NOTES_ICON } from './alert.directive';
import { AlertTypeIcon } from './alert';

export interface AlertModuleConfig {
  tips?: AlertTypeIcon;
  notes?: AlertTypeIcon;
}

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [AlertComponent, AlertTipsDirective, AlertNotesDirective],
  exports: [AlertComponent, AlertTipsDirective, AlertNotesDirective],
  providers: [
    {
      provide: USE_ALERT_TIPS_ICON, useValue: {
        'success': 'icon-check-circle',
        'warning': 'icon-exclamation-circle',
        'info': 'icon-info-cirlce',
        'danger': 'icon-close-circle'
      }
    },
    {
      provide: USE_ALERT_NOTES_ICON, useValue: {
        'success': 'icon-check-circle-o',
        'warning': 'icon-exclamation-circle-o',
        'info': 'icon-info-cirlce-o',
        'danger': 'icon-close-circle-o'
      }
    },
  ]
})
export class AlertModule {
  static forRoot(config: AlertModuleConfig = {}): ModuleWithProviders {
    const tips = Object.assign({}, config.tips);
    const notes = Object.assign({}, config.notes);
    return {
      ngModule: AlertModule,
      providers: [
        { provide: USE_ALERT_TIPS_ICON, useValue: tips },
        { provide: USE_ALERT_NOTES_ICON, useValue: notes },
      ]
    };
  }
}

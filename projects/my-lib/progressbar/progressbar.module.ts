import { NgModule, ModuleWithProviders} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressbarComponent } from './progressbar.component';
import { ProgressbarConfig } from './progressbar-config';
import { CONFIG, ProgressbarService } from './progressbar.service';

export function ProgressbarFactory(config: ProgressbarConfig) {
  return new ProgressbarService(config);
}

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ProgressbarComponent],
  exports: [ProgressbarComponent]
})
export class ProgressbarModule {
  static forRoot(config?: ProgressbarConfig): ModuleWithProviders {
    return {
      ngModule: ProgressbarModule,
      providers: [
        { provide: CONFIG, useValue: config },
        {
          provide: ProgressbarService,
          useFactory: ProgressbarFactory,
          deps: [CONFIG]
        }
      ]
    };
  }
}

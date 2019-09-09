import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { ProgressbarService } from './progressbar.service';

@NgModule({
    declarations: [],
    imports: [CommonModule],
    exports: [],
    providers: [],
})
export class ProgressbarRouterModule {
    constructor(progress: ProgressbarService, router: Router) {
        router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                progress.start();
            }
            if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
                progress.complete();
            }
        });
    }
}

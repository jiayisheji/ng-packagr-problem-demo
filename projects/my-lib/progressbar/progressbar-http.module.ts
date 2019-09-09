import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ProgressbarService } from './progressbar.service';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class ProgressbarInterceptor implements HttpInterceptor {

    private _inProgressCount = 0;

    constructor(private _ngProgress: ProgressbarService) {
    }
    // 在此之后，将会支持忽略特定请求 https://github.com/angular/angular/issues/18155
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this._inProgressCount++;
        if (!this._ngProgress.ref('root').isStarted) {
            this._ngProgress.start();
        }
        return next.handle(req).pipe(finalize(() => {
            this._inProgressCount--;
            if (this._inProgressCount === 0) {
                this._ngProgress.complete();
            }
        }));
    }
}

@NgModule({
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ProgressbarInterceptor, multi: true }
    ],
})
export class ProgressbarHttpModule {}


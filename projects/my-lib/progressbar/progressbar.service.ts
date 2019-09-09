import { Injectable, Inject, Optional } from '@angular/core';
import { InjectionToken } from '@angular/core';
import { ProgressbarRef } from './progressbar-ref';
import { EMPTY } from 'rxjs';
import { ProgressbarConfig } from './progressbar-config';


export const CONFIG = new InjectionToken<ProgressbarConfig>('config');

@Injectable()
export class ProgressbarService {
    /** Stores ProgressbarRef instances */
    private readonly _instances = {};

    /** Global config */
    config: ProgressbarConfig;

    constructor(@Optional() @Inject(CONFIG) config: ProgressbarConfig) {
        this.config = { ...new ProgressbarConfig(), ...config };
        if (typeof this.config.trickleFunc !== 'function') {
            this.config.trickleFunc = (n: number): number => {
                if (n >= 0 && n < 20) { return 10; }
                if (n >= 20 && n < 50) { return 4; }
                if (n >= 50 && n < 80) { return 2; }
                if (n >= 80 && n < 99) { return 0.5; }
                return 0;
            };
        }
    }

    /**
     * Returns ProgressbarRef by ID
     */
    ref(id = 'root', config?: ProgressbarConfig) {
        if (this._instances[id] instanceof ProgressbarRef) {
            return this._instances[id];
        } else {
            config = { ...this.config, ...config };
            return this._instances[id] = new ProgressbarRef(config);
        }
    }

    setConfig(config: ProgressbarConfig, id = 'root') {
        if (this._instances[id] instanceof ProgressbarRef) {
            this._instances[id].setConfig(config);
        }
    }

    start(id = 'root') {
        if (this._instances[id] instanceof ProgressbarRef) {
            this._instances[id].start();
        }
    }

    set(n: number, id = 'root') {
        if (this._instances[id] instanceof ProgressbarRef) {
            this._instances[id].set(n);
        }
    }

    inc(n?: number, id = 'root') {
        if (this._instances[id] instanceof ProgressbarRef) {
            this._instances[id].inc(n);
        }
    }

    complete(id = 'root') {
        if (this._instances[id] instanceof ProgressbarRef) {
            this._instances[id].complete();
        }
    }

    isStarted(id = 'root') {
        return (this._instances[id] instanceof ProgressbarRef) ? this._instances[id].isStarted : false;
    }

    started(id = 'root') {
        return (this._instances[id] instanceof ProgressbarRef) ? this._instances[id].started : EMPTY;
    }

    completed(id = 'root') {
        return (this._instances[id] instanceof ProgressbarRef) ? this._instances[id].completed : EMPTY;
    }

    destroy(id = 'root') {
        if (this._instances[id] instanceof ProgressbarRef) {
            this._instances[id].destroy();
            this._instances[id] = null;
        }
    }

    destroyAll() {
        Object.keys(this._instances).map((key) => {
            this._instances[key].destroy();
            this._instances[key] = null;
        });
    }
}

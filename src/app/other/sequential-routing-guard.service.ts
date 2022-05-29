import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import { ObservableQueue } from './observable-queue';

@Injectable({
    providedIn: 'root',
})
export class SequentialRoutingGuardService {
    private queued = new WeakMap<ActivatedRouteSnapshot, ObservableQueue<boolean>>();
    private cannotActivate$ = of(false);


    public queue(snapshot: ActivatedRouteSnapshot | undefined, canActivate$: Observable<boolean>): Observable<boolean> {
        if (!snapshot) {
            return canActivate$;
        }

        let queue = this.queued.get(snapshot);

        if (!queue) {
            queue = new ObservableQueue<boolean>({
                queueMiddleware: (currentValue, currentQueue) => {
                    if (!currentValue) {
                        currentQueue.stop(this.cannotActivate$);
                    }
                },
            });

            this.queued.set(snapshot, queue);
        }

        return queue.queue(canActivate$);
    }
}

import {BehaviorSubject, concat, EMPTY, Observable, race} from 'rxjs';
import {switchMap, take, tap} from 'rxjs/operators';

export class ObservableQueue<VALUE> {
    private active = false;
    private pipeline: (() => void)[] = [];
    private stopped$ = new BehaviorSubject<{replacement$?: Observable<VALUE>} | undefined>(undefined);
    private queue$ = new Observable<never>(subscriber => {
        const next = () => {
            this.active = true;
            subscriber.complete();
        };

        if (!this.active) {
            next();
            return;
        }

        this.pipeline.push(next);

        return () => {
            const index = this.pipeline.indexOf(next);

            if (index >= 0) {
                this.pipeline.splice(index, 1);
            }
        };
    });

    constructor(private config?: {queueMiddleware?(currentValue: VALUE, queue: ObservableQueue<VALUE>): void}) {}

    private dequeue$ = new Observable<never>(() => {
        return () => {
            this.active = false;
            this.pipeline.shift()?.();
        };
    });

    public stop(replacement$?: Observable<VALUE>): void {
        this.stopped$.next({replacement$});
    }

    public queue<T>(source$: Observable<T>): Observable<T>;
    public queue(source$: Observable<VALUE>): Observable<VALUE> {
        const queueMiddleware = this.config?.queueMiddleware;

        if (queueMiddleware) {
            source$ = source$.pipe(tap(value => queueMiddleware(value, this)));
        }
        return concat(
            this.queue$,
            this.stopped$.pipe(
                take(1),
                switchMap(stopped => race(this.dequeue$, stopped ? stopped.replacement$ || EMPTY : source$)),
            ),
        );
    }

    public getState(): {active: boolean; queued: number} {
        return {active: this.active, queued: this.pipeline.length};
    }
}

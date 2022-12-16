import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { CookMessage, WaiterMessage } from '../models/messages';

@Injectable({
    providedIn: 'root'
})
export class SoloService {

    socketId: string;

    dishes: any;

    _waiter: Observable<WaiterMessage>;
    _cook: Observable<CookMessage>;

    constructor(
        public socket: Socket,
    ) { };

    
    get waiter(): Observable<WaiterMessage> {
        if(!this._waiter) {
            this.connect();
        }

        return this._waiter;
    }

    get cook(): Observable<CookMessage> {
        if(!this._cook) {
            this.connect();
        }

        return this._cook;
    }
    
    


    connect() {
        this._waiter = new Observable<WaiterMessage>(subs => {
            this.socket.on("waiter", (data: WaiterMessage) => {
                subs.next(data);
            });
        });
        this._cook = new Observable<CookMessage>(subs => {
            this.socket.on("cook", (data: CookMessage) => {
                subs.next(data);
            });
        });
    }
}

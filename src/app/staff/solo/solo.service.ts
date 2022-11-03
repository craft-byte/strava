import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SoloService {

    socketId: string;

    dishes: any;

    obs: Observable<any>;

    constructor(
        public socket: Socket,
    ) { };

    
    get flow(): Observable<any> {
        if(this.obs) {
            return this.obs;
        } else {
            this.connect();
            return this.obs;
        }
    }
    


    connect() {
        this.obs = new Observable<any>(subs => {
            this.socket.on("waiter", (data: any) => {
                subs.next(data);
            });
            this.socket.on("kitchen", (data: any) => {
                subs.next(data);
            });
        });
    }
}

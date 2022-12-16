import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    dishes: { name: string; price: number; quantity: number; _id: string; }[] = [];
    dishesQuantity: number;
    user: { name: string; _id: string; avatar: any; };

    type: "takeout" | "dinein";
    id: string;

    comment: string;

    types: "both" | "dinein" | "takeout" | "none";

    us: "noinfo" | "loggedin" | "loggedout"; // user status

    settings: any;

    constructor(
        public socket: Socket,
    ) { };


    public get socketId(): string {
        return this.socket.ioSocket.id;
    }

    subs() {
        return new Observable(subs => {
            this.socket.on("customer", data => {
                subs.next(data);
            });
        })
    }




}

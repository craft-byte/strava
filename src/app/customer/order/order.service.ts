import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { CustomerMessage } from './other/models/messages';
import { OrderDish, OrderType } from './other/models/order';
import { UserStatus } from './other/models/user';

interface Settings {
    allowTakeOut?: boolean;
    allowDineIn?: boolean;
    onlineOrdering?: boolean;
    maxDishes?: number;
    cashPayments?: boolean;
    cardPayments?: boolean;
};

interface Restaurant {
    _id: string;
    name: string;
    theme: string;
}

interface Order {
    dishes: { amount: number; price: number; name: string; dishId: string; }[];
    type: "dinein" | "takeout";
    id: string;
}


@Injectable({
    providedIn: 'root'
})
export class OrderService {

    dishes: OrderDish[];
    type: OrderType;
    id: string;
    _id: string;
    comment: string;

    restaurant: Restaurant;
    settings: Settings;

    customerToken: string;

    userStatus: UserStatus;
    


    private _flow: Observable<CustomerMessage>;


    constructor(
        public socket: Socket,
    ) { };


    public get socketId(): string {
        return this.socket.connect().id;
    }

    get flow() {
        if(!this._flow) {
            this._flow = new Observable<CustomerMessage>(subs => {
                this.socket.on("customer", data => {
                    subs.next(data);
                });
            })
        }

        return this._flow;
    }

    send() {

    }


}
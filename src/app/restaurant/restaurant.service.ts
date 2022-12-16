import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Dish } from 'src/models/dish';
import { Restaurant } from 'src/models/general';

@Injectable({
    providedIn: 'root'
})
export class RestaurantService {

    url = environment.url + "/restaurant/";

    restaurant: Restaurant;

    showGoWork: boolean;

    constructor(
        private http: HttpClient,
    ) { };


    patch<T>(body: any, ...args: string[]) {
        if (!this.restaurant._id) {
            return null;
        }
        return this.http.patch<T>(this.url + this.restaurant._id + "/" + args.join("/"), body).toPromise();
    }
    delete<T>(...args: string[]) {
        if (!this.restaurant._id) {
            return null;
        }
        return this.http.delete<T>(this.url + this.restaurant._id + "/" + args.join("/")).toPromise();
    }
    get<T>(params: { [key: string]: string | boolean | number }, ...args: string[]) {
        if (!this.restaurant._id) {
            return null;
        }
        return this.http.get<T>(this.url + this.restaurant._id + "/" + args.join("/"), { params, headers: {} }).toPromise();
    }
    post<T>(body: any, ...args: string[]) {
        if (!this.restaurant._id) {
            return null;
        }
        return this.http.post<T>(this.url + this.restaurant._id + "/" + args.join("/"), body).toPromise();
    }

    async init(restaurantId: string) {
        const result = await this.http.get<{ restaurant: Restaurant; showGoWork: boolean; }>(this.url + restaurantId + "/check").toPromise();

        if(result.restaurant) {
            this.restaurant = result.restaurant;

            if(result.showGoWork) {
                this.showGoWork = result.showGoWork;
            }
        }
    }
}

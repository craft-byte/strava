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
  restaurantId: string;
  restaurant: Restaurant;
  restaurants: { _id: string; name: string; }[];
  currentDish: Dish;
  showGoWork: boolean;

  constructor(
    private http: HttpClient,
  ) { };


  patch<T>(body: any, ...args: string[]) {
    if(!this.restaurantId) {
      return null;
    }
    return this.http.patch<T>(this.url + this.restaurantId + "/" + args.join("/"), body).toPromise();
  }
  delete<T>(...args: string[]) {
    if(!this.restaurantId) {
      return null;
    }
    return this.http.delete<T>(this.url + this.restaurantId + "/" + args.join("/")).toPromise();
  }
  get<T>(params: { [key: string]: string | boolean | number }, ...args: string[]) {
    if(!this.restaurantId) {
      return null;
    }
    return this.http.get<T>(this.url + this.restaurantId + "/" + args.join("/"), { params }).toPromise();
  }
  post<T>(body: any, ...args: string[]) {
    if(!this.restaurantId) {
      return null;
    }
    return this.http.post<T>(this.url + this.restaurantId + "/" + args.join("/"), body).toPromise();
  }

  init(restaurantId: string) {
    this.restaurantId = restaurantId;

    return this.http.get(this.url + this.restaurantId + "/init");


    // const result: any = await this.get("init");
    
    // // if(!result) {
    // //   return null;
    // // }

    // // const { restaurant, user } = result;

    // // this.restaurant = restaurant;

    // return user as boolean;
  }
}

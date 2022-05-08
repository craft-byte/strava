import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Worker } from 'src/models/components';
import { Restaurant } from 'src/models/general';

@Injectable({
  providedIn: 'root'
})
export class RadminService {

  url = environment.url + "/radmin/";

  
  restaurant: Restaurant;
  restaurantId: string;

  role: string;


  constructor(
    private http: HttpClient, 
    private router: Router,
  ) { };

  post<T>(body: any, ...args: string[]) {
    return this.http.post<T>(this.url + this.restaurantId + "/" + args.join("/"), body).toPromise();
  }
  patch<T>(body: any, ...args: string[]) {
    const url = this.url + this.restaurantId + "/" + args.join("/");
    return this.http.patch<T>(url, body).toPromise();  
  }
  get<T>(...args: string[]) {
    return this.http.get<T>(this.url + this.restaurantId + "/" + args.join("/")).toPromise();
  }
  delete<T>(...args: string[]) {
    return this.http.delete<T>(this.url + this.restaurantId + "/" + args.join("/")).toPromise();
  }

  async   initUser() {
    const result = await this.get("self", this.restaurantId);

    return result;
  }
  async getRestaurant(restaurantId?: string) {
    if(restaurantId) {
      this.restaurantId = restaurantId;
    }
    if(!this.restaurant) {
      if(!this.restaurantId) {
        this.router.navigate(["user/info"], { replaceUrl: true });
        return null;
      }
      const result = await this.get<Restaurant>("");

      this.restaurant = result;
      return result;
    } else {
      if(this.restaurant._id != restaurantId) {
        this.restaurant = await this.get<Restaurant>("");
        return this.restaurant;
      }
      return this.restaurant;
    }
  }
}

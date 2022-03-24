import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Restaurant, Work } from 'src/models/radmin';
import { MainService } from '../main.service';

@Injectable({
  providedIn: 'root'
})
export class RadminService {

  url = environment.url + "/radmin";
  
  restaurant: Restaurant;
  work: Work;


  constructor(
    private http: HttpClient, 
    private main: MainService,
    private route: ActivatedRoute
  ) { };

  async handleHttpError(res: HttpErrorResponse) {
    switch (res.status) {
      case 401:
        return await this.main.login(true);
    
      default:
        break;
    }
  }

  post<T>(body: any, ...args: string[]) {
    return this.http.post<T>(this.url + "/" + args.join("/"), body).toPromise();
  }
  patch<T>(body: any, ...args: string[]) {
    const url = this.url + "/" + args.join("/");
    return this.http.patch<T>(url, body).toPromise();  
  }
  get<T>(...args: string[]) {
    return this.http.get<T>(this.url + "/" + args.join("/")).toPromise();
  }
  delete<T>(...args: string[]) {
    return this.http.delete<T>(this.url + "/" + args.join("/")).toPromise();
  }


  async getRestaurant(t?: "settings" | "components" | "staff") {
    if(!this.restaurant) {
      const restaurant = this.route.snapshot.queryParamMap.get("restaurant");
      const { restaurant: r, work } = await this.get<{restaurant: Restaurant; work: Work}>("getRestaurant", t || "exists", restaurant);

      this.restaurant = r;
      this.work = work;
      return this.restaurant;
    }
    if(!t) {
      return this.restaurant;
    }
    const { restaurant } = await this.get("getRestaurant", t, this.restaurant._id);
    this.restaurant = Object.assign(this.restaurant, restaurant);
    return this.restaurant;
  }
}

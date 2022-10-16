import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { OrderService } from './order/order.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  base = environment.url + "/customer";

  restaurantId: string;
  theme: string;




  constructor(
    private http: HttpClient,
    private order: OrderService,
    private route: ActivatedRoute,
  ) { };

  get<T>(queryParams: { [key: string]: string; }, ...path: string[]) {
    if(this.order && this.order.us && this.order.us == "noinfo") {
        const token = localStorage.getItem("ct") || this.route.snapshot.queryParamMap.get("ct");
        return this.http.get<T>(this.base + "/" + path.join("/"), { params: queryParams, headers: { "Customer-Token": token } }).toPromise();
    }
    return this.http.get<T>(this.base + "/" + path.join("/"), { params: queryParams }).toPromise();
  }
  post<T>(body: any, ...path: string[]) {
    if(this.order && this.order.us && this.order.us == "noinfo") {
        const token = localStorage.getItem("ct") || this.route.snapshot.queryParamMap.get("ct");
        return this.http.post<T>(this.base + "/" + path.join("/"), body, { headers: { "Customer-Token": token } }).toPromise();
    }
    return this.http.post<T>(this.base + "/" + path.join("/"), body).toPromise();
  }
  delete<T>(queryParams: { [key: string]: string; }, ...path: string[]) {
    if(this.order && this.order.us && this.order.us == "noinfo") {
        const token = localStorage.getItem("ct") || this.route.snapshot.queryParamMap.get("ct");
        return this.http.delete<T>(this.base + "/" + path.join("/"), { params: queryParams, headers: { "Customer-Token": token } }).toPromise();
    }
    return this.http.delete<T>(this.base + "/" + path.join("/"), { params: queryParams }).toPromise();
  }
  patch<T>(body: any, ...path: string[]) {
    return this.http.patch<T>(this.base + "/" + path.join("/"), body).toPromise();
  }

  getobs<T>(body: any, ...path: string[]) {
    return this.http.post<T>(this.base + "/" + path.join("/"), body);
  }



}

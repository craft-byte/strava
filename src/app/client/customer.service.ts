import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Connection, CustomerConnectData, CustomerResponse, Dish } from 'src/models/customer';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  url = environment.url + "/customer";
  restaurant: string;
  currentDish: Dish;
  table: number;
  socketId: string;
  restaurantId: string;
  mainUrl: string;
  payments: string[];
  totalPrice = 0;
  types;
  dtype: string;

  menuId: string;

  type: "order" | "table";

  dishes: { dish: string; quantity: number; }[] = [];
  confirmed: string[] = [];
  answers: {
    answers: { question: string; answer: string }[];
    dish: string;
  }[] = [];

  constructor(
    private socket: Socket,
    private http: HttpClient,
    private router: Router
  ) {
  }

  go(params: Object, ...paths: string[]) {
    this.router.navigate(paths, { queryParams: params });
  }

  get<T>(link: string, params: string[], body?: any) {
    let url = `${this.url}/${link}/${params.join("/")}`;
    if(url[url.length - 1] === "/") {
      url = url.substring(0, url.length - 1);
    }
    if(body) {
      return this.http.patch<T>(url, body).toPromise();
    }
    return this.http.get<T>(url).toPromise();
  }

  addAnswer(answers: { question: string; answer: string }[], dish: string) {
    this.answers.push({ answers, dish });
  }
  addDish(id: string) {
    for(let i of this.dishes) {
      if(i.dish == id) {
        i.quantity++;
        this.setDishes();
        return;
      }
    }
    this.dishes.push({ dish: id, quantity: 1 });
    this.setDishes();
    return;
  }
  
  confirm(comment: string, toTime: number) {
    this.socket.emit("confirm", 
      { 
        dishes: this.dishes, 
        comment, 
        type: this.type, 
        typeData: { restaurant: this.restaurantId, time: toTime },
        answers: this.answers 
      }
    );
    this.dishes = [];
  }
  setDishes() {
    localStorage.setItem("CTRABANOTABLESESSIONDISHES", JSON.stringify(this.dishes));
  }
  async init() {
    this.dishes = JSON.parse(localStorage.getItem("CTRABANOTABLESESSIONDISHES"));
    if(!this.dishes) {
      this.dishes = [];
      localStorage.setItem("CTRABANOTABLESESSIONDISHES", "[]");
    }
  }
  allow(access: boolean, user: string) {
    this.socket.emit("access", { access, id: user });
  }
  start(data: CustomerConnectData) {
    this.socket.emit("customerConnect", data);
    this.table = +data.table;
    return new Observable<CustomerResponse>(subs => {
      this.socket.on("customerResponse", (data: CustomerResponse) => {
        if(data.type == "connection/success") {
          this.restaurantId = (data.data as Connection).restaurant._id;
        }
        subs.next(data);
      });
    });
  }
  getFull(id: string) {
    if(!this.restaurant) {
      return;
    }
    return this.http.get<Dish>(`${this.url}/dishes/full/${this.restaurant}/${id}`).toPromise();
  }
}

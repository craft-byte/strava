import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StaffResponse, TakeAndDone } from 'src/models/staff';

@Injectable({
  providedIn: 'root'
})
export class StaffService implements OnInit {

  restaurant: string;
  sname: string;
  username: string;
  user: string;

  infoId: Subject<string> = new Subject();


  url = environment.url + "/staff";

  constructor(
    private http: HttpClient,
    private router: Router,
    private socket: Socket
  ) {
  };
  
  go(p: Object, ...args: string[]) {
    this.router.navigate(args, { replaceUrl: true, queryParams: p });
  }


  get<T>(link: string[], params: string[], data?: Object) {
    if(data) {
      let url = `${this.url}/${link.join("/")}/${params.join("/")}`;
      if(url[url.length - 1] === "/") {
        url = url.substring(0, url.length - 1);
      }
      return this.http.patch<T>(url, data).toPromise();
    } else {
      return this.http.get<T>(`${this.url}/${link.join("/")}/${params.join("/")}`).toPromise();
    }
  }


  login2(s: string, p: string) {
    this.socket.emit("login2", { s, p });
    return new Observable<StaffResponse>(subs => {
      this.socket.on("staffResponse", data => {
        subs.next(data);
      })
    });
  }
  getSettings(id: string) {
    return this.http.get<{ settings: { withNoAccount: boolean } }>(`${this.url}/settings/${id}`).toPromise();
  }
  login(data: { restaurant: string; user: string; }): Observable<StaffResponse> {
    this.socket.emit("login", data);
    return new Observable<StaffResponse>(subs => {
      this.socket.on("staffResponse", (data: StaffResponse) => {
        subs.next(data);
      });
    });
  }
  kitchen() {
    this.socket.emit("staffConnect", { restaurant: this.restaurant, type: "kitchen" });
    return new Observable<StaffResponse>(subs => {
      this.socket.on("staffResponse", data => {
        subs.next(data);
      });
    });    
  }
  doneDish(dishId: string, orderId: string, _id: string, types: string[]) {
    this.socket.emit("kitchen/done", { dishId, orderId, _id, types });
  }
  removeDish(data: { orderId: string; _id: string }) {
    this.socket.emit("kitchen/dish/remove", data);
  }
  takeDish(data: TakeAndDone, is: boolean) {
    this.socket.emit("kitchen/take", {data, is});
  }
  removeOrder(id: string) {
    this.socket.emit("kitchen/order/remove", { orderId: id });
  }
  removeAnswer(data: { answerId: string, orderId: string }) {
    this.socket.emit("kitchen/answer/remove", data);
  }
  doneOrder(id: string) {
    this.socket.emit("kitchen/order/fullDone", { orderId: id });
  }
  waiter(): Observable<StaffResponse> {
    this.socket.emit("staffConnect", { type: "waiter" });
    return new Observable<StaffResponse>(subs => {
      this.socket.on("staffResponse", data => {
        subs.next(data);
      });
    });
  }
  waiterDone(orderId: string, dishId: string) {
    this.socket.emit("waiter/done", {orderId, dishId});
  }
  waiterFullDone(id: string) {
    this.socket.emit("waiter/order/done", { orderId: id });
  }

  ngOnInit(): void {
      console.log("STAFF SERVICE INJECTED");
  }
}

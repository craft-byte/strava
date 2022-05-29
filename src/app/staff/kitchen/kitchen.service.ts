import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core'
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { KitchenResponse } from 'src/models/kitchen';

@Injectable({
  providedIn: 'root'
})
export class KitchenService {

  url = environment.url + "/staff/kitchen/";

  dishes: {
    a: any[],
    so: any[],
    si: any[],
    sa: any[],
    b: any[],
    e: any[],
    d: any[]
  } = null;
  convertedDishes = null;

  constructor(
    private socket: Socket,
  ) {
    this.dishes = {
      a: [],
      so: [],
      si: [],
      sa: [],
      b: [],
      e: [],
      d: []
    };
  }

  emit(path: string, data: any) {
    this.socket.emit(path, data);
  }

  connect(restaurantId: string, userId: string) {
    this.socket.emit("kitchenConnect", { userId, restaurantId });
    return new Observable<KitchenResponse>(subs => {
      this.socket.on("kitchen", (data: any) => subs.next(data));
    });
  }



}

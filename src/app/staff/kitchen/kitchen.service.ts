import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core'
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Dish } from 'src/models/dish';
import { KitchenResponse } from 'src/models/kitchen';

@Injectable({
  providedIn: 'root'
})
export class KitchenService {

  url = environment.url + "/staff/kitchen/";

  dishes: { [dishId: string]: Dish } = null;
  convertedDishes = null;

  flow: Observable<KitchenResponse>;

  constructor(
    private socket: Socket,
  ) {
  }

  emit(path: string, data: any) {
    this.socket.emit(path, data);
  }

  connect(restaurantId: string, userId: string) {
    this.socket.emit("kitchenConnect", { userId, restaurantId });
    this.flow = new Observable<KitchenResponse>(subs => {
      this.socket.on("kitchen", (data: any) => subs.next(data));
    });
    return this.flow;
  }



}

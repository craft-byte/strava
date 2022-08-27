import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core'
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { MainService } from 'src/app/services/main.service';
import { environment } from 'src/environments/environment';
import { Dish } from 'src/models/dish';
import { KitchenResponse } from 'src/models/kitchen';
import { StaffService } from '../staff.service';

@Injectable({
  providedIn: 'root'
})
export class KitchenService implements OnInit {

  // url = environment.url + "/staff/kitchen/";

  socketId: string;
  dishes: { [dishId: string]: Dish } = null;
  convertedDishes = null;

  flow: Observable<KitchenResponse>;

  constructor(
    public socket: Socket,
    private server: StaffService,
  ) {}

  emit(path: string, data: any) {
    this.socket.emit(path, data);
  }

  connect() {
    // params     restaurantId: string, userId: string
    // this.socket.connect();
    // this.socket.emit("kitchenConnect", { userId, restaurantId });
    this.flow = new Observable<KitchenResponse>(subs => {
      this.socket.on("kitchen", (data: any) => subs.next(data));
    });
    return this.flow;
  }


  ngOnInit(): void {
  //   setInterval(() => {
  //     if(this.socket.ioSocket.disconnected) {
  //       this.socket.connect();
  //       this.server.post({ id: this.socket.ioSocket.id, joinTo: "kitchen" }, "socketReconnect");
  //     }
  //   }, 2000)
  }

}

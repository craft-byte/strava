import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WaiterService {

  constructor(
    private socket: Socket
  ) { };

  emit(str: string, data: any) {
    this.socket.emit(str, data);
  }

  connect(userId: string, restaurantId: string) {
    this.socket.emit("waiterConnect", { userId, restaurantId });
    return new Observable(subs => {
      this.socket.on("waiter", (data: any) => {
        subs.next(data);
      });
    });
  }
}

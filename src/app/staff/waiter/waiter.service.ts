import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { WaiterResponse } from 'server/src/models/responses';

@Injectable({
  providedIn: 'root'
})
export class WaiterService {

  socketId: string;
  flow: Observable<WaiterResponse>;

  constructor(
    public socket: Socket
  ) { };

  emit(str: string, data: any) {
    this.socket.emit(str, data);
  }

  connect() {
    this.flow = new Observable<WaiterResponse>(subs => {
      this.socket.on("waiter", (data: any) => subs.next(data));
    });
    return this.flow;
  }
}

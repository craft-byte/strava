import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { KitchenService } from '../staff/kitchen/kitchen.service';


@Injectable({
  providedIn: 'root'
})
export class KitchenSocketIdGuard implements CanActivate {


  constructor(
    private kitchen: KitchenService,
  ) {}

  canActivate(): Promise<boolean> {
    return new Promise((rs, rj) => {
      if(this.kitchen.socketId) {
        return rs(true);
      } else if(this.kitchen.socket.ioSocket.id) {
        this.kitchen.socketId = this.kitchen.socket.ioSocket.id;
        return rs(true);
      }
      this.kitchen.socket.on("connect", () => {
        this.kitchen.socketId = this.kitchen.socket.ioSocket.id;
        rs(true);
      });
    });
  }
  
}

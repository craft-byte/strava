import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { WaiterService } from '../staff/waiter/waiter.service';

@Injectable({
  providedIn: 'root'
})
export class WaiterSocketIdGuard implements CanActivate {

  constructor(
    private waiter: WaiterService,
  ) {}

  canActivate(): Promise<boolean> {
    return new Promise((rs, rj) => {
      if(this.waiter.socketId) {
        return rs(true);
      } else if(this.waiter.socket.ioSocket.id) {
        this.waiter.socketId = this.waiter.socket.ioSocket.id;
        return rs(true);
      }
      this.waiter.socket.on("connect", () => {
        console.log("ON CONNECT + ID", this.waiter.socket.ioSocket.id);
        this.waiter.socketId = this.waiter.socket.ioSocket.id;
        rs(true);
      });
    });
  }
}

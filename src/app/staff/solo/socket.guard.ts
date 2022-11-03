import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { StaffService } from '../staff.service';
import { SoloService } from './solo.service';
import { Observable } from "rxjs";
import { SequentialRoutingGuardService } from 'src/app/other/sequential-routing-guard.service';

@Injectable({
    providedIn: 'root'
})
export class SocketGuard implements CanActivate {

    constructor(
        private soc: SoloService,
        private service: StaffService,
        private sequentialRoutingGuardService: SequentialRoutingGuardService,
    ) {}


    check(socketId: string) {
        return new Observable<boolean>(subs => {
            this.service.post({ socketId }, "solo").then((result: boolean) => {
                if(result === true) {
                    return subs.next(true);
                }
                subs.next(false);
            }).catch(e => {
                console.error(e);
                subs.next(false);
            });
        });
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const obs = new Observable<boolean>(subs => {
            if (this.soc.socketId) {
                this.check(this.soc.socketId).subscribe(res => subs.next(res));
                return;
            } else if (this.soc.socket.ioSocket?.id) {
                this.soc.socketId = this.soc.socket.ioSocket.id;
                this.check(this.soc.socketId).subscribe(res => subs.next(res));
                return;
            }
            this.soc.socket.on("connect", () => {
                this.soc.socketId = this.soc.socket.ioSocket.id;
                this.check(this.soc.socketId).subscribe(res => subs.next(res));
            });
        });

        return this.sequentialRoutingGuardService.queue(
            route, obs
        );
    }

}

import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class LoadService {

    cur: HTMLIonLoadingElement;
    timeout: any;

    constructor(
        private loadingCtrl: LoadingController,
    ) { };



    end() {
        this.cur?.dismiss();
        this.cur = null;
    }
    async start(long: boolean = false) {
        if (this.cur) {
            return;
        }

        this.cur = await this.loadingCtrl.create({
            spinner: "dots",
            mode: "ios",
            cssClass: "loading",
            duration: long ? 300000 : 5000,
        });
        await this.cur.present();
    }


}

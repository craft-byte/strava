import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadService {

  cur: any;
  timeout: any;

  constructor(
    private loadingCtrl: LoadingController,
  ) { };


  async load<T>(request: T) {

    const loading = await this.loadingCtrl.create({
      spinner: "dots",
      mode: "ios",
      cssClass: "loading"
    });

    await loading.present();

    this.timeout = setTimeout(() => {
      this.end();
    }, 5000);

    try {
      const result = await request;

      loading.remove();

      return result;
    } catch (error) {
      loading.remove();

      throw error;
    }
  }

  end() {
    if(this.cur) {
      clearTimeout(this.timeout);
      setTimeout(() => {
        this.cur.remove();
        this.cur = null;
      }, 250);
    }
  }
  async start() {
    if(this.cur) {
      return;
    }
    this.cur = await this.loadingCtrl.create({
      spinner: "dots",
      mode: "ios",
      cssClass: "loading",
    });

    this.timeout = setTimeout(() => {
      this.end();
    }, 5000);
    await this.cur.present();
  }


}

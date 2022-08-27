import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from 'src/app/restaurant/services/restaurant.service';
import { ManagerSettings } from 'src/models/components';

interface User {
  name: string;
  username: string;
  _id: string;
}

@Component({
  selector: 'app-set-up',
  templateUrl: './set-up.page.html',
  styleUrls: ['./set-up.page.scss'],
})
export class SetUpPage implements OnInit {

  user: User;
  role = "manager";

  settings: ManagerSettings = {
    work: {
      waiter: false,
      cook: false,
    },
    dishes: false,
    customers: false,
    staff: false,
    settings: false,
    components: false,
  }
  ui = {
    showAll: false,
    showWorks: false,
    errorMessage: ""
  }

  constructor(
    private service: RestaurantService,
    private router: RouterService,
    private loader: LoadService,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
  ) { };

  set(f1: string, f2?: string) {
    if(f2) {
      this.settings[f1][f2] = !this.settings[f1][f2];
    } else {
      this.settings[f1] = !this.settings[f1];
    }
  }

  back() {
    this.router.go(["restaurant", this.service.restaurantId, "people", "staff"], { replaceUrl: true });
  }

  async submit() {
    await this.loader.start();
    try {
      const result: any = await this.service.post({ settings: this.settings, userId: this.user._id, role: this.role }, "staff");
  
      if(result.done) {
        (await this.toastCtrl.create({
          duration: 4000,
          color: "green",
          mode: "ios",
          message: "Worker added.",
        })).present();
        this.back();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          color: "red",
          mode: "ios",
          message: "Somehing went wrong. Try again later",
        })).present();
        this.loader.end();
      }
    } catch (e) {
      if(e.status == 422) {
        if(e.body.reason == "settings") {
          this.ui.errorMessage = "Settings are invalid.";
        }
      } else if(e.status == 403) {
        if(e.body.reason == "works") {
          this.ui.showWorks = true;
          this.ui.showAll = false;
        }
      }
    }
    this.loader.end();
  }

  async ngOnInit() {
    await this.loader.start();
    const userId = this.route.snapshot.paramMap.get("userId");

    this.user = await this.service.get({}, "user", userId);

    if((this.user as any).works) {
      this.ui.showAll = false;
      this.ui.showWorks = true;
      this.loader.end();
      return;
    }
    this.ui.showAll = true;
    this.loader.end();
  }

}

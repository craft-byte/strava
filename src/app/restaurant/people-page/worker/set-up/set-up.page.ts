import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
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
    dishes: {
      add: false,
      remove: false,
    },
    customers: {
      blacklisting: false,
    },
    staff: {
      hire: false,
      fire: false,
      settings: false,
    },
    components: {
      add: false,
      remove: false,
    },
    restaurant: {
      logo: false,
      theme: false,
    }
  }
  ui = {
    showAll: false,
    showWorks: false,
  }

  constructor(
    private service: RestaurantService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
  ) { };

  set(f1: string, f2: string) {
    this.settings[f1][f2] = !this.settings[f1][f2];
  }

  back() {
    this.router.navigate(["restaurant", this.service.restaurantId, "people", "staff"], { replaceUrl: true });
  }

  async submit() {
    const result: any = await this.service.post({ settings: this.settings, userId: this.user._id, role: this.role }, "staff");

    if(result.done) {
      (await this.toastCtrl.create({
        duration: 4000,
        color: "green",
        mode: "ios",
        message: "Invitation has been sent.",
      })).present();
      this.back();
    } else {
      (await this.toastCtrl.create({
        duration: 4000,
        color: "red",
        mode: "ios",
        message: "Somehing went wrong. Try again later",
      })).present();
    }
  }

  async ngOnInit() {
    const userId = this.route.snapshot.paramMap.get("userId");

    this.user = await this.service.get("user", userId);

    if((this.user as any).works) {
      this.ui.showAll = false;
      this.ui.showWorks = true;
      return;
    }
    this.ui.showAll = true;
  }

}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.page.html',
  styleUrls: ['./theme.page.scss'],
})
export class ThemePage implements OnInit {

  color: "string";
  restaurantId: string;

  ui = {
    name: "",
    message: "",
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: UserService,
    private toastCtrl: ToastController,
  ) { };

  exit() {
    this.router.navigate(["restaurant", this.restaurantId], { replaceUrl: true });
  }

  async submit() {
    if(!this.color) {
      return this.ui.message = "Pick a color";
    }
    const result: any = await this.service.post({ color: this.color }, "add-restaurant/theme", this.restaurantId);

    if(result.success) {
      this.router.navigate(["restaurant", this.restaurantId], { replaceUrl: true });
    } else {
      this.ui.message = "Something went wrong. Plase, try again";
    }
  }

  async ngOnInit() {
    this.restaurantId = this.route.snapshot.paramMap.get("restaurantId");
    const restaurant: any = await this.service.get("add-restaurant/name", this.restaurantId);

    if(!restaurant) {
      (await this.toastCtrl.create({
        duration: 3000,
        message: "Restaurant not found.",
        color: "red",
        mode: "ios"
      })).present();
      return this.router.navigate(["user/info"], { replaceUrl: true });
    }

    this.ui.name = restaurant.name;
  }

}

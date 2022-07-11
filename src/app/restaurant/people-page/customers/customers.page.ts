import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, PopoverController, ToastController } from '@ionic/angular';
import { getImage } from 'src/functions';
import { RestaurantService } from '../../services/restaurant.service';
import { MoreComponent } from './more/more.component';


interface Customer {
  name: string;
  avatar: any;
  visit: any;
  total: number;
  _id: string;
  blacklisted: boolean;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
})
export class CustomersPage implements OnInit {

  customers: Customer[];

  ui = {
    showBest: false,
    showList: false,
  };

  constructor(
    private service: RestaurantService,
    private popoverCtrl: PopoverController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router,
  ) { };

  user(id: string) {
    this.router.navigate(["restaurant", this.service.restaurantId, "customer", id], { replaceUrl: true });
  }
  async more(event: any, id: string, isBlacklisted: boolean) {
    const popover = await this.popoverCtrl.create({
      component: MoreComponent,
      event,
      mode: "ios",
      componentProps: {
        isBlacklisted
      }
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if(data) {
      if(data == "more") {
        this.user(id);
      } else if(data == "blacklist") {
        const alert = await this.alertCtrl.create({
          mode: "ios",
          header: "Please, be certain.",
          subHeader: "Are you sure you want to add the user to blacklist?",
          buttons: [
            {
              text: "Cancel"
            },
            {
              text: "Submit",
              role: "submit"
            }
          ]
        });

        await alert.present();

        const { role } = await alert.onDidDismiss();

        if(role == "submit") {
          const result: any = await this.service.delete("customers/blacklist", id);

          if(result.done) {
            (await this.toastCtrl.create({
              duration: 3000,
              message: "The user is now in blacklisted.",
              color: "green",
              mode: "ios"
            })).present();
          } else {
            (await this.toastCtrl.create({
              duration: 3000,
              color: "red",
              message: "Something went wrong. Try again later.",
              mode: "ios",
            })).present();
          }
        }
      }
    }
  }

  async updateCustomers() {
    const result: { customers: Customer[]; qrCodes: string[]; } = await this.service.get("customers");

    if(!result) {
      console.error("NO RESULT WTF");
      return;
    }

    if(result.customers && result.customers.length > 0) {
      this.customers = result.customers;
      for(let i of this.customers) {
        i.avatar = getImage(i.avatar) || "./../../../../assets/images/plain-avatar.jpg";
      }
      this.ui.showList = true;
    }
  }


  ngOnInit() {
    this.updateCustomers();
  }

}

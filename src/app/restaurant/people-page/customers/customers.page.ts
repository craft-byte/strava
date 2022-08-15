import { Component, OnInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AlertController, PopoverController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { threadId } from 'worker_threads';
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
  qrCodes: { table: number; downloadUrl: any; link: string; }[];
  restaurantName: string;

  ui = {
    showBest: false,
    showList: false,
    showQrCodes: true,
  };

  constructor(
    private service: RestaurantService,
    private popoverCtrl: PopoverController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: RouterService,
    private loader: LoadService,
  ) {
    this.restaurantName = this.service.restaurant.name;
  };


  find(e) {
    return e;
  }

  async addTable() {
    const result: any = await this.service.post({}, "customers", "table");

    this.qrCodes.push({
      table: this.qrCodes.length + 1,
      link: `https://localhost:8101/order/${this.service.restaurantId}?table=${this.qrCodes.length + 1}`,
      downloadUrl: null
    });

    if(!result.updated) {
      this.qrCodes.pop();
      (await this.toastCtrl.create({
        duration: 1500,
        color: "red",
        message: "Table is not added. Please, try again later.",
        mode: "ios"
      })).present();
    }

  }
  async removeTable() {
    const result: any = await this.service.delete("customers", "table");

    const last = this.qrCodes.pop();

    if(!result.updated) {
      this.qrCodes.push(last);
      (await this.toastCtrl.create({
        duration: 1500,
        color: "red",
        message: "Table is not removed. Please, try again later.",
        mode: "ios"
      })).present();
    }
  }

  onChangeURL(event: SafeUrl, table: number) {
    this.qrCodes[table].downloadUrl = event;
  }
  user(id: string) {
    this.router.go(["restaurant", this.service.restaurantId, "customer", id], { replaceUrl: true });
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
          await this.loader.start();
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
          this.loader.end();
        }
      }
    }
  }

  async updateCustomers() {
    await this.loader.start();
    
    const result: { customers: Customer[]; qrCodes: { table: number; downloadUrl: string; }[]; } = await this.service.get("customers");

    this.qrCodes = [];
    for(let i of result.qrCodes) {
      this.qrCodes.push({
        ...i,
        link: `https://localhost:8101/order/${this.service.restaurantId}?table=${i.table}`
      });
    }
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

    await this.loader.end();
  }


  ngOnInit() {
    this.updateCustomers();
  }

}

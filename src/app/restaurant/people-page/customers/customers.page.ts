import { Component, OnInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { AlertController, PopoverController, ToastController } from '@ionic/angular';
import { StringOrNumberOrDate } from '@swimlane/ngx-charts';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { RestaurantService } from '../../services/restaurant.service';


interface Customer {
  name: string;
  avatar: any;
  orders: number;
  lastOrdered: string;
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
  lastUpdate: string;

  ui = {
    showBest: false,
    showCustomers: false,
    showQrCodes: true,
  };

  constructor(
    private service: RestaurantService,
    private toastCtrl: ToastController,
    private router: RouterService,
    private loader: LoadService,
  ) {
    this.restaurantName = this.service.restaurant.name;
  };


  find(e: any) {
    return e;
  }

  fullCustomer(id: string) {
    this.router.go(["restaurant", this.service.restaurantId, "people", "customer", id]);
  }

  async addTable() {
    const result: any = await this.service.post({}, "customers", "table");

    this.qrCodes.push({
      table: this.qrCodes.length + 1,
      link: `https://ctraba.com/customer/order/${this.service.restaurantId}?table=${this.qrCodes.length + 1}`,
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
  

  async updateCustomers(calculate: boolean) {
    await this.loader.start();
    
    const result: {
      customers: Customer[];
      lastUpdate: string;
      qrCodes: {
        table: number;
        downloadUrl: string;
      }[];
    } = await this.service.get({ calculate }, "customers");


    this.lastUpdate = result.lastUpdate;

    this.qrCodes = [];
    for(let i of result.qrCodes) {
      this.qrCodes.push({
        ...i,
        link: `https://ctraba.com/customer/order?restaurantId=${this.service.restaurantId}&table=${i.table}`
      });
    }
    if(!result) {
      return;
    }

    if(result.customers && result.customers.length > 0) {
      this.customers = result.customers;
      for(let i of this.customers) {
        i.avatar = getImage(i.avatar) || "./../../../../assets/images/plain-avatar.jpg";
      }
      this.ui.showCustomers = true;
    }

    this.loader.end();
  }


  ngOnInit() {
    this.updateCustomers(false);
  }

}

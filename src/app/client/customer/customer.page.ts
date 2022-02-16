import { Component, OnInit } from '@angular/core';
import { AlertInput } from '@ionic/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, PopoverController, ToastController } from '@ionic/angular';
import { types1, types2 } from 'src/assets/consts';
import { Connection, Restaurant, Access, Notification, DishesNames, Table } from 'src/models/customer';
import { CustomerService } from '../customer.service';
import { UserComponent } from './user/user.component';
import { MainService } from 'src/app/main.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  restaurant: Restaurant;
  table: number;
  otherUsersQueue: Access[] = [];

  dishes: string[] = [];
  categories = [];

  types;

  type: "self" | "not" = null;

  ui = {
    title: "Ctraba"
  };

  showSearchbar = false;

  user: any; //CustomerAccount;

  searchText: string = "";

  tables: Table[] = [];
  convertedTables: AlertInput[] = [];
  namesDishes: DishesNames[] = [];

  constructor(
    private main: MainService,
    private service: CustomerService,
    private ar: ActivatedRoute,
    private popoverController: PopoverController,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }



  clear() {
    this.searchText = "";
  }
  async search(event: any) {
    this.dishes = await this.service.get("search", [], { text: event.target.value, restaurant: this.restaurant.sname });
  }
  openSearchbar() {
    this.showSearchbar = !this.showSearchbar;
    this.service.dtype = null;
  }
  async goCategory(name: string) {
    this.dishes = await this.service.get("byCategory", [this.restaurant.sname], { name });
  }
  payment() {
    this.router.navigate([`payment`]);
  }
  async goType(type: string) {
    this.service.dtype = this.service.types.find(el => el.value == type).title;
    console.log(this.service.dtype);
    this.dishes = [];
    this.dishes = await this.service.get("dishes/type", [this.restaurant.sname, type]);
  }
  async userPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: UserComponent,
      event: ev,
      translucent: true
    });
    await popover.present();

    const { data } = await popover.onDidDismiss();

    if (data == "signin") {
      this.main.login(true, { url: "customer", queryParams: { restaurant: this.restaurant._id, table: this.table } })
    } else if (data == "logout") {
      this.main.logout();
      this.user = null;
    } else if (data == "create") {
      this.main.create({ url: "customer", queryParams: { restaurant: this.restaurant._id, table: this.table } });
    }
  }
  async presentAlertRadio(restaurantId: string) {
    const inputs = [
      ...this.convertedTables
    ];
    const buttons = [
      {
        text: 'Confirm',
        role: "confirm",
        handler: () => {
          if (!this.table) {
            this.forSelf();
            this.router.navigate([], {
              relativeTo: this.ar, queryParams: {
                session: "notable"
              }, queryParamsHandling: 'merge'
            });
          } else {
            this.router.navigate([], {
              relativeTo: this.ar, queryParams: {
                table: this.table
              }, queryParamsHandling: 'merge'
            });
            this.withTable(restaurantId)
          }
        }
      }
    ]

    if(!this.restaurant.settings.customers.onlyTableOrders) {
      buttons.unshift({
        text: 'No Table',
        role: 'cancel',
        handler: () => {
          this.forSelf();
          console.log("cancel");
          this.router.navigate([], {
            relativeTo: this.ar, queryParams: {
              session: "notable"
            }, queryParamsHandling: 'merge'
          });
        }
      });
    }

    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Choose Table',
      inputs,
      buttons
    });

    await alert.present();
  }
  async scanQRAlert() {
    const alert = await this.alertController.create({
      header: 'No Table Found',
      mode: "ios",
      message: "You can't continue without scanning table's QR code.",
      buttons: [
        {
          text: "Cancel"
        },
        {
          text: "Scan"
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    console.log(role);
  }
  async dishToast(dish: string) {
    const name = await this.service.get<{ name: string }>("dishName", [this.restaurant.sname, dish]);
    const toast = await this.toastController.create({
      message: `${name.name} is ready!`,
      duration: 2000
    });
    toast.present();
  }
  async getDishes() {
    this.dishes.push(...await this.service.get<string[]>("dishes/popular", [this.restaurant.sname]));
  }
  async forSelf() {
    this.service.type = "order";
    this.main.session.set("order");
    this.service.restaurant = this.restaurant.sname;
    this.getDishes();
    this.service.dishes = JSON.parse(localStorage.getItem("CTRABANOTABLESESSIONDISHES")) || [];
  }
  withTable(restaurant: string) {
    this.service.type = "table";
    this.main.session.set("table");
    const userId = this.main.user.get();
    this.service.start(
      {
        restaurant,
        table: +this.table,
        userId,
        user: this.user ? this.user._id : null
      }).subscribe(async res => {
        if (res.type == "connection/success") {
          const data = res.data as Connection;
          this.restaurant = data.restaurant;
          this.login();
          if (!this.restaurant || !this.restaurant.hasOwnProperty("_id")) {
            return;
          }
          this.ui.title = this.restaurant.name;
          this.service.restaurant = this.restaurant.sname;
          await this.getDishes();
          this.service.init();
          this.main.user.set(data.connection.socketId);
          this.main.restaurant.set(data.restaurant._id);
          this.main.table.set(data.connection.table.toString());
        } else if (res.type == "access") {
          const data = res.data as Access;
          this.otherUsersQueue.push(data);
        } else if (res.type == "notification") {
          const { type, dish } = res.data as Notification;
          if (type == "dish") {
            this.dishToast(dish);
          }
        }
      });
  }
  async ifNoType(restaurant: string) {
    this.ui.title = this.restaurant.name;
    if (!this.restaurant || !this.restaurant.hasOwnProperty("_id")) {
      return;
    }
    const session = this.ar.snapshot.queryParamMap.get("session");

    if (session) {
      this.service.dishes = JSON.parse(localStorage.getItem("CTRABANOTABLESESSIONDISHES")) || [];
      this.forSelf();
      return;
    }

    for (let i = 0; i < this.tables.length; i++) {
      this.convertedTables.push({
        type: 'radio',
        label: `Table: ${this.tables[i].number}`,
        value: (this.tables[i].number).toString(),
        handler: ({ value }) => {
          this.table = value
        }
      });
    }

    this.presentAlertRadio(restaurant);
  }
  async login() {
    if (!this.user) {
      if (!this.main.userInfo) {
        await this.main.login(false, { url: "customer", queryParams: { restaurant: this.restaurant._id, table: this.table } });
      }
      this.user = this.main.userInfo;
    }
  }
  async ngOnInit() {
    this.service.mainUrl = this.router.url;
    const restaurant = this.ar.snapshot.queryParamMap.get("restaurant");
    this.table = +this.ar.snapshot.queryParamMap.get("table");
    this.service.restaurantId = restaurant;
    const { rest, tables } = await this.service.get("getRestaurant", [restaurant]);
    this.restaurant = rest;
    this.tables = tables;
    this.service.payments = this.restaurant.payments;
    await this.login();
    if (!restaurant) {
      this.router.navigate(["SOMWHERE WHERE YOU CAN FIND NEAREST RESTAURANTS OR SOMETHING ELSE"], { replaceUrl: true });
      return;
    }

    if(this.restaurant.settings.dishes.allTypes) {
      this.types = types1;
      this.service.types = types1;
    } else {
      this.types = types2;
      this.service.types = types2;
    }

    if (!this.table) {
      if (this.restaurant.settings.customers.onlyByQR) {
        this.scanQRAlert();
        return;
      }
      this.type = "self";
      this.ifNoType(restaurant);
    } else {
      this.type = "not";
      this.withTable(restaurant);
    }
  }
}

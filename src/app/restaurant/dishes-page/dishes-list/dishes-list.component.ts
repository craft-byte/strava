import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, PopoverController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MoreComponent } from '../../other/more/more.component';
import { RestaurantService } from '../../services/restaurant.service';


interface Dish {
  name: string;
  date: string;
  _id: string;
  price: string;
  bought: number;
  modified: string;
}



@Component({
  selector: 'app-dishes-list',
  templateUrl: './dishes-list.component.html',
  styleUrls: ['./dishes-list.component.scss'],
})
export class DishesListComponent implements OnInit {

  routerSubs: Subscription;
  page: string = 'list';
  dishes: Dish[] = [];

  timeout: any;

  ui = {
    showAdd: false
  }

  constructor(
    private router: RouterService,
    private service: RestaurantService,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private route: ActivatedRoute,
    private loader: LoadService,
  ) { };

  cancel() {
    this.dishes = [];
  }

  find(e?: any) {
    if(!e) {
      return;
    }
    const { target: { value } } = e;
    clearTimeout(this.timeout);
    if(value == "") {
      return;
    }
    this.timeout = setTimeout(() => {
      console.log(value);
    }, 1000);
  }

  addDish() {
    this.router.go(['dish', this.service.restaurantId, "add"], { replaceUrl: true });
  }

  goDish(id: string) {
    this.router.go(["restaurant", this.service.restaurantId, "dishes", "full", id], { replaceUrl: true });
  }

  async more(e: any, id: string) {
    const popover = await this.popoverCtrl.create({
      component: MoreComponent,
      event: e,
      mode: "ios",
      componentProps: {
        remove: true,
        edit: true,
        more: true,
      }
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if(data) {
      if(data == 1) {
        this.router.go(["restaurant", this.service.restaurantId, "dishes", "full", id], { replaceUrl: true });
      } else if(data == 2) {
        this.router.go(["dish", this.service.restaurantId, "edit", id], { replaceUrl: true });
      } else {
        this.remove(id);
      }
    }
  }
  async remove(id: string) {
    const alert = await this.alertCtrl.create({
      header: "Please, be certain.",
      subHeader: "Are you sure you want to delete the dish?",
      mode: "ios",
      buttons: [
        {
          text: "Cancel"
        },
        {
          text: "Submit",
          role: "remove"
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if(role == "remove") {
      await this.loader.start();
      const result: any = await this.service.delete("dishes", id);

      if(result.removed) {
        for(let i in this.dishes) {
          if(this.dishes[i]._id == id) {
            this.dishes.splice(+i, 1);
            break;
          }
        }
        (await this.toastCtrl.create({
          duration: 4000,
          color: "green",
          message: "Successfuly removed.",
          mode: "ios"
        })).present();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          color: "red",
          message: "Something went wrong. Try again later.",
          mode: "ios"
        })).present();
      }

      this.loader.end();
    }
  }

  async ngOnInit() {
    await this.loader.start();
    this.dishes = await this.service.get('dishes');
    if(this.dishes.length == 0) {
      this.ui.showAdd = true;
    }
    this.loader.end();
  }


}

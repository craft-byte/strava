import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';
import { Restaurant } from 'src/models/radmin';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-full',
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.scss'],
})
export class FullComponent implements OnInit {
  
  ui = {
    title: ""
  }
  dish: Dish;
  image: string;
  restaurant: Restaurant;
  goAdd = false;
  goUse = false;
  cost: number = null;
  name: string = null;
  currentSaleChoosen = null;
  from: Date = null;;
  to: Date = null;
  nowDate: string;
  saleTo: string;
  sale: { _id: string; name: string; };

  constructor(
    private service: RadminService,
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    const date = new Date();
    this.nowDate = `${date.getFullYear()}-${date.getMonth().toString().length == 1 ? "0" + date.getMonth() : date.getMonth()}-${date.getDate()}`;
  };

  removeSale() {
    this.sale = null;
    this.dish.price = this.dish.originalPrice;
    this.service.delete("dish/remove/sale", this.restaurant.sname, this.dish._id, this.dish.originalPrice.toString());
  }
  async use() {
    if(!this.to || new Date(this.to).getTime() < new Date(this.from).getTime()) {
      console.log("Invalid date");
      return;
    }
    const result = await this.service.patch<{ price: number }>({ from: this.from, to: this.to }, "use", this.restaurant.sname, this.dish._id, this.currentSaleChoosen);
    this.dish.price = result.price;
    this.dish.sale = { "_id": this.currentSaleChoosen, "to": this.to };
    this.saleInit();
    this.quit();
  }
  cooking() {  
    this.router.navigate(["dish-cooking", this.dish._id], { queryParamsHandling: "preserve", replaceUrl: true });
  }
  async save() {
    const result = await this.service
      .patch<{ _id: string; date: Date }>({ price: this.cost, name: this.name }, "add", this.restaurant.sname, this.dish._id);
    this.dish.sales.push({ name: this.name, cost: this.cost, _id: result._id, created: result.date });
    this.quit();
  }
  quit() {
    this.currentSaleChoosen = null;
    this.goAdd = false;
    this.goUse = false;
    this.name = null;
    this.cost = null;
    this.from = null
    this.to = null;
  }
  onSalesEmit({ t, id }: { t: "remove" | "use", id: string }) {
    if(t == 'remove') {
      this.service.delete("sale", this.restaurant.sname, this.dish._id, id);
      for(let i in this.dish.sales) {
        if(this.dish.sales[i]._id == id) {
          this.dish.sales.splice(+i, 1);
          break;
        }
      }
    } else {
      this.goUse = true;
      this.currentSaleChoosen = id;
    }
  }

  back() {
    this.router.navigate(["radmin", "dishes", "overview"], { queryParamsHandling: "preserve" });
  }
  async remove() {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      mode: "ios",
      header: 'Please be certain.',
      subHeader: '',
      message: 'Once you delete a dish, there is no going back.',
      buttons: [{ text: "Cancel", role: null }, { text: "Remove", role: "remove" }]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if(role == "remove") {
      await this.service.delete('dishes', 'remove', this.service.restaurant.sname, this.dish._id);
      this.router.navigate(["radmin", "dishes", "overview"], { queryParamsHandling: "preserve" });
    }
  }
  edit() {
    this.router.navigate(["dish", "edit"], { queryParams: { dish: this.dish._id }, replaceUrl: true, queryParamsHandling: "merge" });
  }
  async saleInit() {
    this.sale = await this.service.get("dish/sale", this.restaurant.sname, this.dish._id, this.dish.sale._id);
    this.saleTo = new Date(this.dish.sale.to).toLocaleDateString();
  }
  addPrice() {
    this.goAdd = true;
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    this.restaurant = await this.service.getRestaurant();
    this.dish = await this.service.get<Dish>("dish/full", this.service.restaurant.sname, id);
    if(!this.dish) {
      return;
    }
    this.image = await getImage(this.dish.image);
    if(this.dish.sale) {
      this.saleInit();
    }
  }

}

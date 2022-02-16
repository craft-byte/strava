import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MainService } from 'src/app/main.service';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/customer';
import { CustomerService } from '../customer.service';


@Component({
  selector: 'app-customer-dish',
  templateUrl: './customer-dish.page.html',
  styleUrls: ['./customer-dish.page.scss'],
})
export class CustomerDishPage implements OnInit {

  dish: Dish;
  image: string;

  type: { title: string, img: string };
  answers: { question: string; answer: string }[] = [];

  quantity = 0;
  description: string;

  ui = {
    title: "Ctraba"
  };

  liked = false;

  constructor(
    private service: CustomerService,
    private ar: ActivatedRoute,
    private main: MainService,
    private location: Location,
    private router: Router
  ) { }


  like() {
    this.liked = !this.liked;
    this.service.get("like", [this.dish._id], { is: this.liked, restaurant: this.service.restaurant })
    const liked = localStorage.getItem("CTRABALIKED");
    if(liked) {
      const newLiked = JSON.parse(liked) as Array<any>;
      newLiked.push(this.dish._id);
      localStorage.setItem("CTRABALIKED", JSON.stringify(newLiked));
    } else {
      const newLiked = [this.dish._id];
      localStorage.setItem("CTRABALIKED", JSON.stringify(newLiked));
    }
  }
  remove() {
    this.quantity--;
    for(let i in this.service.dishes) {
      if(this.service.dishes[i].dish == this.dish._id) {
        this.service.dishes[i].quantity--;
        if(this.service.dishes[i].quantity == 0) {
          this.service.dishes.splice(+i, 1);
        }
        this.service.setDishes();
        return;
      }
    }
  }
  add() {
    this.quantity++;
    this.service.addDish(this.dish._id);
    if(this.answers && this.answers.length > 0) {
      this.service.addAnswer(this.answers, this.dish._id);
    }
    this.answers = [];
  }
  async ngOnInit() {
    const id = this.ar.snapshot.paramMap.get("id");
    if(!this.service.restaurant) {
      this.location.back();
      return;
    }
    if(this.service.currentDish && id == this.service.currentDish._id) {
      this.dish = this.service.currentDish;
    } else {
      this.dish = await this.service.get("dishes/full", [this.service.restaurant, id]);
    }
    this.image = await getImage(this.dish.image);
    if(!this.dish || !this.service.restaurantId) {
      const table = this.main.table.get();
      const session = this.main.session.get();
      this.router.navigate(
        ["customer"], 
        { 
          replaceUrl: true,
          queryParams: {
            restaurant: this.main.restaurant.get(),
            table: session == "self" ? null : table,
            session: session == "self" ? "notable" : null
          }
        }
      );
      return;
    }
    this.ui.title = this.dish.name;
    this.type = this.service.dtype ? this.service.types.find(el => el.title == this.service.dtype) : this.service.types.find(el => el.value == this.dish.categories[0]);
    for(let i of this.service.dishes) {
      if(i.dish == this.dish._id) {
        this.quantity = i.quantity;
        break;
      }
    }
    this.description = (await this.service.get<{ description: string }>("dishes/description", [this.service.restaurant, this.dish._id])).description;
    const liked = JSON.parse(localStorage.getItem("CTRABALIKED")) as Array<string>;
    if(!liked) {
      localStorage.setItem("CTRABALIKED", "[]");
      return;
    }
    if(liked.includes(this.dish._id)) {
      this.liked = true;
    }
  }

}

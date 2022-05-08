import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getImage } from 'src/functions';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-dish-cooking',
  templateUrl: './dish-cooking.page.html',
  styleUrls: ['./dish-cooking.page.scss'],
})
export class DishCookingPage implements OnInit {

  ui = {
    title: ""
  };


  choosenWorkers: string[] = [];

  dishId: string = null;

  chosen = [];
  found = [];

  recipee: string = null;
  searchText: string = null;
  name: string = null;

  workers: { _id: string; name: string; avatar: string; choosen: boolean }[] = [];


  constructor(
    private service: RadminService,
    private router: Router,
    private route: ActivatedRoute
  ) { };

  async find() {
    this.found = await this.service.patch({ searchText: this.searchText }, "components");
  }

  removeChosen(id: string) {
    for(let i in this.chosen) {
      if(this.chosen[i]._id == id) {
        this.chosen.splice(+i, 1);
        break;
      }
    }
  }

  async save() {
    this.ui.title = "";
    const result = await this.service
      .patch<{ success: boolean }>(
        { 
          cooking: { 
            recipee: this.recipee, 
            components: this.chosen,
            workers: this.choosenWorkers
          },
          info: {
            dishId: this.dishId
          },
          restaurantId: this.service.restaurant._id,
        },
        "cooking/set"
      );

    if(result.success) {
      this.exit();
    } else {
      this.ui.title = "Something went wrong. Try again later";
    }
  }

  exit() {
    this.router.navigate(
      ["restaurant", this.service.restaurantId, "dishes", "full", this.dishId], 
      { queryParamsHandling: "preserve" }
    );
  }

  choose(id: string) {
    for(let i of this.workers) {
      if(i._id == id) {
        if(i.choosen) {
          this.choosenWorkers.splice(this.choosenWorkers.indexOf(id), 1);
          i.choosen = false;
          return;
        }
        i.choosen = true;
        this.choosenWorkers.push(id);
        return;
      }
    }
  }

  onComponentEmited({component, amount}: { component: { name: string; _id: string}, amount: number }) {
    this.chosen.push(Object.assign(component, { amount }));
    for(let i in this.found) {
      if(this.found[i]._id == component._id) {
        this.found.splice(+i, 1);
        break;
      }
    }
  }

  async ngOnInit() {
    await this.service.getRestaurant();
    this.dishId = this.route.snapshot.paramMap.get("dish");
    const { recipee, components, name, workers } = await this.service.get("cooking/dish", this.service.restaurantId, this.dishId);

    this.chosen = components;
    this.recipee = recipee;
    this.name = name;
    this.workers = workers;

    for(let i of this.workers) {
      if(!i.avatar) {
        i.avatar = "./../../../../assets/images/plain-avatar.jpg";
      } else {
        i.avatar = await getImage(i.avatar);
      }
    }

  }

}

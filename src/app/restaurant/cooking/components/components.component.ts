import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Restaurant, Component as C } from 'src/models/radmin';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-components',
  templateUrl: './components.component.html',
  styleUrls: ['./components.component.scss'],
})
export class ComponentsComponent implements OnInit {

  restaurant: Restaurant;
  searchText: string = null;

  windowType: string = null;
  curComponent: C;

  constructor(
    private router: Router,
    private service: RadminService
  ) { };

  add() {
    this.windowType = "add";
  }
  quit() {
    this.windowType = null;
  }
  onWindowEmited({ type, data }: { type: "error" | "removed" | "added" | "edited", data: any }) {
    this.windowType = null;
    if(type == "error") {
      console.log("ERROR EMITED");
    } else if(type == "removed") {
      const { _id } = data;
      for(let i in this.restaurant.components) {
        if(this.restaurant.components[i]._id == _id) {
          this.restaurant.components.splice(+i, 1);
          break;
        }
      }
    } else if(type == "added") {
      this.restaurant.components.push(data);
    } else if(type == "edited") {
      const { updated, _id } = data;
      for (let i in this.restaurant.components) {
        if(this.restaurant.components[i]._id == _id) {
          this.restaurant.components[i] = updated;
          break;
        }
      }
    }
  }
  onEmited({ role, data }: { role: string; data: C }) {
    this.curComponent = JSON.parse(JSON.stringify(data));
    if(role == "edit") {
      this.windowType = "edit";
    } else if(role == "remove") {
      this.windowType = "remove";
    } else if(role == "more") {
      this.router.navigate(["radmin/cooking/components/more", data._id], { queryParamsHandling: "preserve" });
    }
  }

  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant("components");
  }

}

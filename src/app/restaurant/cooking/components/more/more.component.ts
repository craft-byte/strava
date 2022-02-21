import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RadminService } from 'src/app/restaurant/radmin.service';
import { Restaurant, Component as C } from 'src/models/radmin';

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss'],
})
export class MoreComponent implements OnInit {

  restaurant: Restaurant;
  component: C;
  fullType: string;
  windowType: "edit" | "remove" | "add" = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RadminService
  ) { };

  onWindowEmited({ type, data }: {type: "edited" | "removed", data: any }) {
    this.windowType = null;
    if(type == "edited") {
      this.component = data.updated;
    } else if(type == "removed") {
      this.back();
    }
  }

  back() {
    this.router.navigate(["radmin/cooking/components"], { replaceUrl: true, queryParamsHandling: "preserve" });
  }
  remove() {
    this.windowType = "remove";
  }
  edit() {
    this.windowType = "edit";
  }

  fullTypeInit() {
    switch (this.component.type) {
      case "k":
        this.fullType = "Kilogram";
        break;
      case "g":
        this.fullType = "Gram";
        break;
      case "p":
        this.fullType = "Piece";
        break;
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    this.restaurant = await this.service.getRestaurant();
    this.component = await this.service.get("components/get", this.restaurant._id, id);
    // if(this.component.type == "k") {
    //   this.component.amount /= 1000;
    // }
    this.fullTypeInit();
  }

}

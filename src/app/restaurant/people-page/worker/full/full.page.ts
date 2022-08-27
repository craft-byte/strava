import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from 'src/app/restaurant/services/restaurant.service';
import { getImage } from 'src/functions';

interface Result {
  restaurantName?: string;
  user?: {
      avatar: any;
      name: string;
      email?: string;
      _id: string;
  };
  worker?: {
      role: string;
      cooked?: number;
      served?: number;
      joined: string;
      lastUpdate?: string;
      favoriteDish?: {
          name: string;
          _id: string;
      }
  }
};

@Component({
  selector: 'app-full',
  templateUrl: './full.page.html',
  styleUrls: ['./full.page.scss'],
})
export class FullPage implements OnInit {

  user: Result["user"];
  worker: Result["worker"];

  userAvatar: string;
  restaurantName: string;

  constructor(
    private router: RouterService,
    private loader: LoadService,
    private route: ActivatedRoute,
    private service: RestaurantService,
  ) { };


  back() {
    this.router.go(["restaurant", this.service.restaurantId, "people", "staff"]);
  }

  settings() {
    this.router.go(["restaurant", this.service.restaurantId, "people", "worker", this.user._id, "settings"]);
  }

  async ngOnInit() {
    await this.loader.start();

    const userId = this.route.snapshot.paramMap.get("userId");

    try {
      const result: Result = await this.service.get({ calculate: false }, "staff", userId);

      const { worker, user, restaurantName } = result;

      this.worker = worker;
      this.user = user;
      this.restaurantName = restaurantName;
      this.userAvatar = getImage(user.avatar);

    } catch (e) {
      if(e.status == 404) {
        if(e.body.reason == "worker") {
          this.router.go(["restaurant", this.service.restaurantId, "people", "staff"]);
          return;
        }
      }
    }



    this.loader.end();
  }

}

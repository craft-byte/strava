import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from 'src/app/restaurant/services/restaurant.service';
import { getImage } from 'src/functions';


interface User {
  name: string;
  _id: string;
  avatar: any;
}


@Component({
  selector: 'app-invite',
  templateUrl: './invite.page.html',
  styleUrls: ['./invite.page.scss'],
})
export class InvitePage implements OnInit {

  timeout: any;
  users: User[] = [];

  constructor(
    private service: RestaurantService,
    private router: RouterService,
    private loader: LoadService, 
  ) { };

  find(e: any) {

    const { target: { value } } = e;

    if(value.length < 4) {
      return;
    }

    this.users = [];
    
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.getUsers(value);
    }, 1000);
  }

  async getUsers(searchText: string) {
    const result: User[] = await this.service.patch({ searchText }, "findUsers");

    for(let i of result) {
      this.users.push(
        Object.assign(i, { avatar: getImage(i.avatar.binary) })
      );
    }
  }

  invite(id: string) {
    this.router.go(["restaurant", this.service.restaurantId, "people", "worker", id, "set-up"], { replaceUrl: true });
  }

  more() {
    
  }


  async ngOnInit() {
    this.loader.end();
  }

}

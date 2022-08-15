import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { StaffService } from '../staff.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {

  restaurantId: string;

  ui = {
    title: "Wait...",
    showKitchen: false,
    showWaiter: false,
    showLocations: false
  }

  constructor(
    private service: StaffService,
    private router: RouterService,
    private loader: LoadService,
  ) { };

  go(l: "waiter" | "kitchen") {
    this.router.go(["staff", this.restaurantId, l]);
  }

  async ngOnInit() {
    await this.loader.start();
    const result = await this.service.get<{ restaurant: any; user: { showKitchen: boolean; showWaiter: boolean; } }>("dashboard");

    if(!result) {
      return;
    }

    const { restaurant: { name, _id }, user: { showKitchen, showWaiter } } = result;

    this.restaurantId = _id;

    this.ui.showKitchen = showKitchen;
    this.ui.showWaiter = showWaiter;
    this.ui.title = name;

    this.ui.showLocations = true;
    this.loader.end();
  }

}

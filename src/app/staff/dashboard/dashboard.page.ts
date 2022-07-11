import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    private router: Router
  ) { };

  go(l: "waiter" | "kitchen") {
    this.router.navigate(["staff", this.restaurantId, l]);
  }

  async ngOnInit() {
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
  }

}

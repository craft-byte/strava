import { Component, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Restaurant } from 'src/models/general';
import { NavigationComponent } from './other/navigation/navigation.component';
import { RestaurantService } from './services/restaurant.service';

@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.page.html',
  styleUrls: ['./restaurant.page.scss'],
})
export class RestaurantPage implements OnInit, OnDestroy {

  navClass: string;
  avatar: string;
  restaurant: Restaurant;
  page: string = "dishes";

  routerSubs: Subscription;

  constructor(
    private service: RestaurantService,
    private popoverCtrl: PopoverController,
    private router: Router,
  ) { };

  async more(ev: any) {
    this.navClass = "active";
    const popover = await this.popoverCtrl.create({
      event: ev,
      component: NavigationComponent,
      mode: "ios",
      cssClass: "popover-324"
    });

    await popover.present();

    const { role } = await popover.onDidDismiss();

    this.navClass = "";

    if(role == "1") {
      this.router.navigate(["user/info"], { replaceUrl: true });
    }
  }

  go(p: string) {
    this.page = p;
    this.router.navigate(["restaurant", this.service.restaurantId, p], { replaceUrl: true });
  }

  ngOnInit() {
    this.restaurant = this.service.restaurant;
    this.routerSubs = this.router.events.subscribe(e => {
      if(e instanceof NavigationEnd) {
        this.page = e.url.split("/")[3] || "dishes";
      }
    })
  }

  ngOnDestroy(): void {
    this.routerSubs.unsubscribe()
  }

}

import { Component, Injector, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { general } from 'src/assets/consts';
import { CustomerService } from '../../customer.service';
import { OrderService } from '../order.service';
import { PreviewPage } from '../preview/preview.page';

import { Platform } from "@angular/cdk/platform";
import { StringOrNumberOrDate } from '@swimlane/ngx-charts';

interface InitResult {
  restaurant: {
    name: string;
    _id: string;
    theme: string;
  };
  order: {
    dishes: { name: string; price: number; quantity: number; _id: string; }[];
    dishesQuantity: number;
    type: string;
    id: string;
    comment: string;
  };
  showOut: boolean;
  showTracking: boolean;
};

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit, OnDestroy {

  theme: string;
  restaurantName: string;

  categories = general;

  ui = {
    showTracking: false,
  }

  constructor(
    private service: CustomerService,
    private router: RouterService,
    private routerClassic: Router,
    private modalCtrl: ModalController,
    private order: OrderService,
    private platform: Platform,
    private injector: Injector,
  ) {
    this.routerClassic.routeReuseStrategy.shouldReuseRoute = () => false;
  };

  @ViewChild("previewContainer", { read: ViewContainerRef }) previewContainer: ViewContainerRef;

  recommendations() {
    if(this.router.url.split("/").length != 4) {
      this.router.go(["customer", "order", this.service.restaurantId,], { queryParamsHandling: "preserve", queryParams: { last: null } });
    }
  }

  tracking() {
    this.router.go(["customer", "tracking", this.service.restaurantId]);
  }

  async open() {
    const { PreviewPage } = await import("./../preview/preview.page");

    const component = this.previewContainer.createComponent(PreviewPage, { injector: this.injector });

    component.instance.leave.subscribe(() => {
      component.destroy();
    });
  }

  async ngOnInit() {
    this.theme = this.service.theme;
    const result: InitResult = await this.service.post({ platform: this.platform }, "order", this.service.restaurantId, "init");

    const { restaurant, order, showOut, showTracking } = result;

    this.restaurantName = restaurant.name;

    this.ui.showTracking = showTracking;

    this.order.dishes = order.dishes;
    this.order.comment = order.comment;
    this.order.dishesQuantity = order.dishesQuantity;
    this.order.type = order.type as any;
    this.order.id = order.id;
    this.order.showOut = showOut;

  }
  ngOnDestroy(): void {

  }
}

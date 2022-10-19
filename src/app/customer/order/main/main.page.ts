import { Component, Injector, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterService } from 'src/app/other/router.service';
import { general } from 'src/assets/consts';
import { CustomerService } from '../../customer.service';
import { OrderService } from '../order.service';
import { Platform } from "@angular/cdk/platform";
import { MainService } from 'src/app/services/main.service';

interface InitResult {
    restaurant: {
        name: string;
        _id: string;
        theme: string;
    };
    user: {
        name: string;
        avatar: any;
        _id: string;
    } | null;
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
        private order: OrderService,
        private platform: Platform,
        private injector: Injector,
        private main: MainService,
        private route: ActivatedRoute,
    ) {
        // this.routerClassic.routeReuseStrategy.shouldReuseRoute = () => false;
    };

    @ViewChild("previewContainer", { read: ViewContainerRef }) previewContainer: ViewContainerRef;
    @ViewChild("userPopoverContainer", { read: ViewContainerRef }) popoverContainer: ViewContainerRef;

    recommendations() {
        if (this.router.url.split("/").length != 4) {
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
    async userPopover() {
        const { UserPopoverComponent } = await import("./user-popover/user-popover.component");

        const component = this.previewContainer.createComponent(UserPopoverComponent, { injector: this.injector });

        component.instance.user = this.order.user;

        component.instance.leave.subscribe(async (op: string) => {
            if (op == "signout") {
                const result: { token: string; } = await this.service.post({}, "order", this.service.restaurantId, "session/signout");
                if(result.token) {
                    this.main.removeUserInfo();
                    this.order.user = null;
                    this.order.us = "noinfo";
                    localStorage.setItem("ct", result.token);
                    await this.router.go([], { relativeTo: this.route, queryParams: { ct: result.token }, queryParamsHandling: "merge" });
                    window.location.reload();
                }
            } else if(op == "login") {
                this.login();
            } else if(op == "signup") {
                this.router.go(["registration"]);
            } else if(op == "account") {
                this.router.go(["user/info"]);
            }
            component.destroy();
        });
    }
    async login() {
        const { LoginPopoverComponent } = await import("./login-popover/login-popover.component");

        const component = this.previewContainer.createComponent(LoginPopoverComponent, { injector: this.injector });

        component.instance.leave.subscribe(async res => {
            if(res) {
                localStorage.removeItem("ct");
                window.location.reload();
            }
            component.destroy();
        });
    }

    async ngOnInit() {
        const table = this.route.snapshot.queryParamMap.get("table");

        try {
            const result: InitResult = await this.service.post({
                platform: this.platform,
                table,
            }, "order", this.service.restaurantId, "init");

            const { restaurant, order, user, showOut, showTracking } = result;

            this.restaurantName = restaurant.name;
            this.service.theme = restaurant.theme;
            this.theme = restaurant.theme

            this.ui.showTracking = showTracking;

            this.order.dishes = order.dishes;
            this.order.comment = order.comment;
            this.order.dishesQuantity = order.dishesQuantity;
            this.order.type = order.type as any;
            this.order.id = order.id;
            this.order.showOut = showOut;
            this.order.user = user;



            const qp: any = {};
            if (table) {
                qp.table = null;
            }
            if(this.order.us != "noinfo") {
                qp.ct = null;
            }
            this.router.go([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: "merge" }, false);
        } catch (e) {
            if (e.status == 404) {
                if (e.body.reason == "RestaurantNotFound") {
                    this.router.go(["login"]);
                } else if(e.body.reason == "OrderNotFound") {
                    this.router.go(["login"]);
                }
            }
        }
    }
    ngOnDestroy(): void {

    }
}

import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../customer.service';
import { OrderDish, OrderType } from './other/models/order';
import { OrderService } from './order.service';
import { RouterService } from 'src/app/other/router.service';
import { Dish } from './other/models/dish';
import { Location } from '@angular/common';
import { User, UserStatus } from './other/models/user';
import { getImage } from 'src/functions';
import { LoadService } from 'src/app/other/load.service';
import { MainService } from 'src/app/other/main.service';
import { WaiterRequest, WaiterRequestReason } from './other/models/waiterRequest';

interface InitResponse {
    settings: {
        allowTakeOut?: boolean;
        allowDineIn?: boolean;
        onlineOrdering?: boolean;
        maxDishes?: number;
    };

    restaurant: {
        _id: string;
        name: string;
        theme: string;
    };
    
    order?: {
        dishes: OrderDish[];
        type: OrderType;
        id: string;
        comment: string;
        _id: string;
    };

    waiterRequest?: WaiterRequest;

    dish?: Dish;
    
    user: User;
    userStatus: UserStatus;
    customerToken: string;

    sendSocketId?: boolean;
}

@Component({
    selector: 'app-order',
    templateUrl: './order.page.html',
    styleUrls: ['./order.page.scss'],
})
export class OrderPage implements OnInit {

    user: User;

    constructor(
        private service: CustomerService,
        private route: ActivatedRoute,
        public order: OrderService,
        private router: Router,
        private location: Location,
        private loader: LoadService,
        private main: MainService,
    ) { };

    @ViewChild("previewContainer", { read: ViewContainerRef }) previewContainer: ViewContainerRef;
    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModalContainer: ViewContainerRef;
    @ViewChild("accountModalContainer", { read: ViewContainerRef }) accountModalContainer: ViewContainerRef;
    @ViewChild("waiterRequestContainer", { read: ViewContainerRef }) waiterRequestContainer: ViewContainerRef;

    async openPreview() {
        const { PreviewComponent } = await import("./preview/preview.component");

        const component = this.previewContainer.createComponent(PreviewComponent);

        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }

    async openDishModal(dish: Dish) {
        const { DishModalComponent } = await import("./dishes/dish-modal/dish-modal.component");

        const component = this.dishModalContainer.createComponent(DishModalComponent);

        component.instance.dish = dish;

        component.instance.leave.subscribe(() => {
            // remove "d" queryParam
            const url = this.router.createUrlTree([], { relativeTo: this.route, queryParams: { d: null }, queryParamsHandling: "merge" }).toString()
            this.location.go(url);


            component.destroy();
        });
    }


    async openAccountModal() {
        const { AccountComponent } = await import("./account/account.component");

        const component = this.accountModalContainer.createComponent(AccountComponent);

        component.instance.user = this.user;
        component.instance.userStatus = this.order.userStatus;
        

        component.instance.leave.subscribe((a: "account" | "signout" | "signup" | "login") => {

            if(a == "account") {
                this.router.navigate(["user/info"], {});
            } else if(a == "signout") {
                this.signOut()
            } else if(a == "signup") {
                this.router.navigate(["register"], { queryParams: { last: this.router.routerState.snapshot.url } });
            } else if(a == "login") {
                const url = this.router.createUrlTree([], { relativeTo: this.route, queryParams: { ct: this.service.customerToken, }, queryParamsHandling: "merge" }).toString();

                this.router.navigate(["login"], { queryParams: { last: url }, replaceUrl: true });
            }

            component.destroy();
        });
    }



    async signOut() {

        // start loading
        await this.loader.start();


        const result: any = await this.service.post({}, "order", this.service.restaurantId, "session", "signout");


        if(result.updated) {
            this.user = null;
            this.order.userStatus = "noinfo";

            // remove authorization token
            this.main.removeUserInfo()

            // add customer token to the url as queryParam "ct" to localstorage as "ct" and to this.order.customerToken
            this.saveCustomerToken(result.customerToken);
        }


        this.loader.end();
    }



    async ngOnInit() {
        // get params for init request
        const params = this.getParams();
        const result: InitResponse = await this.service.get(params, "order", this.service.restaurantId, "session/init");


        this.order.dishes = result.order.dishes;
        this.order.id = result.order.id;
        this.order.type = result.order.type;
        this.order.comment = result.order.comment;
        this.order._id = result.order._id;
        
        this.order.settings = result.settings;
        this.order.restaurant = result.restaurant;
        this.order.userStatus = result.userStatus;

        this.user = result.user;


        
        
        console.log(result);
        
        
        if(result.dish) {
            this.openDishModal(result.dish);
        }

        if(this.user) {
            this.user.avatar = getImage(this.user.avatar);

            // remove customerToken from everywhere
            this.saveCustomerToken(undefined);
        }

        if(result.customerToken) {
            this.saveCustomerToken(result.customerToken);
        }

        if(result.waiterRequest) {
            this.openWaiterRequestModal(result.waiterRequest);
        }
        
        // POST to assign socket id to the order so it can be sent messages.
        if(!params.socketId || result.sendSocketId) {
            if(this.order.socketId) {
                await this.service.post({ socketId: this.order.socketId }, "order", this.service.restaurantId, "session/socketId");
            }
        }


        this.order.flow.subscribe(res => {
            console.log("SOKCET: ", res);
        });
    }



    async openWaiterRequestModal(request: WaiterRequest) {
        const { WaiterRequestModalComponent } = await import("./other/waiter-request-modal/waiter-request-modal.component");

        const component = this.waiterRequestContainer.createComponent(WaiterRequestModalComponent);

        component.instance.request = request;

        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }


    getParams() {
        const result: any = {};

        const params = this.route.snapshot.queryParams;

        // if qr code scanned, the table will be in the url
        if(params["table"]) {
            result.table = params["table"];
        }

        if(params["d"]) {
            result.dishId = params["d"];
        }


        if(this.service.customerToken) {
            result.customerToken = this.service.customerToken;
        }

        // if socket id inited, if not it will be assigned later in ngOnInit
        if(this.order.socketId) {
            result.socketId = this.order.socketId;
        }

        return result;
    }


    saveCustomerToken(token: string) {

        // add customerToken to url as "ct"
        const url = this.router.createUrlTree([], { relativeTo: this.route, queryParams: { ct: token }, queryParamsHandling: "merge" }).toString()
        this.location.go(url);

        // add customerToken to localstrorage
        localStorage.setItem("ct", token);

        // save it in order.service
        this.order.customerToken = token;
    }


}

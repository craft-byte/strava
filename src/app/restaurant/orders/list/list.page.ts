import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from 'src/app/restaurant/restaurant.service';


interface Order {
    user: {
        name: string;
        username: string;
        _id: string;
        avatar: any;
    };
    dishes: {
        name: string;
        price: number;
        _id: string;
    }[];
    by: string;
    date: string;
    status: string;
    total: number;
    _id: string;
    avatar?: string;
    blacklisted: boolean;
    statusColor: "green" | "red" | "purple";
}
interface Filters {
    date: string;
    amount: string;
    dishes: string;
    status: string;
}


@Component({
    selector: 'app-list',
    templateUrl: './list.page.html',
    styleUrls: ['./list.page.scss'],
})
export class ListPage implements OnInit {

    orders: Order[];
    restaurantId: string;

    ui = {
        disableNext: false,
        disablePrev: false,
        filters: <Filters>{
            date: null,
            amount: null,
            dishes: null,
        }
    };

    filters = {
        date: async () => {
            const { DateComponent } = await import("./../filters/date/date.component");

            const component = this.dateContainer.createComponent(DateComponent);


            component.instance.leave.subscribe(res => {
                if(res == "clear") {
                    this.router.go([], { relativeTo: this.route, queryParams: { "ordered-lt": null, "ordered-gt": null, "ordered-gte": null, "ordered-lte": null, p: 0 }, queryParamsHandling: "merge" })
                }
                if (res && res != "clear") {
                    const qp: any = { p: 0 };

                    if (["lte", "gte", "gt", "lt"].includes(res.mode)) {
                        qp[`ordered-${res.mode}`] = res.time1;
                        if (res.mode == "lte") {
                            qp["ordered-gt"] = null;
                            qp["ordered-gte"] = null;
                            qp["ordered-lt"] = null;
                        } else if(res.mode == "lt") {
                            qp["ordered-gt"] = null;
                            qp["ordered-gte"] = null;
                            qp["ordered-lte"] = null;
                        } else if (res.mode == "gte") {
                            qp["ordered-lt"] = null;
                            qp["ordered-lte"] = null;
                            qp["ordered-gt"] = null;
                        } else if(res.mode == "gt") {
                            qp["ordered-lt"] = null;
                            qp["ordered-lte"] = null;
                            qp["ordered-gte"] = null;
                        }
                    }

                    this.router.go([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: "merge" })
                }


                component.destroy();
            });

        },
        amount: async () => {
            const { AmountComponent } = await import("./../filters/amount/amount.component");

            const component = this.dateContainer.createComponent(AmountComponent);


            component.instance.leave.subscribe(res => {
                if(res == "clear") {
                    this.router.go([], { relativeTo: this.route, queryParams: { "amount-lt": null, "amount-gt": null, "amount-gte": null, "amount-lte": null, "amount-eq": null, p: 0 }, queryParamsHandling: "merge" })
                }
                if (res && res != "clear") {
                    const qp: any = { p: 0 };

                    if (["lte", "gte", "gt", "lt", "eq"].includes(res.mode)) {
                        qp[`amount-${res.mode}`] = res.amount1;
                        if (res.mode == "lte") {
                            qp["amount-gt"] = null;
                            qp["amount-gte"] = null;
                            qp["amount-lt"] = null;
                            qp["amount-eq"] = null;
                        } else if(res.mode == "lt") {
                            qp["amount-gt"] = null;
                            qp["amount-gte"] = null;
                            qp["amount-lte"] = null;
                            qp["amount-eq"] = null;
                        } else if (res.mode == "gte") {
                            qp["amount-lt"] = null;
                            qp["amount-lte"] = null;
                            qp["amount-gt"] = null;
                            qp["amount-eq"] = null;
                        } else if(res.mode == "gt") {
                            qp["amount-lt"] = null;
                            qp["amount-lte"] = null;
                            qp["amount-gte"] = null;
                            qp["amount-eq"] = null;
                        } else if(res.mode == "eq") {
                            qp["amount-lt"] = null;
                            qp["amount-lte"] = null;
                            qp["amount-gte"] = null;
                            qp["amount-gt"] = null;
                        }
                    }

                    console.log(qp);

                    this.router.go([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: "merge" })
                }


                component.destroy();
            });

        },
        dishes: async () => {
            const { DishesComponent } = await import("./../filters/dishes/dishes.component");

            const component = this.dateContainer.createComponent(DishesComponent);


            component.instance.leave.subscribe(res => {
                if(res == "clear") {
                    this.router.go([], { relativeTo: this.route, queryParams: { "dishes-lt": null, "dishes-gt": null, "dishes-gte": null, "dishes-lte": null, "dishes-eq": null, p: 0 }, queryParamsHandling: "merge" })
                }
                if (res && res != "clear") {
                    const qp: any = { p: 0 };

                    if (["lte", "gte", "gt", "lt", "eq"].includes(res.mode)) {
                        qp[`dishes-${res.mode}`] = res.amount1;
                        if (res.mode == "lte") {
                            qp["dishes-gt"] = null;
                            qp["dishes-gte"] = null;
                            qp["dishes-lt"] = null;
                            qp["dishes-eq"] = null;
                        } else if (res.mode == "gte") {
                            qp["dishes-lt"] = null;
                            qp["dishes-lte"] = null;
                            qp["dishes-gt"] = null;
                            qp["dishes-eq"] = null;
                        } else if(res.mode == "eq") {
                            qp["dishes-lt"] = null;
                            qp["dishes-lte"] = null;
                            qp["dishes-gte"] = null;
                            qp["dishes-gt"] = null;
                        }
                    }

                    console.log(qp);

                    this.router.go([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: "merge" })
                }


                component.destroy();
            });
        },
        status: async () => {
            const { StatusComponent } = await import("./../filters/status/status.component");

            const component = this.dateContainer.createComponent(StatusComponent);


            component.instance.leave.subscribe(res => {
                if(res == "clear") {
                    this.router.go([], { relativeTo: this.route, queryParams: { "status": null, p: 0 }, queryParamsHandling: "merge" })
                }
                if (res && res != "clear") {
                    const qp: any = { p: 0, status: res.status, };

                    console.log(qp);

                    this.router.go([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: "merge" })
                }


                component.destroy();
            });

        },
        clear: () => {
            this.router.go([], { queryParams: { p: 0 }, relativeTo: this.route });
        }
    }


    constructor(
        private service: RestaurantService,
        private router: RouterService,
        private route: ActivatedRoute,
    ) { };

    @ViewChild("dateContainer", { read: ViewContainerRef }) dateContainer: ViewContainerRef;


    async fullOrder(id: string) {
        this.router.go(["restaurant", this.service.restaurantId, "orders", id], { replaceUrl: false });
    }

    next() {
        const p = this.route.snapshot.queryParamMap.get("p");

        this.router.go([], { relativeTo: this.route, queryParamsHandling: "merge", queryParams: { p: Number(p || 1) + 1 } });
    }
    prev() {
        const p = this.route.snapshot.queryParamMap.get("p");

        if (!isNaN(Number(p)) && Number(p) > 0) {
            this.router.go([], { relativeTo: this.route, queryParamsHandling: "merge", queryParams: { p: Number(p) - 1 } });
        }
    }

    async update() {
        this.ui.filters = this.parseFilters(this.route.snapshot.queryParams);
        const result: any = await this.service.get(this.route.snapshot.queryParams, "people", "orders");

        this.orders = result.orders || [];


        if (this.orders.length != 12) {
            this.ui.disableNext = true;
        }
    }

    ngOnInit() {
        this.restaurantId = this.service.restaurantId;
        const skip = this.route.snapshot.queryParamMap.get("p");
        if (!skip || Number(skip) == 0) {
            this.ui.disablePrev = true;
        }

        this.update();
    }




    parseFilters(ps: { [key: string]: string }): Filters {

        let date: string;
        let amount: string;
        let dishes: string;
        let status: string;

        for (let i of Object.keys(ps)) {
            const key = i.split("-")[0];
            if (key == "ordered") {
                const func = i.split("-")[1];

                if (["lt", "gt", "gte", "lte"].includes(func) && ps[i] && !isNaN(Number(ps[i]))) {
                    const d = new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "numeric", year: "numeric" }).format(Number(ps[i]));


                    switch (func) {
                        case "lt":
                            date = "Before " + d;
                            break;
                        case "lte":
                            date = "On or before " + d;
                            break;
                        case "gt":
                            date = "After " + d;
                            break;
                        case "gte":
                            date = "On of after " + d;
                            break;
                    }
                }
            } else if(key == "amount") {
                const func = i.split("-")[1];

                if (["lt", "gt", "gte", "lte", "e"].includes(func) && ps[i] && !isNaN(Number(ps[i]))) {
                    const am = Number(ps[i]) / 100;


                    switch (func) {
                        case "lt":
                            amount = "Less than $" + am;
                            break;
                        case "lte":
                            amount = "Less than or equal $" + am;
                            break;
                        case "gt":
                            amount = "More than $" + am;
                            break;
                        case "gte":
                            amount = "More than or equal $" + am;
                            break;
                        case "eq":
                            amount = "Equal to $" + am;
                            break;
                    }
                }
            } else if(key == "dishes") {
                const func = i.split("-")[1];

                if (["lt", "gt", "gte", "lte", "eq"].includes(func) && ps[i] && !isNaN(Number(ps[i]))) {
                    const am = Number(ps[i]);


                    switch (func) {
                        case "lt":
                            dishes = "Less than " + am;
                            break;
                        case "lte":
                            dishes = "Less than or equal " + am;
                            break;
                        case "gt":
                            dishes = "More than " + am;
                            break;
                        case "gte":
                            dishes = "More than or equal " + am;
                            break;
                        case "eq":
                            dishes = "Equal to " + am;
                            break;
                    }
                }
            } else if(key == "status") {

                const s = ps[i];

                if (s && ["done"].includes(s)) {

                    status = "Equal to " + s;
                }
            }
        }

        return {
            date,
            amount,
            dishes,
            status
        };
    }
}
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { CustomerService } from '../../customer.service';
import { StripePaymentElementComponent, StripeService } from "ngx-stripe";
import { ToastController } from '@ionic/angular';
import { StripeElementsOptions } from '@stripe/stripe-js';
import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { OrderService } from '../order.service';
import { Subscription } from 'rxjs';

interface PaymentInfo {
    card: boolean;
    cash: boolean;
    total: number;
    subtotal: number;
    hst: number;
    paymentIntentId: string;
    type: "dinein" | "takeout";
    id: string | null;
    clientSecret: string;
    dishes: { name: string; price: number; amount: number; }[];
    methods: { last4: string; brand: string; id: string; }[];
    _id: string;
    theme: string;
    savePaymentMethod: boolean;
};


@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.page.html',
    styleUrls: ['./checkout.page.scss'],
    animations: [
    ]
})
export class CheckoutPage implements OnInit, OnDestroy {

    data: PaymentInfo;
    theme: string;
    selectedCard: string;

    isPaying: boolean;
    subscription: Subscription;

    elementsOptions: StripeElementsOptions = {
        locale: 'en'
    };

    ui = {
        showManual: true,
    }

    constructor(
        private loader: LoadService,
        private service: CustomerService,
        private router: RouterService,
        private stripeService: StripeService,
        private toastCtrl: ToastController,
        private order: OrderService
    ) { };

    @ViewChild(StripePaymentElementComponent) paymentElement: StripePaymentElementComponent;

    back() {
        this.router.go(["customer", "order", this.service.restaurantId], { replaceUrl: true });
    }
    tracking() {
        this.router.go(["customer", "tracking", this.service.restaurantId], { replaceUrl: true });
    }

    //
    //  select card
    //
    selectCard(id: string) {
        if(id == this.selectedCard) {
            this.ui.showManual = true;
            this.selectedCard = null;
            return;
        }
        this.ui.showManual = false;
        this.selectedCard = id;
    }


    //
    //  selected card pay
    //
    async payWithCard() {
        if(!this.selectedCard) {
            return;
        }
        this.isPaying = true;
        try {
            await this.loader.start();
            const result: any = await this.service.post({ paymentMethodId: this.selectedCard }, "order", this.service.restaurantId, "session/selected-card-confirm");
    
            if(!result.created) {
                this.isPaying = false;
                (await this.toastCtrl.create({
                    duration: 2000,
                    color: "red",
                    message: "Something went wrong. Please try again",
                    mode: "ios",
                })).present();
                this.loader.end();
            }
        } catch (e) {
            if(e.status == 404) {
                return this.router.go(["cutsomer", "scan"]);
            }
        }
    }


    //
    //  manual card pay
    //
    async pay() {
        await this.loader.start();
        const result = await this.stripeService.confirmPayment({
            elements: this.paymentElement.elements,
            redirect: 'if_required',
            confirmParams: {
                save_payment_method: this.data.savePaymentMethod,
            }
        }).toPromise();

        if(result.error) {
            (await this.toastCtrl.create({
                duration: 3000,
                message: result.error.message,
                color: "red",
                mode: "ios",
            })).present();
            this.loader.end();
            return;
        }

        if(result.paymentIntent.status == "succeeded") {
            (await this.toastCtrl.create({
                duration: 2000,
                color: "green",
                message: "Successfuly payed.",
                mode: "ios",
            })).present();
            return;
        }

        (await this.toastCtrl.create({
            duration: 3000,
            message: "Something went wrong. Please try again",
            color: "warning",
            mode: "ios",
        })).present();
        this.loader.end();
    }

    async ngOnInit() {
        await this.loader.start();
        this.theme = this.service.theme;

        this.subscription = this.order.subs().subscribe(async (res: any) => {

            //
            //  when payWithCard charge succeeded or fails
            //
            if(res.type == "payment.succeeded") {
                if(this.data._id == res.orderId) {
                    (await this.toastCtrl.create({
                        duration: 1500,
                        color: "green",
                        mode: "ios",
                        message: "Pyed successfuly!"
                    })).present();
                    this.tracking();
                }
            } else if(res.type == "payment.failed") {
                if(this.isPaying && this.data._id == res.orderId) {
                    (await this.toastCtrl.create({
                        duration: 1500,
                        color: "red",
                        mode: "ios",
                        message: res.errorMessage || "Something went wrong. Please try again",
                    })).present();
                }
            }
        });

        try {
            const result: PaymentInfo = await this.service.get({}, "order", this.service.restaurantId, "session", "payment-info");

            this.data = result;
            this.theme = result.theme;
            this.service.theme = result.theme;

            this.elementsOptions.clientSecret = result.clientSecret;
        } catch (e) {
            if (e.status == 404) {
                this.router.go(["customer", "scan"]);
            } else if(e.status == 403) {
                if(e.body.reason == "dishes") {
                    (await this.toastCtrl.create({
                        duration: 1500,
                        message: "Choose some dishes first",
                        color: "orange",
                        mode: "ios",
                    })).present();
                }
                this.router.go(["customer", "order", this.service.restaurantId]);
            } else if(e.status == 500) {
                if(e.body.reason == "InvalidFunds") {
                    
                }
                this.back();
                (await this.toastCtrl.create({
                    duration: 1000,
                    mode: "ios",
                    message: "Something went wrong. Please try again",
                })).present();
            }
        }

        this.loader.end();
    }

    ngOnDestroy(): void {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}

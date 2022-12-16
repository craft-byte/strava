import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, OnInit, ViewChild, AfterViewInit, ViewContainerRef } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';
import { StripeElementsOptions } from '@stripe/stripe-js';
import { NgxStripeModule, StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { RouterService } from 'src/app/other/router.service';
import { CustomerService } from '../../customer.service';
import { OrderService } from '../order.service';
import { OrderType } from '../other/models/order';
import { WaiterRequest } from '../other/models/waiterRequest';

interface Response {
    dishes: {
        amount: number;
        name: string;
        totalPrice: number;
    }[];

    order: {
        type: OrderType;
        id: string;
        _id: string;
    };

    money: {
        subtotal: number;
        total: number;
        hst: number;
    }

    paymentMethods?: {
        last4: string;
        brand: string;
        id: string;
    }[];

    clientSecret: string;
}

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.scss'],
    standalone: true,
    imports: [CommonModule, NgxStripeModule, IonicModule],
})
export class CheckoutComponent implements OnInit, AfterViewInit {

    dishes: Response["dishes"];
    money: Response["money"];
    paymentMethods: Response["paymentMethods"];

    clientSecret: string;

    elementsOptions: StripeElementsOptions = {
        locale: "en-CA",
        appearance: {
            disableAnimations: true,
            labels: "above",
            theme: "stripe",
            variables: {
                borderRadius: "8px",
                colorPrimary: "#FFC409"
            }
        }
    }

    constructor(
        public order: OrderService,
        private service: CustomerService,
        private stripeService: StripeService,
        private router: RouterService,
        private alertCtrl: AlertController,
    ) { }


    @Output() leave = new EventEmitter();
    @ViewChild(StripePaymentElementComponent) stripePaymentElement: StripePaymentElementComponent;
    @ViewChild("paymentProgressContainer", { read: ViewContainerRef }) paymentProgressContainer: ViewContainerRef;
    @ViewChild("waiterRequestContainer", { read: ViewContainerRef }) waiterRequestContainer: ViewContainerRef;
    

    close() {
        this.leave.emit();
    }


    ngAfterViewInit(): void {
        
    }

    async pay() {

        let saveMethod = false;

        if((!this.paymentMethods || this.paymentMethods.length == 0) && this.order.userStatus == "loggedin") {
            saveMethod = await this.askToSaveMethod();
        }


        const paymentProgressComponent = await this.createPaymentProgressComponent();

        paymentProgressComponent.instance.leave.subscribe((a: "error" | "tracking") => {
            if(a == "error") {
                this.stripePaymentElement.element.clear();
            } else if(a == "tracking") {
                this.router.go(["customer", "order", this.service.restaurantId, "tracking"]);
            }

            paymentProgressComponent.destroy();
        });

        const result = await this.stripeService.confirmPayment({
            elements: this.stripePaymentElement.elements,
            redirect: "if_required",
            confirmParams: {
                save_payment_method: saveMethod,
            }
        }).toPromise();



        if(result.error) {

            console.log(result.error);

            if(result.error.code == "payment_intent_unexpected_state") {
                const update: any = await this.service.post({}, "order", this.service.restaurantId, "session", "replacePaymentIntent");

                if(update.clientSecret) {
                    this.clientSecret = update.clientSecret;
                }
            }

            paymentProgressComponent.instance.status = "error";

            return;
        }

        this.order.flow.subscribe(data => {
            if(data.type == "payment/succeeded") {
                if(this.order._id == (data as any).orderId) {
                    paymentProgressComponent.instance.status = "final";
                }
            }
        });

        if(result.paymentIntent.status == "succeeded") {

            paymentProgressComponent.instance.status = "success";

            return;
        }
    }


    async payWithCash() {
        const result: any = await this.service.post({ reason: "cash" }, "order", this.service.restaurantId, "session", "requestWaiter");

        if(!result.success) {
            return;    
        }

        const request: WaiterRequest = {
            _id: result.requestId,
            accepted: false,
            reason: "cash",
            canceled: false,
            waiter: null!,
        };

        const { WaiterRequestModalComponent } = await import("./../other/waiter-request-modal/waiter-request-modal.component");

        const component = this.waiterRequestContainer.createComponent(WaiterRequestModalComponent);

        component.instance.request = request;

        component.instance.leave.subscribe(() => {
            component.destroy();
        });

    }


    async ngOnInit() {
        const result: Response = await this.service.get({}, "order", this.service.restaurantId, "session", "checkout");

        console.log(result);

        this.dishes = result.dishes;
        this.money = result.money;
        this.paymentMethods = result.paymentMethods;
        this.clientSecret = result.clientSecret;

        this.order.type = result.order.type;
        this.order.id = result.order.id;
        this.order._id = result.order._id;
    }


    async createPaymentProgressComponent() {
        const { PaymentProgressComponent } = await import("./payment-progress/payment-progress.component");

        const component = this.paymentProgressContainer.createComponent(PaymentProgressComponent);

        return component;
    }

    async askToSaveMethod() {
        const alert = await this.alertCtrl.create({
            subHeader: "Save card?",
            message: "In case if you want to remove dish from your confirmed order, or restaurant deleted it from your order money will return immediately",
            mode: "ios",
            buttons: [
                {
                    text: "Cancel",
                },
                {
                    text: "Save",
                    role: "save"
                }
            ]
        });

        await alert.present();

        const { role } = await alert.onDidDismiss();

        return role == "save";
    }
}

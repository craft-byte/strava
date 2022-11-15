import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { StripeElementsOptions } from '@stripe/stripe-js';
import { NgxStripeModule, StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { LoadService } from 'src/app/other/load.service';
import { StaffService } from 'src/app/staff/staff.service';

@Component({
    selector: 'app-checkout-modal',
    templateUrl: './checkout-modal.component.html',
    styleUrls: ['./checkout-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, NgxStripeModule],
})
export class CheckoutModalComponent implements OnInit {

    mode = "cash";
    money: any;
    methods: any;

    elementsOptions: StripeElementsOptions = {
        locale: 'en'
    };

    ui = {
        loading: false,
        showCardButton: false,
    }

    constructor(
        private service: StaffService,
        private toastCtrl: ToastController,
        private stripeService: StripeService,
        private loader: LoadService,
    ) { };

    @ViewChild(StripePaymentElementComponent) paymentElement: StripePaymentElementComponent;
    @Output() leave = new EventEmitter();
    
    cash() {
        if(this.methods.cash) {
            this.mode = "cash";   
        }
    }
    async card() {
        if(!this.methods.card) {
            return;
        }
        this.mode = "card";

        this.ui.loading = true;

        try {
            const result: any = await this.service.get("manual", "order", "payment-intent");

            if(result) {
                this.elementsOptions.clientSecret = result.clientSecret;

                setTimeout(() => {
                    this.ui.showCardButton = true;
                }, 600);
            }
        } catch (e) {
            this.cash();
            (await this.toastCtrl.create({
                duration: 1500,
                color: "red",
                mode: "ios",
                message: "Something went wrong. Please try again",
            })).present();
        }

        this.ui.loading = false;
    }

    async cashSubmit() {
        await this.loader.start();

        const result: any = await this.service.post({ method: "cash" }, "manual", "order", "confirm", "cash");

        if(result && result.updated) {
            this.leave.emit();
        }
        this.leave.emit(true);
        
        this.loader.end();
    }
    async cardSubmit() {
        await this.loader.start();
        const result = await this.stripeService.confirmPayment({
            elements: this.paymentElement.elements,
            redirect: 'if_required',
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

            this.leave.emit(true);
            this.loader.end();
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
        
        const result: any = await this.service.get("manual", "checkout");

        if(result) {
            this.money = result.money;
            this.methods = result.methods;

            if(!result.methods.card) {
                this.mode = "cash";
            } else if(!result.methods.cash) {
                this.mode = "card";
            }
        }

        console.log(result);

    }

}

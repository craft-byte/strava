import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { StripeElementsOptions } from '@stripe/stripe-js';
import { NgxStripeModule, StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { CustomerService } from 'src/app/customer/customer.service';
import { LoadService } from 'src/app/other/load.service';

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
    standalone: true,
    imports: [CommonModule, NgxStripeModule],
})
export class CardComponent implements OnInit {

    elementsOptions: StripeElementsOptions = {
        locale: "en-CA",
    }

    constructor(
        private service: CustomerService,
        private loader: LoadService,
        private toastCtrl: ToastController,
        private stripeService: StripeService,
    ) { };

    @ViewChild(StripePaymentElementComponent) paymentElement: StripePaymentElementComponent;

    @Output() leave = new EventEmitter();
    @Input() total: number;

    async pay() {
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
        
    }

}

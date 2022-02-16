import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CustomerService } from '../customer.service';
import { PaymentModalComponent } from './payment-modal/payment-modal.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {

  dishes: { dish: string; quantity: number; }[] = [];
  totalPrice = 0;
  confirmed: string[] = [];
  comment = "";
  type: "order" | "table";

  ui = {
    timePickerMsg: ""
  }

  time = {
    hours: new Date().getHours(),
    minutes: new Date().getMinutes()
  };

  toTime = 0;

  forTime;

  constructor(
    public service: CustomerService,
    private location: Location,
    private modalController: ModalController
  ) {
    this.dishes = this.service.dishes;
    this.confirmed = this.service.confirmed;
    this.type = this.service.type;
    this.forTime = {
      buttons: [{
        text: 'Immediately',
        handler: () => {
          this.toTime = 0;
        }
      }, {
        text: 'Save',
        handler: (data) => {
          const hours = new Date().getHours();
          const minutes = new Date().getMinutes();

          const hdifference = data.hour.value - hours;
          const mdifference = data.minute.value - minutes;

          if(hdifference < 0 || mdifference < 0) {
            this.ui.timePickerMsg = "Invalid Time Picked";
            return;
          }


          this.toTime = hdifference * 3600000 + mdifference * 60000 + Date.now();
        }
      }]
    }
  };
  async showModal() {
    const modal = await this.modalController.create({
      component: PaymentModalComponent,
      cssClass: "payment-modal",
      swipeToClose: true,
      componentProps: {
        methods: this.service.payments,
        type: this.type
      }
    });
    await modal.present(); 

    const { data } = await modal.onDidDismiss();
    if(data && this.service.dishes.length > 0) {
      console.log("CONFIRMED");
      this.confirm();
    }
  }
  confirm() {
    this.service.confirm(this.comment, this.toTime);
    this.service.answers = [];
    this.comment = "";
    this.dishes = [];
    localStorage.setItem("CTRABANOTABLESESSIONDISHES", "[]");
  }
  ngOnInit() {
    this.service.totalPrice = 0;
    if(!this.service.restaurant) {
      this.location.back();
    }
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { payments } from 'src/assets/consts';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss'],
})
export class PaymentModalComponent implements OnInit {

  constructor(
    private modalCtr: ModalController
  ) { };

  m: "card" | "cash";

  

  @Input() methods: ("cash" | "card")[];
  @Input() type: "table" | "order";

  segmentChanged({ target: { value } }: any) {
    this.m = value;
  }
  close() {
    this.modalCtr.dismiss();
  }
  convertPayment(p: string) {
    for(let i of payments) {
      if(i.value === p) {
        return i.title;
      }
    }
  }
  confirm(type: "card" | "cash") {
    this.modalCtr.dismiss({ type });
  }

  ngOnInit() {
    this.m = this.methods[0];
  }

}

import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-payment-progress',
    templateUrl: './payment-progress.component.html',
    styleUrls: ['./payment-progress.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class PaymentProgressComponent implements OnInit {

    constructor() { };


    @Input() status: "error" | "pending" | "success" | "final" = "pending";

    @Output() leave = new EventEmitter();

    onError() {
        this.leave.emit("error");
    }
    tracking() {
        this.leave.emit("tracking");
    }


    ngOnInit() { }
}

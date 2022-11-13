import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
    selector: 'app-checkout-modal',
    templateUrl: './checkout-modal.component.html',
    styleUrls: ['./checkout-modal.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class CheckoutModalComponent implements OnInit {

    mode = "cash";

    constructor() { }
    
    @Output() leave = new EventEmitter();
    
    cash() {
        this.mode = "cash";   
    }
    card() {
        this.mode = "card";
    }

    cashSubmit() {
        this.leave.emit(true);
    }

    ngOnInit() { }

}

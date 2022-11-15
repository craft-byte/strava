import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { StaffService } from 'src/app/staff/staff.service';

@Component({
    selector: 'app-checkout-modal',
    templateUrl: './checkout-modal.component.html',
    styleUrls: ['./checkout-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule],
})
export class CheckoutModalComponent implements OnInit {

    mode = "cash";
    money: any;
    methods: any;

    constructor(
        private service: StaffService,
    ) { }
    
    @Output() leave = new EventEmitter();
    
    cash() {
        if(this.methods.cash) {
            this.mode = "cash";   
        }
    }
    card() {
        if(this.methods.card) {
            this.mode = "card";
        }
    }

    cashSubmit() {
        this.leave.emit("cash");
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

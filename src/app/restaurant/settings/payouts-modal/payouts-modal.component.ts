import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { RouterService } from 'src/app/other/router.service';

@Component({
    selector: 'app-payouts-modal',
    templateUrl: './payouts-modal.component.html',
    styleUrls: ['./payouts-modal.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class PayoutsModalComponent implements OnInit {

    constructor(
        private router: RouterService,
    ) { }

    @Input() status: string;
    @Input() bank: {
        last4: string;
        currency: string;
        status: string;
        routing: string;
        bank: string;
    };
    @Output() leave = new EventEmitter();

    edit() {
        this.leave.emit(true);
    }
    
    ngOnInit() { }

}

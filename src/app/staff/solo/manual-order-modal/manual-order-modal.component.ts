import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { StaffService } from '../../staff.service';

@Component({
    selector: 'app-manual-order-modal',
    templateUrl: './manual-order-modal.component.html',
    styleUrls: ['./manual-order-modal.component.scss'],
    imports: [CommonModule],
    standalone: true,
})
export class ManualOrderModalComponent implements OnInit {

    dishes: any[];
    selected: any[];

    constructor(
        private service: StaffService,
    ) { }


    @Output() leave = new EventEmitter();

    async ngOnInit() {
        const result: any = await this.service.get("solo", "manual-order", "dishes");

        console.log(result);
    }
}

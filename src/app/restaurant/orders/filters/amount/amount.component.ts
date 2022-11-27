import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { showUp } from 'src/app/other/animations';

@Component({
    selector: 'app-amount',
    templateUrl: './amount.component.html',
    styleUrls: ['./amount.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule],
    animations: showUp,
})
export class AmountComponent implements OnInit {

    amount1: number;

    constructor() { };

    @Input() mode = "gt";
    @Output() leave = new EventEmitter();


    save() {
        this.leave.emit({ mode: this.mode, amount1: this.amount1 * 100 });
    }


    ngOnInit() { }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { showUp } from 'src/app/other/animations';

@Component({
    selector: 'app-dishes',
    templateUrl: './dishes.component.html',
    styleUrls: ['./dishes.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule],
    animations: showUp,
})
export class DishesComponent implements OnInit {

    amount1: number;

    constructor() { };

    @Input() mode = "gte";
    @Output() leave = new EventEmitter();


    save() {
        this.leave.emit({ mode: this.mode, amount1: this.amount1 });
    }


    ngOnInit() { }
}

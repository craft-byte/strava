import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-dish-modal',
    templateUrl: './dish-modal.component.html',
    styleUrls: ['./dish-modal.component.scss'],
})
export class DishModalComponent implements OnInit {

    
    constructor() { }
    
    @Output() leave = new EventEmitter();
    @Input() amount: number = 0;
    @Input() dish: any;

    add() {
        this.amount++;
    }
    remove() {
        this.amount--;
    }

    save() {
        this.leave.emit(this.amount);
    }

    ngOnInit() {

    }
}

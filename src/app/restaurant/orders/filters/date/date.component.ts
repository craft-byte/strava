import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-date',
    templateUrl: './date.component.html',
    styleUrls: ['./date.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule]
})
export class DateComponent implements OnInit {

    time1: number;
    time2: number;

    constructor(
    ) { };

    @Input() mode = "lt";
    @Output() leave = new EventEmitter();


    time1Change(e: any) {
        let date = new Date(e.detail.value);
        if(this.mode == "lte" || this.mode == "gt") {
            date.setHours(23, 59, 59);
        } else if(this.mode == "gte" || this.mode == "lt") {
            date.setHours(0, 0, 0);
        }
        this.time1 = date.getTime();
    }


    save() {
        this.leave.emit({ mode: this.mode, time1: this.time1, time2: this.time2 });
    }


    ngOnInit() {

    };
}

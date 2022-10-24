import { CommonModule } from '@angular/common';
import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class TableComponent implements OnInit {

    constructor() { }

    @Input() tables: { id: number }[];
    @Input() out: boolean;
    @Output() leave = new EventEmitter()


    takeAway() {
        this.leave.emit({ out: true });
    }

    select(id: number) {
        this.leave.emit({ table: id });
    }


    ngOnInit() { }

}

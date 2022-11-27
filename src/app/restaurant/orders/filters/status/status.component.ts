import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { showUp } from 'src/app/other/animations';

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule],
    animations: showUp
})
export class StatusComponent implements OnInit {

    constructor() { };

    @Input() status = "done";
    @Output() leave = new EventEmitter();


    save() {
        this.leave.emit({ status: this.status, });
    }


    ngOnInit() { }
}

import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-comment-modal',
    templateUrl: './comment-modal.component.html',
    styleUrls: ['./comment-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class CommentModalComponent implements OnInit {

    constructor() { }

    @Input() comment = "";
    @Output() leave = new EventEmitter();

    close() {
        this.leave.emit();
    }
    save() {
        this.leave.emit(this.comment);
    }

    ngOnInit() { }

}

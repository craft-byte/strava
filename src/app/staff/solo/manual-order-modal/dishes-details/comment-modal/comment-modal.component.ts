import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-comment-modal',
    templateUrl: './comment-modal.component.html',
    styleUrls: ['./comment-modal.component.scss'],
    standalone: true,
    imports: [IonicModule, FormsModule],
})
export class CommentModalComponent implements OnInit {

    constructor() { }
    
    @Input() comment: string;
    @Output() leave = new EventEmitter();

    save() {
        this.leave.emit(this.comment);
    }

    ngOnInit() { }

}

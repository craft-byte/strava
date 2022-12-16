import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-comment',
    templateUrl: './comment.component.html',
    styleUrls: ['./comment.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, FormsModule],
    animations: [
        trigger('showUp', [
            transition(':enter', [
                group([
                    style({ background: "rgb(0,0,0,0)" }),
                    animate('200ms ease-in', style({ background: "rgb(0,0,0,0.25)" })),
                    query(".box", [
                        style({ transform: 'scale(0.7)', opacity: "0" }),
                        animate("200ms ease-in", style({ transform: 'scale(1)', opacity: "1", })),
                    ])
                ])
            ]),
            transition(':leave', [
                group([
                    animate("200ms ease-in", style({ background: "rgb(0,0,0,0.0)" })),
                    query(".box", [
                        animate('200ms ease-in', style({ transform: 'scale(0.75)', opacity: "0" })),
                    ])
                ])
            ])
        ]),
    ]
})
export class CommentComponent implements OnInit {

    newComment: string;

    constructor() { }

    @Input() comment: string;
    @Output() done = new EventEmitter();

    add() {
        this.done.emit(this.newComment);
    }

    close() {
        this.done.emit(this.comment);
    }

    ngOnInit() {
        this.newComment = this.comment;
    }

}

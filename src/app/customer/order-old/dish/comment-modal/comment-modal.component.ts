import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-comment-modal',
    templateUrl: './comment-modal.component.html',
    styleUrls: ['./comment-modal.component.scss'],
    standalone: true,
    imports: [IonicModule, FormsModule, CommonModule],
    animations: [
        trigger('showUp', [
            transition(':enter', [
                group([
                    style({ background: "rgb(0,0,0,0)" }),
                    animate('200ms ease-in', style({ background: "rgb(0,0,0,0.5)" })),
                    query(".body", [
                        style({ transform: 'scale(0.7)', opacity: "0" }),
                        animate("200ms ease-in", style({ transform: 'scale(1)', opacity: "1", })),
                    ])
                ])
            ]),
            transition(':leave', [
                group([
                    animate("200ms ease-in", style({ background: "rgb(0,0,0,0.0)" })),
                    query(".body", [
                        animate('200ms ease-in', style({ transform: 'scale(0.75)', opacity: "0" })),
                    ])
                ])
            ])
        ]),
    ]
})
export class CommentModalComponent implements OnInit, AfterViewInit {

    comment: string;

    constructor() { };

    @Input() name: string;
    @Output() leave = new EventEmitter();

    @ViewChild("focushere") textarea: ElementRef;


    save() {
        this.leave.emit(this.comment);
    }
    close() {
        this.leave.emit();
    }


    ngAfterViewInit(): void {
        this.textarea.nativeElement.focus();
    }
    ngOnInit() { }
}

import { EventEmitter, Component, OnInit, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit, Output } from '@angular/core';
import { UtilitiesService } from 'src/app/other/utilities.service';
import { Subscription } from "rxjs";
import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-account-popover',
    templateUrl: './account-popover.component.html',
    styleUrls: ['./account-popover.component.scss'],
    standalone: true,
    imports: [CommonModule],
    animations: [
        trigger("showUp", [
            transition(":enter", [
                query(".popover", [
                    style({ opacity: "0", scale: "0.8" }),
                    animate("140ms ease-in", style({ opacity: "1", scale: "1" })),
                ]),
            ]),
            transition(":leave", [
                query(".popover", [
                    style({ opacity: "1", scale: "1" }),
                    animate("140ms ease-out", style({ opacity: "0", scale: "0.9" })),
                ]),
            ])
        ])
    ]
})
export class AccountPopoverComponent implements OnInit, AfterViewInit, OnDestroy {

    subscription: Subscription;

    constructor(
    ) { };

    @ViewChild("setLocation") component: ElementRef;

    @Input() name: string;
    @Input() location: { x: number; y: number; };

    @Output() leave = new EventEmitter();



    ngAfterViewInit() {
        this.component.nativeElement.style.position = "absolute";
        this.component.nativeElement.style.top = `${this.location.y + 12}px`;
        this.component.nativeElement.style.left = `${this.location.x - 148}px`;
    }

    profile() {
        this.leave.emit("profile");
    }
    signOut() {
        this.leave.emit("signOut");
    }

    ngOnDestroy(): void {
    }

    ngOnInit() {
    }

}

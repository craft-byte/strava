import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-mode-modal',
    templateUrl: './mode-modal.component.html',
    styleUrls: ['./mode-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule],
    animations: [
        trigger("showUp", [
            transition(":enter", [
                group([
                    style({ backgroundColor: "rgba(0,0,0,0)" }),
                    animate("150ms ease-in", style({ backgroundColor: "rgba(0,0,0,0.25)" })),
                    query(".box", [
                        style({ opacity: "0", scale: "0.7" }),
                        animate("150ms ease-in", style({ opacity: "1", scale: "1" })),
                    ])
                ])
            ]),
            transition(":leave", [
                group([
                    animate("150ms ease-in", style({ backgroundColor: "rgba(0,0,0,0)" })),
                    query(".box", [
                        style({ opacity: "1", scale: "1" }),
                        animate("150ms ease-in", style({ opacity: "0", scale: "0.7" })),
                    ])
                ])
            ]),
        ])
    ]
})
export class ModeModalComponent implements OnInit {

    constructor(
        private alertCtrl: AlertController,
    ) { }

    @Input() mode: "solo" | "standart" | "disabled";
    @Output() leave = new EventEmitter();

    async select(mode: "solo" | "standart" | "disabled") {
        if(!await this.confirm()) {
            return;
        }
        this.leave.emit(mode);
    }

    async confirm() {
        const alert = await this.alertCtrl.create({
            header: "Be certain.",
            subHeader: "Are you sure you want to change the mode?",
            mode: "ios",
            buttons: [
                {
                    text: "Cancel"
                },
                {
                    text: "Submit",
                    role: "submit"
                },
            ]
        });

        await alert.present();

        const { role } = await alert.onDidDismiss();

        return role == "submit";
    }

    ngOnInit() { }
}

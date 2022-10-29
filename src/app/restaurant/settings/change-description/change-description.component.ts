import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
    selector: 'app-change-description',
    templateUrl: './change-description.component.html',
    styleUrls: ['./change-description.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule],
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
export class ChangeDescriptionComponent implements OnInit {

    newDescription: string;

    ui = {
        message: "",
    }

    constructor(
        private service: RestaurantService,
        private loader: LoadService,
    ) { };

    @Input() description: string;
    @Output() leave = new EventEmitter();

    async submit() {
        if (this.newDescription == this.description) {
            this.ui.message = "New description is the same as the old one";
            return;
        }

        await this.loader.start();

        try {
            const update: { success: boolean; } = await this.service.post({ description: this.newDescription }, "settings/description");

            if(update.success) {
                this.leave.emit(this.newDescription);
                this.loader.end();
                return;
            }
        } catch (e) {
            if(e.status == 422) {
                this.ui.message = "Description is invalid. Please try again";
            } else if(e.status == 403) {
                if(e.body.reason == "SameDescription") {
                    this.ui.message = "New description is the same as the old one";
                }
            }
            this.loader.end();
        }

  }

    ngOnInit() {

    }

}

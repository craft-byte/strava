import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
    selector: 'app-change-name',
    templateUrl: './change-name.component.html',
    styleUrls: ['./change-name.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule],
})
export class ChangeNameComponent implements OnInit {
    newName: string;

    ui = {
        message: "",
    }

    constructor(
        private service: RestaurantService,
        private loader: LoadService,
    ) { }

    @Input() name: string;
    @Output() leave = new EventEmitter();

    async submit() {
        if(this.newName == this.name) {
            this.ui.message = "New name can't be the same as old";
            return;
        }

        try {
            await this.loader.start();
            const update: { success: boolean; } = await this.service.post({ name: this.newName.trim() }, "settings/name");

            if(update.success) {
                this.leave.emit(this.newName);
                this.loader.end();
                return;
            }
        } catch (e) {
            if(e.status == 403) {
                if(e.reason == "NamesAreTheSame") {
                    this.ui.message = "New name can't be the same as old";
                }
            } else if(e.status == 422) {
                if(e.reason == "InvalidInput") {
                    this.ui.message = "Invalid name. Please try again";
                }
            }
            this.loader.end();
        }


    }

    ngOnInit() { }

}

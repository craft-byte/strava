import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
    selector: 'app-change-time',
    templateUrl: './change-time.component.html',
    styleUrls: ['./change-time.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule],
})
export class ChangeTimeComponent implements OnInit {

    opens = {
        half: "AM",
        hours: null,
        minutes: null,
        red: false,
    }
    closes = {
        half: "PM",
        hours: null,
        minutes: null,
        red: false,
    }

    constructor(
        private service: RestaurantService,
        private toastCtrl: ToastController,
    ) { }


    @Output() leave = new EventEmitter();
    @Input() time: any;

    changeHalf(w: "opens" | "closes") {
        if(w == "closes") {
            this.closes.half = this.closes.half == "AM" ? "PM" : "AM"
        } else {
            this.opens.half = this.opens.half == "AM" ? "PM" : "AM"
        }
    }

    async save() {
        if(!this.opens.minutes) {
            this.opens.minutes = 0;
        }
        if(!this.closes.minutes) {
            this.closes.minutes = 0;
        }

        if(this.opens.hours > 12 || this.opens.hours < 1) {
            return this.opens.red = true;
        } else if(this.opens.minutes > 59  || this.opens.minutes < 0) {
            return this.opens.red = true;
        }
        if(this.closes.hours > 12 || this.closes.hours < 1) {
            return this.closes.red = true;
        } else if(this.closes.minutes > 59 || this.closes.minutes < 0) {
            return this.closes.red = true;
        }

        const { closes, opens } = this;
        if(closes.half == opens.half && (closes.hours == opens.hours ? closes.minutes < opens.minutes : closes.hours < opens.hours)) {
            this.closes.red = true;
            this.opens.red = true;
            return;
        }

        const newTime = {
            opens: {
                half: this.opens.half,
                hours: this.opens.hours,
                minutes: this.opens.minutes,
            },
            closes: {
                half: this.closes.half,
                hours: this.closes.hours,
                minutes: this.closes.minutes,
            },
        }



        try {
            const result: { success: boolean; } = await this.service.post(newTime, "settings/time");
    
    
            if(result.success) {
                const cm = closes.minutes.toString().length == 1 ? `0${closes.minutes}` : closes.minutes;
                const om = opens.minutes.toString().length == 1 ? `0${opens.minutes}` : opens.minutes;

                this.leave.emit({ opens: { ...newTime.opens, minutes: om }, closes: { ...newTime.closes, minutes: cm } });
            } else {
                this.opens.red = true;
                this.closes.red = true;
            }
        } catch (e) {
            if(e.status == 422) {
                if(e.body.reason == "InvalidReason") {
                    this.opens.red = true;
                    this.closes.red = true;
                }
            }
            (await this.toastCtrl.create({
                duration: 1500,
                color: "red",
                mode: "ios",
                message: "Something went wrong. Please try again",
            })).present();
        }
    }

    ngOnInit() {
        if(this.time) {
            this.opens = { hours: +this.time.opens.hours, minutes: +this.time.opens.minutes, half: this.time.opens.half || "AM", red: false, };
            this.closes = { hours: +this.time.closes.hours, minutes: +this.time.closes.minutes, half: this.time.closes.half || "PM", red: false, };
        }
    }

}

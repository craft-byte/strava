import { CommonModule } from '@angular/common';
import { Output, Component, EventEmitter, OnInit, Input, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { SoloService } from '../../solo.service';
import { Subscription } from "rxjs";

@Component({
    selector: 'app-dish-modal',
    templateUrl: './dish-modal.component.html',
    styleUrls: ['./dish-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule],
})
export class DishModalComponent implements OnInit, OnDestroy {

    dishImage: string;
    customerAvatar: string;
    takenAvatar: string;

    takenInterval: any;
    subscription: Subscription;

    data: any;

    constructor(
        private service: StaffService,
        private toastCtrl: ToastController,
        private s: SoloService,
    ) { };

    @Input() dish: any;
    @Input() orderDish: any;
    @Output() leave = new EventEmitter();

    async getTakenInfo(data: any) {
        this.data.taken = data;
        this.data.ui.taken = true;
        this.takenAvatar = getImage(this.data.taken.user.avatar);

        if (this.data.taken.time) {
            setTimeout(() => {
                this.data.taken.time.minutes++;
                if (this.data.taken.time.minutes == 60) {
                    this.data.taken.time.minutes = 0;
                    this.data.taken.time.hours++;
                }
                this.takenInterval = setInterval(() => {
                    this.data.taken.time.minutes++
                    if (this.data.taken.time.minutes == 60) {
                        this.data.taken.time.minutes = 0;
                        this.data.taken.time.hours++;
                    }
                }, 60000);
            }, this.data.taken.time.nextMinute);
        }
    }
    async take() {
        try {
            const result: any = await this.service.post({}, "cook", "order", this.orderDish.orderId, "dish", this.orderDish._id, "take");

            if (result.success) {
                this.getTakenInfo(result.taken);
            } else {
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "red",
                    mode: "ios",
                    message: "Something went wrong. Please try again.",
                })).present();
            }
        } catch (e) {
            if (e.status == 403) {
                if (e.body.reason == "taken") {
                    (await this.toastCtrl.create({
                        duration: 2000,
                        color: "red",
                        mode: "ios",
                        message: "This dish is already taken. Please reload your page."
                    }));
                    location.reload();
                }
            }
        }
    }
    async done() {
        const result: any = await this.service.delete("cook", "order", this.orderDish.orderId, "dish", this.orderDish._id, "done");

        if(result.success) {
            this.leave.emit(true);
        } else {
            (await this.toastCtrl.create({
                message: "Something went wrong. Please try again",
                color: "red",
                duration: 1500,
                mode: "ios",
            })).present()
        }
    }

    showImage() {

    }

    fullOrder() {
        
    }


    async quit() {
        const result: any = await this.service.delete("cook", "order", this.orderDish.orderId, "dish", this.orderDish._id, "quit");

        if(result.success) {
            this.data.taken = null;
            this.data.ui.taken = false;
        }
    }


    async ngOnInit() {
        this.dishImage = getImage(this.dish.image.binary);

        const result: any = await this.service.get("cook", "order", this.orderDish.orderId, "dish", this.orderDish._id, "info");

        this.data = result;

        if (result.customer.avatar) {
            this.customerAvatar = getImage(result.customer.avatar);
        }
        if(result.taken?.user?.avatar) {
            this.takenAvatar = getImage(this.data.taken.user.avatar);
        }

        this.subscription = this.s.flow.subscribe(async res => {
            if (res.type == "kitchen/dish/take") {
                if ((res.data as any).orderDishId == this.orderDish._id) {
                    this.getTakenInfo((res.data as any).taken);
                }
            } else if (res.type == "kitchen/dish/done") {
                if ((res.data as any).orderDishId == this.orderDish._id) {
                    this.leave.emit(true);
                    (await this.toastCtrl.create({
                        duration: 1500,
                        color: "green",
                        message: "This dish has just been cooked",
                        mode: "ios",
                    })).present();
                }
            } else if (res.type == "kitchen/dish/quitted") {
                if ((res.data as any).orderDishId == this.orderDish._id) {
                    this.data.taken = null;
                    this.data.ui.taken = false;
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}

import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { WaiterRequest } from 'src/app/staff/models/WaiterRequest';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';

@Component({
    selector: 'app-waiter-request',
    templateUrl: './waiter-request.component.html',
    styleUrls: ['./waiter-request.component.scss'],
})
export class WaiterRequestComponent implements OnInit {

    avatar: string;

    constructor(
        private alertCtrl: AlertController,
        private service: StaffService,
    ) { };

    @Input() request: WaiterRequest;
    @Output() leave = new EventEmitter();

    


    async submit() {
        const alert = await this.alertCtrl.create({
            subHeader: "Cancel request",
            message: "Are you sure you want to cancel the request?",
            mode: "ios",
            buttons: [
                {
                    text: "No"
                },
                {
                    text: "Cancel",
                    role: "cancel",
                }
            ]
        });

        await alert.present();

        const { role } = await alert.onDidDismiss();

        return role == "cancel";
    }

    async cancel() {
        const submitted = await this.submit();

        if(!submitted) {
            return;
        }


        const result: any = await this.service.delete("waiter", "waiterRequest", this.request._id);

        if(result.updated) {
            this.leave.emit({
                type: "remove",
                requestId: this.request._id
            });
        }
    }

    async accept() {
        const result: any = await this.service.post({}, "waiter", "waiterRequest", this.request._id);


        if(result.updated) {
            this.leave.emit({
                type: "accept",
                request: this.request
            });
        }
    }


    ngOnInit() {
        this.avatar = getImage(this.request.customer.avatar);
    }

}

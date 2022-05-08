import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'dish-modal-page',
    templateUrl: './dish-modal.page.html',
    styleUrls: ['./dish-modal.page.scss'],
})
export class DishModalPage implements OnInit {



    constructor(
        private modalCtrl: ModalController
    ) { };

    @Input() name: string;
    @Input() type: string; 

    close() {
        this.modalCtrl.dismiss(false);
    }

    done() {
        this.modalCtrl.dismiss(true);
    }


    ngOnInit() {
    }

}

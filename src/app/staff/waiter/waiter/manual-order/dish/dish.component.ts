import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';

interface ReturnedDish {
    name: string;
    price: number;
    time: number;
    category: string;
    description: string;
    image: { binary: any; resolution: number; };
}

@Component({
    selector: 'app-dish',
    templateUrl: './dish.component.html',
    styleUrls: ['./dish.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class DishComponent implements OnInit {

    dish: ReturnedDish;

    image: string;
    imageClass: string;

    new = 0;

    constructor(
        private service: StaffService,
        private loader: LoadService,
    ) { }

    @Output() leave = new EventEmitter();
    @Input() dishId: string;
    @Input() amount: number;


    add() {
        this.new++;
        this.amount++;
    }
    remove() {
        this.new--;
        this.amount--;
    }

    close() {
        if(this.new > 0) {
            this.leave.emit({ name: this.dish.name, price: this.dish.price, amount: this.amount, _id: this.dishId });
            return;
        }
        this.leave.emit();
    }


    async ngOnInit() {

        const result: ReturnedDish = await this.service.get("waiter", "manual", "dish", this.dishId);

        if(!result) {
            this.leave.emit();
            return;
        }

        if(result.image && result.image.binary) {
            this.image = getImage(result.image.binary);

            if(result.image.resolution == 1) {
                this.imageClass = "r1";
            } else if(result.image.resolution == 1.33) {
                this.imageClass = "r2";
            } else if(result.image.resolution == 1.77) {
                this.imageClass = "r3";
            }
        }

        this.dish = result;

        this.loader.end();
    }

}

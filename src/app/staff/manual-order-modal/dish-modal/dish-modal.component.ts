import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';

@Component({
    selector: 'app-dish-modal',
    templateUrl: './dish-modal.component.html',
    styleUrls: ['./dish-modal.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule],
})
export class DishModalComponent implements OnInit {

    image: string;
    
    constructor(
        private service: StaffService,
    ) { }
        
    @Output() leave = new EventEmitter<boolean>();
    @Input() amount: number = 0;
    @Input() dishId: any;
    @Input() dish: any;
        
    add() {
        this.leave.emit(true);
        this.amount++;
    }

    async ngOnInit() {
        this.dish = await this.service.get("dish", this.dishId);

        this.image = getImage(this.dish.image.binary);
    }
}

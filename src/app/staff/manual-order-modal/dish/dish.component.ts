import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';

@Component({
    selector: 'app-dish',
    templateUrl: './dish.component.html',
    styleUrls: ['./dish.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class DishComponent implements OnInit {

    image: string;

    constructor(
        private service: StaffService,
    ) { }
    
    @Input() dish: any;


    async ngOnInit() {
        if(!this.dish.hasImage) {
            this.image = "./../../../../../assets/images/no-image.jpg";
            return;
        }

        const result: any = await this.service.get("dish", this.dish._id, "image");

        if(result && result.binary) {
            this.image = getImage(result.binary);
        }
    }
}

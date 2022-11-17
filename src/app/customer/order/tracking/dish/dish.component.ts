import { Component, OnInit, Input } from '@angular/core';
import { getImage } from 'src/functions';

@Component({
    selector: 'app-dish',
    templateUrl: './dish.component.html',
    styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

    image: string;
    name: string;

    constructor() { }

    @Input() dish: any;
    @Input() orderDish: any;


    ngOnInit() {
        this.name = this.dish?.name || "Deleted";
        this.image = this.dish?.image;
    }

}

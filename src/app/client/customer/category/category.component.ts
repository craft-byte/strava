import { Component, Input, OnInit } from '@angular/core';
import { CustomerService } from '../../customer.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryComponent implements OnInit {

  image: string;

  constructor(
    private service: CustomerService
  ) { };

  @Input() data: { name: string; };

  async ngOnInit() {
    // this.image = (await this.service.getCategoryImage(this.data.name)).image;
    this.image = (await this.service.get<{ image: string }>("categoryImage", [this.service.restaurantId], {name: this.data.name})).image;
  }

}

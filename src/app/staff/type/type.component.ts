import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-type',
  templateUrl: './type.component.html',
  styleUrls: ['./type.component.scss'],
})
export class TypeComponent implements OnInit {

  title: string;
  class: string;

  constructor() { }

  @Input() type: string;

  ngOnInit() {
    switch (this.type) {
      case "d":
        this.title = "Deserts";
        this.class = "t1";
        break;
      case "c":
        this.title = "Coffee";
        this.class = "t2";
        break;
      case "h":
        this.title = "Orange";
        this.class = "t3";
        break;
      case "m":
        this.title = "Meat";
        this.class = "t4";
        break;
      case "a":
        this.title = "Alcohol";
        this.class = "t5";
        break;
      case "j":
        this.title = "Juice";
        this.class = "t6";
        break;
      case "f":
        this.title = "Fry";
        this.class = "t7";
        break;
      case "v":
        this.title = "Vegetables";
        this.class = "t8";
        break;
    }
  }

}

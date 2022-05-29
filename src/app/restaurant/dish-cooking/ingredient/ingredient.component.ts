import { ThisReceiver } from '@angular/compiler';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-ingredient',
  templateUrl: './ingredient.component.html',
  styleUrls: ['./ingredient.component.scss'],
})
export class IngredientComponent implements OnInit {

  amount: number;

  constructor() { };

  @Input() c: any;

  @Output() Emitter = new EventEmitter();

  add() {
    this.Emitter.emit({ _id: this.c._id, amount: this.amount });
  }


  ngOnInit() { }

}

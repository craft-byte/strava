import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-cash',
  templateUrl: './cash.component.html',
  styleUrls: ['./cash.component.scss'],
})
export class CashComponent implements OnInit {

  constructor() { }

  @Input() total: number;
  @Output() leave = new EventEmitter();

  submit() {
    this.leave.emit(true);
  }

  ngOnInit() {}

}

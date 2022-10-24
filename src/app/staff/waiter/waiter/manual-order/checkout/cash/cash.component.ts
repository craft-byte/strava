import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-cash',
  templateUrl: './cash.component.html',
  styleUrls: ['./cash.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
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

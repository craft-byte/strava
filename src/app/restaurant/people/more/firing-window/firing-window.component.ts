import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { User } from 'src/models/user';

@Component({
  selector: 'app-firing-window',
  templateUrl: './firing-window.component.html',
  styleUrls: ['./firing-window.component.scss'],
})
export class FiringWindowComponent implements OnInit {

  username: string = null;
  comment: string = null;
  stars: number = 3;

  constructor() { };


  @Input() user: User;
  @Output() Emitter = new EventEmitter();

  quit() {
    this.Emitter.emit({ type: "quit" });
  }

  onRatingChange(a: number) {
    this.stars = a;
  }

  fire() {
    this.Emitter.emit({ type: "fire", data: { comment: this.comment, stars: this.stars } });
  }

  ngOnInit() {
    this.username = this.user.name || this.user.username;
  }

}

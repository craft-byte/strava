import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { RadminService } from 'src/app/restaurant/radmin.service';
import { getImage } from 'src/functions';
import { Worker } from 'src/models/radmin';
import { User } from 'src/models/user';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


@Component({
  selector: 'app-worker',
  templateUrl: './worker.component.html',
  styleUrls: ['./worker.component.scss'],
})
export class WorkerComponent implements OnInit {

  user: User;

  image: string;
  name: string;

  date: string;

  constructor(
    private service: RadminService,
    private router: Router
  ) { };


  @Input() data: Worker;
  @Output() Emitter = new EventEmitter();

  getDate() {
    const d = new Date(this.data.joined);
    const month = monthNames[d.getMonth()];

    this.date = `${d.getDate()} ${month}`;
  }

  go() {
    this.router.navigate(["radmin/people/staff/more", this.user._id], { queryParamsHandling: "preserve" });
  }

  more(btn: any) {
    this.Emitter.emit({ type: "more", data: {btn, user: this.data._id} });
  }

  async ngOnInit() {
    this.user = await this.service.get("user/get", this.data._id);
    if(this.user.avatar) {
      this.image = await getImage(this.user.avatar);
    }
    if(this.user.name) {
      this.name = this.user.name;
    } else {
      this.name = this.user.username;
    }
    this.getDate();
  }

}

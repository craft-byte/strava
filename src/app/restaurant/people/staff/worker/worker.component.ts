import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RadminService } from 'src/app/restaurant/radmin.service';
import { getImage } from 'src/functions';
import { Worker } from 'src/models/components';
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

  image: string;
  name: string;

  constructor(
    private service: RadminService,
    private router: Router,
    private route: ActivatedRoute
  ) { };


  @Input() data: any;
  @Output() Emitter = new EventEmitter();


  go() {
    this.router.navigate(["more", this.data._id], { relativeTo: this.route, queryParamsHandling: "preserve" });
  }

  more(btn: any) {
    this.Emitter.emit({ type: "more", data: {btn, user: this.data._id} });
  }

  async ngOnInit() {
    if(this.data.avatar) {
      this.image = await getImage(this.data.avatar);
    }
    if(this.data.name) {
      this.name = this.data.name;
    } else {
      this.name = this.data.username;
    }
  }

}

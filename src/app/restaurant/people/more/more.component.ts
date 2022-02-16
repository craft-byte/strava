import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/models/user';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss'],
})
export class MoreComponent implements OnInit {

  user: User;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RadminService
  ) { };

  back() {
    this.router.navigate(["radmin/people/staff"], { queryParamsHandling: "preserve" });
  }

  async ngOnInit() {
    const user = this.route.snapshot.paramMap.get("id");
    this.user = await this.service.get("user/get", user);
    console.log(this.user);
  }

}

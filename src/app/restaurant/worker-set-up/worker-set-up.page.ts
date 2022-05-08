import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerSettings } from 'src/models/components';
import { Restaurant } from 'src/models/general';
import { User } from 'src/models/user';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-worker-set-up',
  templateUrl: './worker-set-up.page.html',
  styleUrls: ['./worker-set-up.page.scss'],
})
export class WorkerSetUpPage implements OnInit {

  restaurant: Restaurant;
  user: User;

  role: string;

  ui = {
    title: "",
    showError: false,
    error: ""
  }
  
  settings: any = null;

  constructor(
    private service: RadminService,
    private route: ActivatedRoute,
    private router: Router
  ) { };

  close() {
    this.router.navigate(["invite-user", this.restaurant._id], { queryParamsHandling: "preserve" });
  }

  setRole(role: string) {
    if (role == "manager") {
      this.settings = {
        dishes: {
          add: false,
          remove: false,
        },
        staff: {
          hire: false,
          fire: false,
          settings: false,
          statistics: false,
        },
        components: {
          add: false,
          remove: false,
        },
        customers: {
          blacklisting: false,
          statistics: false,
        },
        restaurant: {
          logo: false,
          theme: false,
        },
        work: {
          cook: false,
          waiter: false,
        }
      } as ManagerSettings;
    }
    this.role = role;
  }

  async submit() {
    const worker = {
      userId: this.user._id,
      role: this.role,
      settings: this.settings
    };

    const result = await this.service.post<any>(worker, "staff", this.restaurant._id, "invite");

    if(result.acknowledged) {
      this.router.navigate(["restaurant", this.restaurant._id, "people", "staff"], { queryParamsHandling: "preserve", replaceUrl: true });
    }
  }

  setSetting(one: string, two: string) {
    this.settings[one][two] = !this.settings[one][two];
  }

  async ngOnInit() {
    const userId = this.route.snapshot.paramMap.get("user");
    const restaurantId = this.route.snapshot.params.restaurantId;
    this.restaurant = await this.service.getRestaurant(restaurantId);
    this.user = await this.service.get("user/setUp", this.restaurant._id, userId);

    if(this.user.hasOwnProperty("error")) {
      const { error } = this.user as unknown as any;

      if(error == "works") {
        this.ui.title = "Something went wrong";
        this.ui.showError = true;
        this.ui.error = `The worker already works in your restaurant.`;
      }
      return;
    } else {
      this.ui.title = `Add ${this.user.name} to ${this.restaurant.name}`;
    }

  }
}

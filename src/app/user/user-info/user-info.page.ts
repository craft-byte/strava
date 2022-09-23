import { compilePipeFromMetadata } from '@angular/compiler';
import { Component, OnInit, Injector, ViewChild, ViewContainerRef } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
})
export class UserInfoPage implements OnInit {



  restaurants: any[] = [];

  role: "manager" | "waiter" | "cook" = null!;


  ui = {
    title: "Straba",
    showRestaurants: false,
    showAddRestaurant: false,
    showEmail: false,
    fullName: ""
  };

  constructor(
    private service: UserService, 
    private main: MainService,
    private router: RouterService,
    private loader: LoadService,
    private injector: Injector,
  ) {
  }


  @ViewChild("accountPopoverContainer", { read: ViewContainerRef }) accountPopover: ViewContainerRef;


  
  customer() {
    this.router.go(["customer"]);
  }
  goWork(restaurantId: string) {
    this.router.go(["staff", restaurantId, "dashboard"], { replaceUrl: true });
  }
  addRestaurant() {
    this.router.go(["add-restaurant/start"], { replaceUrl: true });
  }
  findJob() {
    this.router.go(["jobs"], { queryParams: { role: this.role }, queryParamsHandling: "merge", replaceUrl: true });
  }
  emailVerification() {
    this.router.go(["user/email/verification"]);
  }


  async openAccount(event: any) {

    console.log(event.target.offsetHeight);
    console.log(event.target.offsetLeft);

    const { AccountPopoverComponent } = await import("./account-popover/account-popover.component");

    const component = this.accountPopover.createComponent(AccountPopoverComponent, { injector: this.injector });

    component.instance.name = this.ui.fullName;
    component.instance.location = { x: event.target.offsetLeft, y: event.target.offsetHeight };

    component.instance.leave.subscribe(action => {
        if(action == "profile") {
            this.router.go(["user","profile"]);
        } else if(action == "signOut") {
            this.main.removeUserInfo();
            this.router.go(["login"]);
        }
        component.destroy();
    });


  }


  async ngOnInit() {
    await this.loader.start();
    this.router.go([], { queryParams: { last: null } }, false);

    const { ui, restaurants } = await this.service.get<any>("");

    this.restaurants = restaurants;
    this.ui = ui;

    
    this.loader.end();
  }
}

import { Component, OnInit } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { getImage } from 'src/functions';
import { runInThisContext } from 'vm';
import { UserService } from '../user.service';


interface Profile {
    email: string;
    name: { first: string; last: string; };
    avatar: any;
}


@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {


    data: Profile;
    avatar: string;

    constructor(
        private router: RouterService,
        private loader: LoadService,
        private main: MainService,
        private service: UserService,
    ) { };

    back() {
        this.router.go(["user/info"]);
    }
    settings() {
        this.router.go(["user/settings"]);
    }

    async init(event?: any) {
        await this.loader.start();

        const result = await this.service.get<Profile>("profile");

        this.main.user = { ...this.main.user, ...result };

        this.data = this.main.user as any; // this.main.user instead of result is because when name changes in settings it automatically will appear here as part of this.main.user

        if(this.data.avatar) {
            this.avatar = getImage(this.data.avatar);
        }
        
        if(event) {
            setTimeout(() => {
                this.loader.end();
                event?.target?.complete();
            }, 500);
        } else {
            this.loader.end();
        }
    }

    async ngOnInit() {
        this.init();
    }

}

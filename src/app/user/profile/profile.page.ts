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

    async ngOnInit() {
        await this.loader.start();

        const result = await this.service.get<Profile>("profile");

        this.data = result;

        this.avatar = getImage(result.avatar);


        this.loader.end();
    }

}

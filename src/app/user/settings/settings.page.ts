import { preserveWhitespacesDefault } from '@angular/compiler';
import { Component, OnInit, Injector, ViewChild, ViewContainerRef } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { getImage } from 'src/functions';
import { threadId } from 'worker_threads';
import { UserService } from '../user.service';


interface Profile {
    email: string;
    name: { first: string; last: string; };
    avatar: any;
    anon: boolean;
}



@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

    data: Profile;
    avatar: string;
    avatarChanged: boolean = false;

    constructor(
        private router: RouterService,
        private loader: LoadService,
        private toastCtrl: ToastController,
        private service: UserService,
        private injector: Injector,
        private main: MainService,
    ) { };

    @ViewChild("passwordModalContainer", { read: ViewContainerRef }) passwordModal: ViewContainerRef;
    @ViewChild("avatarModalContainer", { read: ViewContainerRef }) avatarModal: ViewContainerRef;
    @ViewChild("removeModalContainer", { read: ViewContainerRef }) removeModal: ViewContainerRef;


    back() {
        this.router.go(["user/profile"]);
    }
    changeEmail() {
        this.router.go(["user", "reset-email"]);
    }

    /**
     * 
     * sends POST /user/profile/update
     * updates name, anonymously setting, and avatar if it has been changed 
     * 
     */
    async save() {
        await this.loader.start();

        const result = await this.service.post<any>({ name: this.data.name, anon: this.data.anon, avatar: this.avatarChanged ? this.avatar : null }, "profile/update");

        if (result.success) {
            this.main.user.name = this.data.name;
            if(this.avatarChanged) {
                this.main.user.avatar = this.avatar;
                this.main.user.changedAvatar = true;
            }
            this.back();
        } else {
            (await this.toastCtrl.create({
                duration: 1500,
                color: "red",
                message: "Something went wrong, please try again",
                mode: "ios",
            })).present();
        }

        this.loader.end();

    }

    /**
     * opens avatar-modal.component modal
     */
    async setAvatar() {
        const { AvatarModalComponent } = await import("./avatar-modal/avatar-modal.component");

        const component = this.avatarModal.createComponent(AvatarModalComponent, { injector: this.injector });

        component.instance.leave.subscribe(async (img?: string) => {
            if (img) {
                if (img == "error") {
                    (await this.toastCtrl.create({
                        duration: 1500,
                        color: "red",
                        message: "Failed to load image. Please try again.",
                        mode: "ios",
                    })).present();
                } else {
                    this.avatar = img;
                    this.avatarChanged = true;
                }
            }
            component.destroy();
        });

    }

    /**
     * opens password-modal.component modal
     */
    async changePassword() {
        const { PasswordModalComponent } = await import("./password-modal/password-modal.component");

        const component = this.passwordModal.createComponent(PasswordModalComponent, { injector: this.injector });

        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }


    async ngOnInit() {
        await this.loader.start();

        const result = await this.service.get<Profile>("profile");

        this.data = result;

        this.avatar = getImage(this.data.avatar);

        this.loader.end();
    }

}

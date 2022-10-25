import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AlertController, ModalController, Platform, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import jsQR from 'jsqr';
import { CustomerService } from '../customer.service';
import { TableComponent } from './table/table.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-scan',
    templateUrl: './scan.page.html',
    styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit {

    restaurants: any;

    canvasElement: any;
    videoElement: any;
    canvasContext: any;

    stream: MediaStream;

    result: string = null!;

    ui = {
        showScan: false,
        showOther: true,
        showScanner: true,
    }


    constructor(
        private router: RouterService,
        private loader: LoadService,
        private service: CustomerService,
        private modalCtrl: ModalController,
        private plt: Platform,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController,
        private route: ActivatedRoute,
    ) {
        const isInStandaloneMode = () =>
            'standalone' in window.navigator && window.navigator['standalone'];
        if (this.plt.is('ios') && isInStandaloneMode()) {
            this.ui.showOther = true;
            this.ui.showScanner = false;
        }
    };

    @ViewChild('video', { static: false }) video: ElementRef;
    @ViewChild('canvas', { static: false }) canvas: ElementRef;




    back() {
        this.router.go(["user/info"]);
        this.stopRecording();
    }


    async confirmTable() {
        const alert = await this.alertCtrl.create({
            header: "Oops...",
            message: "Seems like someone is on the table, do you want to continue?",
            mode: "ios",
            buttons: [
                {
                    text: "Cancel",
                },
                {
                    text: "Continue",
                    role: "continue"
                }
            ]
        });
        await alert.present();

        const { role } = await alert.onDidDismiss();

        if (role == "continue") {
            return true;
        }
        return false;
    }
    async createSession(restaurantId: string, table: number, order: boolean) {
        try {
            const result: { other: boolean; updated: boolean; } = await this.service.post({ table: table, order, force: false }, "restaurant", restaurantId, "create");

            if (result.other) {
                const force = await this.confirmTable();

                if (force) {
                    try {
                        const result: { updated: boolean; } = await this.service.post({ table: table, order, force: true }, "restaurant", restaurantId, "create");

                        if (result.updated) {
                            this.router.go(["customer", "order", restaurantId]);
                        } else {
                            (await this.toastCtrl.create({
                                duration: 2000,
                                color: "red",
                                mode: "ios",
                                message: "Something went wrong. Please try again"
                            })).present();
                            this.startScan();
                        }
                    } catch (e) {
                        if (e.status == 404) {
                            this.startScan();
                            (await this.toastCtrl.create({
                                duration: 1000,
                                message: "Restaurant not found",
                                color: "red",
                                mode: "ios",
                            })).present();
                        } else if (e.status == 403) {
                            if (e.body.reason == "settings") {
                                (await this.toastCtrl.create({
                                    duration: 1000,
                                    message: "Sorry, restaurant disabled take away orders.",
                                    color: "orange",
                                    mode: "ios",
                                })).present();
                            } else if (e.body.reason == "blacklisted") {
                                (await this.toastCtrl.create({
                                    duration: 1000,
                                    message: "Sorry, you were blacklisted in this restaurant.",
                                    color: "orange",
                                    mode: "ios",
                                })).present();
                            }
                            this.startScan();
                        }
                    }
                } else {
                    this.startScan();
                }
            } else if (result.updated) {
                this.stopRecording();
                this.router.go(["customer", "order", restaurantId]);
            } else {
                (await this.toastCtrl.create({
                    duration: 2000,
                    color: "red",
                    mode: "ios",
                    message: "Something went wrong. Please try again"
                })).present();
                this.startScan();
            }
        } catch (e) {
            if (e.status == 404) {
                this.startScan();
                (await this.toastCtrl.create({
                    duration: 1000,
                    message: "Restaurant not found",
                    color: "red",
                    mode: "ios",
                })).present();
            } else if (e.status == 403) {
                if (e.body.reason == "settings") {
                    (await this.toastCtrl.create({
                        duration: 1000,
                        message: "Sorry, restaurant disabled take away orders.",
                        color: "orange",
                        mode: "ios",
                    })).present();
                } else if (e.body.reason == "blacklisted") {
                    (await this.toastCtrl.create({
                        duration: 1000,
                        message: "Sorry, you were blacklisted in this restaurant.",
                        color: "orange",
                        mode: "ios",
                    })).present();
                }
                this.startScan();
            } else if(e.status == 422) {
                (await this.toastCtrl.create({
                    duration: 1000,
                    message: "Something went wrong. Please try again (422)",
                    color: "red",
                    mode: "ios",
                })).present();
            }
        }
    }


    //
    //    WHEN RESTAURANT SELECTED
    //
    async selectRestaurant(restaurantId: string) {
        await this.createSession(restaurantId, null!, false);
    }


    //
    //    WHEN QR CODE SCANNED
    //
    //    if url has table order created with table
    //    if url has order=true query order created with type='out'
    //
    async onScanned() {
        if (!this.result) {
            this.startScan();
            return;
        }


        this.stopRecording();


        try {
            // ex.    https://ctraba.com/doesn't-matter/what-matters-are-query-params?restaurantId=63000acd4ebc81862fb5354f&table=3&order=true
            const splitted = this.result.split("?");
            const query = splitted[1];  // result    --=  restaurantId=63000acd4ebc81862fb5354f&table=3&order=true  =--
            const queries = query.split("&");    // result    ['restaurantId=63000acd4ebc81862fb5354f', 'table=3', 'order=true']

            let restaurantId: string;
            let table: number;
            let order: boolean = false;

            for (let i of queries) {
                const [name, value] = i.split("=");
                if (!name || !value) {
                    continue;
                }
                if (name == "restaurantId") {
                    if (value.length != 24) {
                        throw 'restaurantId';
                    }
                    restaurantId = value;
                } else if (name == "table") {
                    table = Number(value);
                    if (isNaN(table)) {
                        table = null!;
                    }
                } else if (name == "order") {
                    if (value == "true") {
                        order = true;
                    } else if (value == "false") {
                        order = false;
                    }
                }
            }

            if (!restaurantId) {
                const try2 = splitted[0].split("/")[splitted[0].split("/").length - 1];
                if(try2.length == 24) {
                    restaurantId = try2;
                } else {
                    throw 'restaurantId';
                }
            }

            this.createSession(restaurantId, table, order);
        } catch (e) {
            if (e == 'restaurantId') {
                (await this.toastCtrl.create({
                    duration: 2000,
                    color: "red",
                    message: "Scanned url is invalid",
                    mode: "ios",
                })).present();
            }
        }
    }


    stopRecording() {
        this.stream.getVideoTracks().forEach(t => t.stop());
    }

    //
    //    SCAN
    //
    async scan() {
        if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
            this.ui.showScan = true;

            this.canvasElement.height = this.videoElement.videoHeight;
            this.canvasElement.width = this.videoElement.videoWidth;

            this.canvasContext.drawImage(
                this.videoElement,
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height
            );
            const imageData = this.canvasContext.getImageData(
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height
            );
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

            if (code) {
                this.ui.showScan = false;
                this.result = code.data;
                // (this.videoElement as HTMLVideoElement).remove();
                this.onScanned();
            } else {
                if (this.ui.showScan) {
                    requestAnimationFrame(this.scan.bind(this));
                }
            }
        } else {
            requestAnimationFrame(this.scan.bind(this));
        }
    }
    async startScan() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });


            this.videoElement.srcObject = this.stream;
            this.videoElement.setAttribute('playsinline', true);

            this.videoElement.play();
            requestAnimationFrame(this.scan.bind(this));
        } catch (error) {
            this.ui.showScanner = false;
            this.ui.showOther = true;
        }

    }

    async ngAfterViewInit() {
        this.canvasElement = this.canvas.nativeElement;
        this.canvasContext = this.canvasElement.getContext('2d');
        this.videoElement = this.video.nativeElement;

        this.startScan();
    }
    async ngOnInit() {
        await this.loader.start();
        const restaurantId = this.route.snapshot.queryParamMap.get("restaurantId");
        const table = this.route.snapshot.queryParamMap.get("table");


        this.restaurants = await this.service.get({}, "restaurants");

        this.loader.end();
    }
}

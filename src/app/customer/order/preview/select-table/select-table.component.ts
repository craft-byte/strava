import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import jsqr from 'jsqr';
import { CustomerService } from 'src/app/customer/customer.service';
import { OrderService } from '../../order.service';


@Component({
    selector: 'app-select-table',
    templateUrl: './select-table.component.html',
    styleUrls: ['./select-table.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class SelectTableComponent implements OnInit, AfterViewInit, OnDestroy {

    scannedUrl: string;

    stream: MediaStream;

    ui = {
        showVideo: false,
        showLoading: false,
    }

    constructor(
        private toastCtrl: ToastController,
        private service: CustomerService,
        private order: OrderService,
    ) { }

    @ViewChild('videoElement') videoElement: ElementRef<HTMLVideoElement>;
    @Output() leave = new EventEmitter();

    close() {
        this.leave.emit();
    }


    async ngAfterViewInit() {
        this.stream = await navigator.mediaDevices
            .getUserMedia({ video: true })

        this.videoElement.nativeElement.srcObject = this.stream;
        await this.videoElement.nativeElement.play();


        requestAnimationFrame(() => {
            if (this.videoElement.nativeElement.readyState === this.videoElement.nativeElement.HAVE_ENOUGH_DATA) {
                this.ui.showVideo = true;
                this.scanQRCode()
            }
        });
    }


    scanQRCode() {
        const video = this.videoElement.nativeElement;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsqr(imageData.data, imageData.width, imageData.height);


        if (code && code.data) {
            console.log(code);
            this.onUrlScanned(code.data);
        } else {
            // If no QR code was found, schedule the scanQRCode method to
            // be called again
            setTimeout(() => {
                requestAnimationFrame(() => this.scanQRCode());
            }, 100);
        }
    }

    async onUrlScanned(url: string) {
        this.ui.showLoading = true;
        this.ui.showVideo = false;
        this.stream = null;

        const parsedUrl = new URL(url);
        const searchParams = new URLSearchParams(parsedUrl.search);

        // Get the value of the "table" query parameter, or null if it does not exist
        const tableParamValue = searchParams.get('table');

        if (!tableParamValue) {
            this.startScanning("Scanned QR code is invalid");

            return;
        }


        try {
            const update: any = await this.service.post({ table: tableParamValue }, "order", this.service.restaurantId, "session", "table");

            if (!update.updated) {
                this.startScanning("Scanned QR code is invalid");
                return;
            }

            this.order.id = tableParamValue;
        } catch (e) {
            if (e.status == 403) {
                this.startScanning("Scanned QR code's table is invalid");
                return;
            }

            this.startScanning("Something went wrong. Please try again")
        }

    }

    async startScanning(message: string) {
        this.ngAfterViewInit();
        this.ui.showLoading = false;
        this.ui.showVideo = true;

        (await this.toastCtrl.create({
            duration: 2000,
            color: "red",
            mode: "ios",
            message: message
        })).present();
    }


    ngOnInit() {};

    ngOnDestroy(): void {
        this.stream.getVideoTracks().forEach(track => track.stop());
    }

}

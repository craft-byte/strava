export function getImage(file: File | string, quality?: number) {
    return new Promise<string>((resolve, _reject) => {
        if(!file) {
            resolve(null);
            return;
        }
        if(typeof file === 'string') {
            resolve(`data:image/jpeg;base64,${file}`);
            return;
        }
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (event) => {
            const blob = new Blob([event.target.result]);
            const blobUrl = window.URL.createObjectURL(blob);

            const image = new Image();

            image.src = blobUrl;

            image.onload = async () => {
                const canvas = document.createElement("canvas");

                const width = 400;
                const height = image.height / (image.width / 400);

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(image, 0, 0, width, height);

                resolve(canvas.toDataURL("image/jpeg", quality || 1));
            };
        };
    });
}
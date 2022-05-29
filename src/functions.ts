export function getImage(file: Buffer) {
    if(file) {
        return `data:image/jpeg;base64,${file.toString("base64")}`;
    }
    return null;
}
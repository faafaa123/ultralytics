import * as THREE from 'three';
import { graphics } from './classes/graphics';
import * as ort from "onnxruntime-web";
import { getTrees, loadImage } from './treeDetector';
ort.env.wasm.wasmPaths = "/node_modules/onnxruntime-web/dist/";
import proj4 from "proj4";
import axios from 'axios';

let Graphics: graphics;

var time = 0;

let clock: THREE.Clock = new THREE.Clock();

init()

animate()

async function init() {

    Graphics = new graphics()

    Graphics.main()

    const boundingBox = [
        9.124732, 
        51.432518,
        9.130832,
        51.435724,
    ]

    const width = 1024

    const height = 1024

    let min = convertCoords(boundingBox[0], boundingBox[1])

    let max = convertCoords(boundingBox[2], boundingBox[3])

    const image = await getImage(`${min[0]}, ${min[1]}, ${max[0]}, ${max[1]}`)

    let detections = await getTrees(image, boundingBox, width, height, Graphics)

}

async function getImage(boundingBox: string): Promise<ImageData> {
    const cachedImageKey = "wms-image-cache";
    const cachedBoundingBoxKey = "wms-image-bbox";

    const cachedImage = localStorage.getItem(cachedImageKey);
    const cachedBoundingBox = localStorage.getItem(cachedBoundingBoxKey);

    if (cachedImage && cachedBoundingBox === boundingBox) {
        console.log('Load from localstorage')
        return await loadImageFromDataUrl(cachedImage);
    }

    const url = "https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows";

    const params = {
        SERVICE: "WMS",
        VERSION: "1.3.0",
        REQUEST: "GetMap",

        // Layer aus GetCapabilities
        LAYERS: "he_dop_cir",

        // Koordinatensystem
        CRS: "EPSG:3857",

        // Bounding Box in UTM-Koordinaten
        BBOX: boundingBox,

        WIDTH: 1024,
        HEIGHT: 1024,

        FORMAT: "image/png",
        TRANSPARENT: false
    };

    const response = await axios.get(url, {
        params,
        responseType: "arraybuffer"
    });

    const blob = new Blob(
        [response.data],
        { type: "image/png" }
    );

    const imageUrl = URL.createObjectURL(blob);

    try {
        const raster = await loadImageFromUrl(imageUrl);
        const dataUrl = await blobToDataUrl(blob);

        localStorage.setItem(cachedImageKey, dataUrl);
        localStorage.setItem(cachedBoundingBoxKey, boundingBox);

        return raster;
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}

function loadImageFromUrl(imageUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const context = canvas.getContext('2d');
            if (!context) {
                reject(new Error('Failed to create canvas context.'));
                return;
            }

            context.drawImage(img, 0, 0);
            resolve(context.getImageData(0, 0, canvas.width, canvas.height));
        };
        img.onerror = () => reject(new Error("Failed to load image."));

        img.src = imageUrl;
    });
}

function loadImageFromDataUrl(dataUrl: string): Promise<ImageData> {
    return loadImageFromUrl(dataUrl);
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image blob."));

        reader.readAsDataURL(blob);
    });
}

function convertCoords(lon_: number, lat_: number) {

    const [lon, lat] = [lon_, lat_];

    const utm = proj4(
        "EPSG:4326",
        "EPSG:3857",
        [lon, lat]
    );

    return utm

}

function animate() {

    requestAnimationFrame(animate);

    render()

}

function render() {

    var deltaTime = clock.getDelta();

    Graphics.controls.update(deltaTime);

    Graphics.renderer.render(Graphics.scene, Graphics.camera);

    time += deltaTime;

}


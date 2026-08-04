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
        9.115831,
        51.408452,
        9.118033,
        51.409613, 
    ]

    const width = 1024

    const height = 1024

    let min = convertCoords(boundingBox[0], boundingBox[1])

    let max = convertCoords(boundingBox[2], boundingBox[3])

    const image = await getImage(`${min[0]}, ${min[1]}, ${max[0]}, ${max[1]}`, width, height, 'he_dop_rgb')

    let detections = await getTrees(image, [min[0], min[1], max[0], max[1]], width, height, Graphics)

}

async function getImage(boundingBox: string, width: number, height: number, layers: 'he_dop_rgb' | 'he_dop_cir'): Promise<HTMLImageElement> {

    let cachedImageKey
    let cachedBoundingBoxKey

    let cachedImage
    let cachedBoundingBox

    if (layers === 'he_dop_rgb') {

        cachedImageKey = "wms-image-cache-rgb";
        cachedBoundingBoxKey = "wms-image-bbox-rgb";

        cachedImage = localStorage.getItem(cachedImageKey);
        cachedBoundingBox = localStorage.getItem(cachedBoundingBoxKey);

    }

    else if (layers === 'he_dop_cir') {

        cachedImageKey = "wms-image-cache-cir";
        cachedBoundingBoxKey = "wms-image-bbox-cir";

        cachedImage = localStorage.getItem(cachedImageKey);
        cachedBoundingBox = localStorage.getItem(cachedBoundingBoxKey);

    }

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
        LAYERS: layers,

        // Koordinatensystem
        CRS: "EPSG:3857",

        // Bounding Box in UTM-Koordinaten
        BBOX: boundingBox,

        WIDTH: width,
        HEIGHT: height,

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

function loadImageFromUrl(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image."));

        img.src = imageUrl;
    });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
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


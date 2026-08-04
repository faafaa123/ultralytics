import * as THREE from 'three';
import { graphics } from './classes/graphics';
import * as ort from "onnxruntime-web";
import { getTrees, loadImage } from './treeDetector';
ort.env.wasm.wasmPaths = "/node_modules/onnxruntime-web/dist/";
import proj4 from "proj4";
import axios from 'axios';
import { getImage } from './hesseWebMapService';

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


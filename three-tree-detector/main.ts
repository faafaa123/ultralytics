import * as THREE from 'three';
import { graphics } from './classes/graphics';
import * as ort from "onnxruntime-web";

let Graphics: graphics;

var time = 0;

let clock: THREE.Clock = new THREE.Clock();

init()

animate()

async function init() {

    Graphics = new graphics()

    Graphics.main()

    const session = await ort.InferenceSession.create(
        "tree_detector.onnx"
    );

    // const image = await loadImage("tree.jpg");

    // const tensor = imageToTensor(image, 640);

    // const results = await session.run({
    //     images: tensor
    // });

    // console.log(results);

    // console.log(session.inputNames);
    // console.log(session.outputNames);

}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = reject;

        image.src = src;
    });
}

function imageToTensor(
    image: HTMLImageElement,
    size: number
): ort.Tensor {

    const canvas = document.createElement("canvas");

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(image, 0, 0, size, size);

    const imageData = ctx.getImageData(
        0,
        0,
        size,
        size
    );

    const data = new Float32Array(3 * size * size);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {

            const src = (y * size + x) * 4;
            const dst = y * size + x;

            data[dst] =
                imageData.data[src] / 255;

            data[size * size + dst] =
                imageData.data[src + 1] / 255;

            data[2 * size * size + dst] =
                imageData.data[src + 2] / 255;
        }
    }

    return new ort.Tensor(
        "float32",
        data,
        [1, 3, size, size]
    );
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


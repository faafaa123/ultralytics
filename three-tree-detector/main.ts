import * as THREE from 'three';
import { graphics } from './classes/graphics';
import * as ort from "onnxruntime-web";
ort.env.wasm.wasmPaths = "/node_modules/onnxruntime-web/dist/";

let Graphics: graphics;

var time = 0;

let clock: THREE.Clock = new THREE.Clock();

init()

animate()

async function init() {

    Graphics = new graphics()

    Graphics.main()

    await main()

}

async function main() {

    const session = await ort.InferenceSession.create(
        "tree_detector.onnx"
    );

    const image = await loadImage("tree.jpg");

    const tensor = imageToTensor(image, 640);

    const results = await session.run({
        images: tensor
    });

    // console.log(results);

    // console.log(session.outputNames);

    // for (const name of session.outputNames) {
    //     const output = results[name];

    //     console.log("Name:", name);
    //     console.log("Shape:", output.dims);
    //     console.log("Data:", output.data);
    // }

    const output = results[session.outputNames[0]];

const detections = decodeYOLO(
    output,
    0.25
);

console.log(detections);

}

interface Detection {
    x: number;
    y: number;
    width: number;
    height: number;

    classId: number;
    confidence: number;
}

function decodeYOLO(
    output: ort.Tensor,
    confidenceThreshold = 0.25
): Detection[] {

    const data = output.data as Float32Array;

    const numPredictions = output.dims[2];
    const numClasses = output.dims[1] - 4;

    const detections: Detection[] = [];

    for (let i = 0; i < numPredictions; i++) {

        const x = data[0 * numPredictions + i];
        const y = data[1 * numPredictions + i];
        const width = data[2 * numPredictions + i];
        const height = data[3 * numPredictions + i];

        // Beste Klasse suchen
        let bestClassId = -1;
        let bestConfidence = 0;

        for (let classId = 0; classId < numClasses; classId++) {

            const confidence =
                data[(4 + classId) * numPredictions + i];

            if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestClassId = classId;
            }
        }

        if (bestConfidence < confidenceThreshold)
            continue;

        detections.push({
            x,
            y,
            width,
            height,
            classId: bestClassId,
            confidence: bestConfidence
        });
    }

    return detections;
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


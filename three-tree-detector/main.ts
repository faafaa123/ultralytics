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

    const image = await loadImage("tree.jpg");

    const boundingBox = [1014768.6632021207, 6693863.781530092, 1015004.1039251484, 6694083.652151881]

    const width = 3000

    const height = 3000

    const detections = await main(image, boundingBox, width, height)

    console.log(detections);

    const canvas = drawDetections(
        image,
        detections,
        640,
        640
    );

    document.body.appendChild(canvas);

}

async function main(
    image: HTMLImageElement,
    boundingBox: number[],
    imageWidth: number,
    imageHeight: number
) {

    const session = await ort.InferenceSession.create(
        "tree_detector.onnx"
    );

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
        0.03,
        boundingBox,
        imageWidth,
        imageHeight
    );

    return detections

}

interface Detection {
    x: number;
    y: number;
    width: number;
    height: number;

    mercatorX: number;
    mercatorY: number;
    mercatorWidth: number;
    mercatorHeight: number;

    classId: number;
    className: string;

    confidence: number;
}

const classNames = [
    "-",
    "0",
    "banana_tree",
    "banana_tree2",
    "blur tree",
    "kelapa_sawit",
    "tree",
    "tree_crowd"
];

function drawDetections(
    image: HTMLImageElement,
    detections: Detection[],
    modelWidth: number,
    modelHeight: number
): HTMLCanvasElement {

    const canvas = document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext("2d")!;

    // Originalbild zeichnen
    ctx.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Skalierungsfaktoren
    const scaleX = canvas.width / modelWidth;
    const scaleY = canvas.height / modelHeight;

    for (const detection of detections) {

        // YOLO liefert Center-X / Center-Y
        const x = detection.x * scaleX;
        const y = detection.y * scaleY;

        const width = detection.width * scaleX;
        const height = detection.height * scaleY;

        // Linke obere Ecke berechnen
        const left = x - width / 2;
        const top = y - height / 2;

        // Bounding Box
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;

        ctx.strokeRect(
            left,
            top,
            width,
            height
        );

        // Text
        const text =
            `${detection.className} ${(detection.confidence * 100).toFixed(1)}%`;

        ctx.font = "16px Arial";

        const textWidth =
            ctx.measureText(text).width;

        ctx.fillStyle = "red";

        ctx.fillRect(
            left,
            top - 22,
            textWidth + 8,
            22
        );

        ctx.fillStyle = "white";

        ctx.fillText(
            text,
            left + 4,
            top - 6
        );
    }

    const maxHeight = 900;

    if (canvas.height > maxHeight) {
        const scale = maxHeight / canvas.height;

        canvas.style.height = `${maxHeight}px`;
        canvas.style.width = `${canvas.width * scale}px`;
    }

    return canvas;
}

function decodeYOLO(
    output: ort.Tensor,
    confidenceThreshold = 0.25,
    boundingBox: number[] = [0, 0, 1, 1],
    imageWidth = 640,
    imageHeight = 640
): Detection[] {

    const data = output.data as Float32Array;

    const numClasses = output.dims[1] - 4;
    const numPredictions = output.dims[2];

    const detections: Detection[] = [];

    for (let i = 0; i < numPredictions; i++) {

        const x = data[0 * numPredictions + i];
        const y = data[1 * numPredictions + i];
        const width = data[2 * numPredictions + i];
        const height = data[3 * numPredictions + i];

        const minX = boundingBox[0];
        const minY = boundingBox[1];
        const maxX = boundingBox[2];
        const maxY = boundingBox[3];

        const sourceWidth = imageWidth;
        const sourceHeight = imageHeight;

        const modelSize = 640;

        const pixelX = (x / modelSize) * sourceWidth;
        const pixelY = (y / modelSize) * sourceHeight;
        const pixelWidth = (width / modelSize) * sourceWidth;
        const pixelHeight = (height / modelSize) * sourceHeight;

        const mercatorX = minX + (pixelX / sourceWidth) * (maxX - minX);
        const mercatorY = maxY - (pixelY / sourceHeight) * (maxY - minY);
        const mercatorWidth = (pixelWidth / sourceWidth) * (maxX - minX);
        const mercatorHeight = (pixelHeight / sourceHeight) * (maxY - minY);

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

            mercatorX,
            mercatorY,
            mercatorWidth,
            mercatorHeight,

            classId: bestClassId,
            className: classNames[bestClassId],

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


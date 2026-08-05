import * as THREE from 'three';
import * as ort from "onnxruntime-web";
import { graphics } from '../classes/graphics';
import { segmentize } from '../segmentize';
ort.env.wasm.wasmPaths = "/node_modules/onnxruntime-web/dist/";

export async function getTrees(
    image: HTMLImageElement,
    boundingBox: number[],
    width: number,
    height: number,
    Graphics: graphics
) {

    const detections = await createDetectionsViaOnnx(image, boundingBox, width, height, 0.02)

    console.log('Detections:')

    console.log(detections);

    let polygons = detections.map(e => [e.mercatorPolygon])

    let groups = segmentize(Graphics, polygons, true)

    let remainingIndices = findRemainingPolygons(groups, groups.length)

    const remainingDetections = remainingIndices.map(
        index => detections[index]
    ).filter(e => e != undefined);

    console.log('remainingDetections:')

    console.log(remainingDetections)

    if (Graphics) {

        const canvas = drawDetections(
            image,
            remainingDetections.filter(e => e != undefined),
            640,
            640
        );

        document.body.appendChild(canvas);

    }

    return remainingDetections

}

function getMiddle(a, b) {
    return (a + b) / 2;
}

async function createDetectionsViaOnnx(
    image: HTMLImageElement,
    boundingBox: number[],
    imageWidth: number,
    imageHeight: number,
    conf: number
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
        conf,
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
    mercatorPolygon: [number, number][];

    treeHeight: number;

    classId: number;
    className: string;

    confidence: number;
}

function findRemainingPolygons(edges, polygonCount) {
    // Nachbarschaftsliste
    const neighbors = Array.from({ length: polygonCount }, () => new Set());

    for (const { indexI, indexJ } of edges) {
        neighbors[indexI].add(indexJ);
        neighbors[indexJ].add(indexI);
    }

    const removed = new Set();

    while (true) {
        let maxDegree = 0;
        let worstNode = -1;

        for (let i = 0; i < polygonCount; i++) {
            if (removed.has(i)) continue;

            let degree = 0;
            for (const n of neighbors[i]) {
                if (!removed.has(n))
                    degree++;
            }

            if (degree > maxDegree) {
                maxDegree = degree;
                worstNode = i;
            }
        }

        if (maxDegree === 0)
            break;

        removed.add(worstNode);
    }

    const remaining = [];
    for (let i = 0; i < polygonCount; i++) {
        if (!removed.has(i))
            remaining.push(i);
    }

    return remaining;
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

        const mercatorPolygon: [number, number][] = [
            [mercatorX, mercatorY],
            [mercatorX + mercatorWidth, mercatorY],
            [mercatorX + mercatorWidth, mercatorY + mercatorHeight],
            [mercatorX, mercatorY + mercatorHeight],
            [mercatorX, mercatorY]
        ];

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
            mercatorPolygon,

            treeHeight: getMiddle(mercatorWidth, mercatorHeight),

            classId: bestClassId,
            className: classNames[bestClassId],

            confidence: bestConfidence
        });
    }

    return detections;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
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
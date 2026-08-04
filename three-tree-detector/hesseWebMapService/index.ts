import axios from "axios";

export async function getImage(boundingBox: string, width: number, height: number, layers: 'he_dop_rgb' | 'he_dop_cir'): Promise<HTMLImageElement> {

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

        return await loadImageFromDataUrl(cachedImage, layers);

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

        if (layers === 'he_dop_rgb') {

            const raster = await loadRgbImageFromUrl(imageUrl);
            const dataUrl = await blobToDataUrl(blob);

            localStorage.setItem(cachedImageKey, dataUrl);
            localStorage.setItem(cachedBoundingBoxKey, boundingBox);

            return raster;

        }

        else if (layers === 'he_dop_cir') {

            const raster = await loadCirImageFromUrl(imageUrl);
            const dataUrl = await blobToDataUrl(blob);

            localStorage.setItem(cachedImageKey, dataUrl);
            localStorage.setItem(cachedBoundingBoxKey, boundingBox);

            return raster;

        }

    }

    finally {

        URL.revokeObjectURL(imageUrl);

    }

}

function loadRgbImageFromUrl(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image."));

        img.src = imageUrl;
    });
}

function loadCirImageFromUrl(imageUrl: string): Promise<ImageData> {
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

function loadImageFromDataUrl(dataUrl: string, layers: 'he_dop_rgb' | 'he_dop_cir'): Promise<ImageData> {

    if (layers === 'he_dop_rgb') {

        return loadRgbImageFromUrl(dataUrl);

    }

    else if (layers === 'he_dop_cir') {

        return loadCirImageFromUrl(dataUrl);

    }

}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image blob."));

        reader.readAsDataURL(blob);
    });
}
import { Box } from './geometry.js';
import * as tf from '@tensorflow/tfjs'

export async function createSegmenter() {
    const MODEL_URL='model/tfjs_model/model.json';
    // console.log("LOADING MODEL")
    const loadedModel = await tf.loadLayersModel(MODEL_URL);
    return new Segmenter(loadedModel);
}

export class Segmenter {

    constructor(model) {
        this.model = model;
    }

    getOutputSize() {
        return [this.model.input.shape[2], this.model.input.shape[1]];
    }

    async handlePredict(img, debugCanvas) {
        const debugCtx = debugCanvas?.getContext("2d");

        const [inputWidth, inputHeight] = this.getOutputSize();

        let offscreenCanvas = document.createElement("canvas")
        offscreenCanvas.width = inputWidth;
        offscreenCanvas.height = inputHeight;
        let offscreenCtx = offscreenCanvas.getContext("2d");

        const inputRatio = inputHeight / inputWidth;
        const imgRatio = img.width / img.height;

        let newWidth;
        let newHeight;
        if (imgRatio > inputRatio) {
            newHeight = inputHeight;
            newWidth = newHeight * imgRatio;
        } else {
            newWidth = inputWidth;
            newHeight = newWidth / imgRatio;
        }

        offscreenCtx.filter = "brightness(.8) contrast(2)";
        offscreenCtx.drawImage(img, 0, 0, newWidth, newHeight);

        const imgData = offscreenCtx.getImageData(0, 0, inputWidth, inputHeight);
        window.imgTensor = tf.browser.fromPixels(imgData).asType('float32').expandDims();

        const tfout = this.model.predict(window.imgTensor);

        await tf.browser.toPixels(tfout.squeeze(), offscreenCanvas);

        const predImg = offscreenCtx.getImageData(0, 0, newWidth, newHeight);
        offscreenCtx.fillStyle = "#000";
        offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.filter = "brightness(.5) contrast(4) brightness(10)";
        // turn ImageData into ImageBitmap so we can use drawImage() which uses filters:
        const predBmp = await window.createImageBitmap(predImg);
        offscreenCtx.drawImage(predBmp, 0, 0);

        // Visualize for debugging:
        debugCtx?.drawImage(predBmp, 0, 0);

        const srcm = cv.imread(offscreenCanvas);
        cv.imshow(debugCanvas, srcm); 
        const dstm = new cv.Mat();

        // convert from 4 channel to 1 channel:
        cv.cvtColor(srcm, dstm, cv.COLOR_RGBA2GRAY);

        cv.medianBlur(dstm, dstm, 3);
        // cv.blur(window.dstm, window.dstm, new cv.Size(15, 15));
        cv.threshold(dstm, dstm, 200, 255, cv.THRESH_BINARY)
        
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(dstm, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const contourId = -1;

        cv.cvtColor(dstm, dstm, cv.COLOR_GRAY2RGBA);
        cv.drawContours(dstm, contours, contourId, new cv.Scalar(255, 10, 10, 255), 1, cv.LINE_8, hierarchy, 100);
        cv.imshow(debugCanvas, dstm); 

        const MIN_RECT_AREA=500;

        let newBoxes = [];

        const modelToImgScale = img.width / newWidth;
        for (let ci = 0; ci < contours.size(); ci++) {

            const contour = contours.get(ci);
            const area = cv.contourArea(contour);
            if (area < MIN_RECT_AREA) continue; 

            const rect = cv.minAreaRect(contour);
            rect.size.width += 20;
            rect.size.height += 20;
            
            // scale to match input image size:
            rect.center.x *= modelToImgScale;
            rect.center.y *= modelToImgScale;
            rect.size.width *= modelToImgScale;
            rect.size.height *= modelToImgScale;
            newBoxes.push(new Box(rect.center.x, rect.center.y, rect.size.width, rect.size.height, rect.angle));

            const rectPoints = cv.RotatedRect.points(rect);
            for (let i = 0; i < 4; i++) {
                const j = (i + 1) % 4;
                cv.line(dstm, rectPoints[i], rectPoints[j], new cv.Scalar(0, 255, 0, 255), 2, cv.LINE_AA, 0);
            }
        }
        cv.imshow(debugCanvas, dstm); 
        cv.imshow(debugCanvas, srcm); 

        return newBoxes;
        
    }
}
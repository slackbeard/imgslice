import * as tf from '@tensorflow/tfjs'
import { useEffect, useState, useRef } from 'react';

export function Segmenter() {
    const [model, setModel] = useState(null);
    const imgRef = useRef(null);
    const canvRef = useRef(null);
    const outRef = useRef(null);

    useEffect(() => {
        (async () => {
            console.log("LOADING MODEL")
            const MODEL_URL='model/tfjs_model/model.json';
            const loadedModel = await tf.loadLayersModel(MODEL_URL);
            setModel(loadedModel);
        })();

    }, []);

    const handlePredict = async () => {
        if (imgRef.current == null) {
            return;
        } 

        window.imgTensor = tf.browser.fromPixels(imgRef.current).asType('float32').expandDims();

        const tfout = model.predict(window.imgTensor);

        window.tfout = tfout;
        await tf.browser.toPixels(tfout.squeeze(), canvRef.current);

        window.src = canvRef.current;
        window.dst = outRef.current;

        window.srcm = cv.imread(canvRef.current);
        // window.dstm = new cv.Mat.zeros(window.srcm.rows, window.srcm.cols, cv.CV_8UC3);
        window.dstm = new cv.Mat();

        // convert from 4 channel to 1 channel:
        cv.cvtColor(window.srcm, window.dstm, cv.COLOR_RGBA2GRAY);

        // scale down from [0...255] to [0...1]
        // window.srcm.convertTo(window.dstm, cv.CV_32F, 1.0/255.0);

        cv.medianBlur(window.dstm, window.dstm, 7);
        // cv.blur(window.dstm, window.dstm, new cv.Size(15, 15));
        cv.threshold(window.dstm, window.dstm, 200, 255, cv.THRESH_BINARY)
        
        window.contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(window.dstm, window.contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const contourId = -1;
        cv.drawContours(window.srcm, window.contours, contourId, new cv.Scalar(255, 10, 10, 255), 1, cv.LINE_8, hierarchy, 100);
        cv.cvtColor(window.dstm, window.dstm, cv.COLOR_GRAY2RGBA);
        cv.drawContours(window.dstm, window.contours, contourId, new cv.Scalar(255, 10, 10, 255), 1, cv.LINE_8, hierarchy, 100);

        const MIN_RECT_AREA=500;

        for (let ci = 0; ci < window.contours.size(); ci++) {

            const contour = window.contours.get(ci);
            const area = cv.contourArea(contour);
            if (area < MIN_RECT_AREA) continue; 

            const rect = cv.minAreaRect(contour);
            rect.size.width += 20;
            rect.size.height += 20;
            
            const rectPoints = cv.RotatedRect.points(rect);
            for (let i = 0; i < 4; i++) {
                const j = (i + 1) % 4;
                cv.line(window.dstm, rectPoints[i], rectPoints[j], new cv.Scalar(0, 255, 0, 255), 2, cv.LINE_AA, 0);
            }

        }


        cv.imshow(canvRef.current, window.srcm); 
        cv.imshow(outRef.current, window.dstm); 
        
    };
    return (
        <>
        <h2>Segmenter here</h2>
        { model? 
        <button onClick={handlePredict}>Predict</button>
        :
        <button disabled>Predict</button>
        }
        <img src="original.png" ref={imgRef} width="480" height="320"/>
        <canvas ref={canvRef} width="480" height="320" style={{width:480, height:320}} />
        <canvas ref={outRef} width="480" height="320" style={{width:480, height:320}} />
        {/* <button onClick={loadModel}>Load model</button> */}
        </>
    );
    
}
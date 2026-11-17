import { Editor } from './Editor.jsx'
import { Box } from './geometry.js';
import { Thumbnail } from './Thumbnail.jsx'

import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';

import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import CropToolbar from './CropToolbar.jsx'
import { useRef, useState, useEffect } from 'react';

import { createSegmenter } from './segmenter.js';

import { ViewTransformContext, SelectionContext } from './Contexts';

const EDITOR_WIDTH=768;
const EDITOR_HEIGHT=1024;

export default function App() {

    const debugCanvasRef = useRef();
    const [model, setModel] = useState();
    const [imgUrl, setImgUrl] = useState("");
    const [boxes, setBoxes] = useState([]);
    const [selectedId, setSelectedId] = useState(-1);
    const [viewTransform, setViewTransform] = useState({x: 0, y: 0, scale: 1});

    const handleLoadFile = (e) => {
        (async () => {
            const file = e.target.files[0];
            console.log(`loading file ${file}`);

            const img = await window.createImageBitmap(file);
            setImgUrl(URL.createObjectURL(file));

            if (model && debugCanvasRef.current) {
                const newBoxes = await model.handlePredict(img, debugCanvasRef.current);
                let nextId = 0;
                setBoxes(newBoxes.map(b => {
                    return {
                        box: b,
                        id: nextId++,
                        highlighted: false,
                    }
                }));
                if (img.width > EDITOR_WIDTH) {
                    setViewTransform({
                        x: 0,
                        y: 0,
                        scale: EDITOR_WIDTH / img.width
                    })
                }
            }
        })();
    };


    useEffect(() => {

        (async () => {
            console.log(`Loading model...`);
            setModel(await createSegmenter());

            setBoxes([
                {
                    id: 0,
                    box: new Box(300, 400, 90, 20, 10),
                    highlighted:false,
                },
                {
                    id: 1,
                    box: new Box(350, 400, 90, 20, 20),
                    highlighted:false,
                },
            ]);
        })();

    }, []);

    const handleTransform = (x, y, w, h, angle, id) => {
        setBoxes(boxes.map((b) => {
            if (b.id == id) {
                b.box.x = x;
                b.box.y = y;
                b.box.w = w;
                b.box.h = h;
                b.box.angle = angle;
            }
            return b;
        }));
    }

    const handleMouseEnter = (id) => {
        setBoxes(boxes.map((b) => {
            if (b.id == id) {
                b.highlighted = true;
            }
            return b;
        }));
    }
    const handleMouseLeave = (id) => {
        setBoxes(boxes.map((b) => {
            if (b.id == id) {
                b.highlighted = false;
            }
            return b;
        }));
    }

    const selectBox = (id) => {
        setSelectedId(id);

        // bump the box to the top of the stack:
        const selectedIndex = boxes.findIndex(b => b.id == id);
        if (selectedIndex == -1) return;

        const selectedBox = boxes[selectedIndex];
        const newBoxes = boxes;
        newBoxes.splice(selectedIndex, 1);
        newBoxes.push(selectedBox);

        setBoxes(newBoxes);

    }

    const boxesById = [...boxes];
    boxesById.sort((b1, b2) => b1.id - b2.id);

    return <Paper elevation={3}>
      <CropToolbar onLoadFile={handleLoadFile}/>
      <Divider />

      <Stack direction="row" sx={{backgroundColor: "#f0f0f0"}}>
        <ViewTransformContext value={{viewTransform, setViewTransform}} >
            <SelectionContext value={{selectedId: selectedId, setSelectedId: selectBox}} >
                <Editor width={EDITOR_WIDTH} height={EDITOR_HEIGHT} imgUrl={imgUrl} crops={boxes} onBoxTransform={handleTransform} /> 
            </SelectionContext>
        </ViewTransformContext>

        <Paper square elevation={3} sx={{width:"100%"}}>
           <List component="nav">
            <ListSubheader>Crops</ListSubheader>
            {boxesById.map(b => 
                <Thumbnail
                    imgSrc="/real_scan1.jpg"
                    selected={selectedId == b.id}
                    onSelect={() => selectBox(b.id)}
                    onHighlight={() => handleMouseEnter(b.id)}
                    onUnhighlight={() => handleMouseLeave(b.id)}
                    />
            )}
          </List>
        </Paper>
      </Stack>
      <canvas ref={debugCanvasRef} width={320} height={480} style={{width: 320, height: 480, borderWidth: "1px", borderColor: "black", borderStyle: "solid" }} />
    </Paper>
    
}
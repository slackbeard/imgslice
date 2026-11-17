import { useContext, useEffect, useState, useRef } from 'react';
import { Frame } from './Frame';
import styles from './Editor.module.css';

import Paper from '@mui/material/Paper';

import { ViewTransformContext, ActionStateContext, SelectionContext, viewToWorld } from './Contexts';

import { makeDragHandler } from './drag';

const actionIconMap = {
    "moving": null,
    "rotating": "/muid_rotate.svg",
};

export function Editor ({width, height, imgUrl, crops=[], onBoxTransform }) {

    const paperRef = useRef();
    const [actionState, setActionState] = useState("");
    const [cursorXY, setCursorXY] = useState({x: 0, y: 0});
    const {selectedId, setSelectedId} = useContext(SelectionContext);
    const {viewTransform, setViewTransform} = useContext(ViewTransformContext);

    const cursorIcon = actionIconMap[actionState];

    useEffect(() => {
        if (paperRef.current) {
            paperRef.current.addEventListener('mousewheel', handleMouseWheel);
        }

        return () => {
            if (paperRef.current) {
                paperRef.current.removeEventListener('mousewheel', handleMouseWheel);
            }
        };
    });

    const handleViewPan = makeDragHandler((sx, sy, onDragMove) => {
        const [startViewX, startViewY] = [viewTransform.x, viewTransform.y];
        const [startDragX, startDragY] = viewToWorld(sx, sy, viewTransform);

        onDragMove((mx, my) => {
            const [dragX, dragY] = viewToWorld(mx, my, viewTransform);
            const [deltaX, deltaY] = [dragX - startDragX, dragY - startDragY];

            setViewTransform({
                x: startViewX + deltaX,
                y: startViewY + deltaY,
                scale: viewTransform.scale
            });
            
        });
    }, 2);

    const handleMouseDown = (e) => {
        if (e.nativeEvent.buttons & 1) {
           setSelectedId(-1);
        }
    }
    const handleMouseWheel = (e) => {
        e.preventDefault();

        const deltaScale = e.deltaY > 0? -.1: .1;
        let newScale = viewTransform.scale + deltaScale;

        if (newScale <= .1) {
            newScale = .1;
        }
        setViewTransform({...viewTransform, scale: newScale});
    };

    const handleMouseMove = (e) => {
        // setCursorXY({
        //     x: e.nativeEvent.offsetX,
        //     y: e.nativeEvent.offsetY,
        // });
    }
    const handleMouseUp = (e) => {
        setActionState("");
    }

    const handleMouseLeave = (e) => {
        setActionState("");
    }

    return <div className={styles.editor}>
    <ActionStateContext value={{actionState, setActionState}}>
        <Paper
            ref={paperRef}
            elevation={3}
            sx={{margin: "10px"}}
            onMouseDown={handleViewPan}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            >
            <svg 
                viewBox={"0 0 " + width + " " + height}
                xmlns="http://www.w3.org/2000/svg" 
                style={{width:width, height:height, cursor: actionState? `url("${cursorIcon}") 12 12, auto`: "auto" }}
                >

                <rect x={0} y={0} width="100%" height="100%" fill="#FFF" stroke="none" onMouseDown={handleMouseDown}/>
                <g transform={` scale(${viewTransform.scale}) translate(${viewTransform.x} ${viewTransform.y})`}>
                { (imgUrl) && <image href={imgUrl} style={{pointerEvents: "none"}}/> }
                </g>

                <ViewTransformContext value={viewTransform} >
                        { crops.map(b => <Frame
                            key={b.id}
                            x={b.box.x}
                            y={b.box.y}
                            w={b.box.w}
                            h={b.box.h}
                            angle={b.box.angle}
                            selected={selectedId == b.id}
                            highlighted={b.highlighted}
                            onMouseDown={() => setSelectedId(b.id)}
                            onTransform={(newX, newY, newW, newH, newAngle) => onBoxTransform(newX, newY, newW, newH, newAngle, b.id)}
                            />)}
                </ViewTransformContext>
                {/* {(cursorIcon) && <image href={cursorIcon} x={cursorXY.x} y={cursorXY.y} /> } */}
            </svg>
        </Paper>
    </ActionStateContext>
    </div>
}
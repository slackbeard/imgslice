import { useContext } from 'react';
import styles from './Frame.module.css';
import { ViewTransformContext, ActionStateContext, viewToWorld, worldToView } from './Contexts';
import { makeDragHandler } from './drag';

export function CornerHandle({x, y, r=5, angle=0, onMouseDown}) {
    return <>
    <g transform={`translate(${x} ${y})`}>
        <marker
        id="arrow"
        viewBox="0 -15 15 30"
        markerUnits="strokeWidth"
        markerWidth={4}
        markerHeight={4}
        fill="none"
        refX={6}
        refY={0}
        orient="auto-start-reverse">
            <path d="M 0 10 L 10 0 L 0 -10" strokeWidth={6} />
        </marker>

        <path
            transform={`rotate(${angle})`}
            d={`
            M ${-r} ${-r} A ${r} ${r} 0 0 0 ${r} ${r}
            `}
            fill="none"
            strokeWidth={5}
            markerEnd="url(#arrow)"
            markerStart="url(#arrow)"
            onMouseDown={onMouseDown}
            style={{ cursor: 'url("/muid_rotate.svg") 12 12, auto'}}
            />

    </g>
    </>
}

export function Frame ({x, y, w, h, angle=0, selected, highlighted, onMouseDown, onTransform}) {

    const viewTransform = useContext(ViewTransformContext);
    const { actionState, setActionState } = useContext(ActionStateContext);

    const makeResizeHandler = (resizeHandler) => {
        return makeDragHandler((sx, sy, onDragMove) => {
            const [startX, startY] = viewToWorld(sx, sy, viewTransform);

            const [localX, localY] = [startX - x, startY - y];

            const wx = Math.cos(angle * Math.PI / 180.0);
            const wy = Math.sin(angle * Math.PI / 180.0);

            // project mouse click onto width axis:
            const wAtDragStart = localX * wx + localY * wy;
            const wOffset = Math.abs(wAtDragStart) - (w / 2);

            const hx = Math.sin(angle * Math.PI / 180.0);
            const hy = -Math.cos(angle * Math.PI / 180.0);

            // project mouse click onto height axis:
            const hAtDragStart = localX * hx + localY * hy;
            const hOffset = Math.abs(hAtDragStart) - (h / 2);

            onDragMove((mx, my) => {
                const [dragX, dragY] = viewToWorld(mx, my, viewTransform);
                const dx = dragX - x;
                const dy = dragY - y;

                const hNew = dx * hx + dy * hy;

                const hFinal = (hAtDragStart > 0)? Math.max(hNew - hOffset, 0) * 2: Math.max(hOffset - hNew, 0) * 2;

                const wNew = dx * wx + dy * wy;

                const wFinal = (wAtDragStart > 0)? Math.max(wNew - wOffset, 0) * 2: Math.max(wOffset - wNew, 0) * 2;

                resizeHandler(wFinal, hFinal)

            });

        });
    };

    const handleRotateAroundPivot = (pivotX, pivotY) => {
        return makeDragHandler((sx, sy, onDragMove) => {
            const [startX, startY] = viewToWorld(sx, sy, viewTransform);
            setActionState("rotating");

            const rads = angle * Math.PI / 180;
            const cornerX = pivotX * Math.cos(rads) - pivotY * Math.sin(rads) + x;
            const cornerY = pivotY * Math.cos(rads) + pivotX * Math.sin(rads) + y;

            const [deltaX, deltaY] = [startX - cornerX, startY - cornerY];

            const cornerlen = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // unit vector from center to corner:
            const ux = deltaX / cornerlen;
            const uy = deltaY / cornerlen;

            const angleAtDragStart = angle;


            onDragMove((mx, my) => {
                const [dragX, dragY] = viewToWorld(mx, my, viewTransform);

                const [dx, dy] = [dragX - cornerX , dragY - cornerY];

                const opp = -dx * uy + dy * ux;
                const adj = dx * ux + dy * uy;
                const diffAngle = Math.atan2(opp, adj);
                const newAngle = angleAtDragStart + (diffAngle * 180 / Math.PI);

                const [xToPivot, yToPivot] = [x - cornerX, y - cornerY];
                const diffX = xToPivot * Math.cos(diffAngle) - yToPivot * Math.sin(diffAngle);
                const diffY = yToPivot * Math.cos(diffAngle) + xToPivot * Math.sin(diffAngle);
                onTransform(cornerX + diffX, cornerY + diffY, w, h, newAngle);

            });
        });
    };


    const handleHeightResize = makeResizeHandler((newW, newH) => {
        onTransform(x, y, w, newH, angle);
    });

    const handleWidthResize = makeResizeHandler((newW, newH) => {
        onTransform(x, y, newW, h, angle);
    });

    const handleMove = makeDragHandler((sx, sy, onDragMove) => {
        const [startX, startY] = viewToWorld(sx, sy, viewTransform);

        setActionState("moving");

        onDragMove((mx, my) => {
            const [dragX, dragY] = viewToWorld(mx, my, viewTransform);
            const deltaX = dragX - startX;
            const deltaY = dragY - startY;

            onTransform(x + deltaX, y + deltaY, w, h, angle);
        });
    });

    const handleMouseDown = (e) => {
        handleMove(e);
        onMouseDown(e);
    }
    const [centerX, centerY] = worldToView(x, y, viewTransform);
    // const [cornerX, cornerY] = worldToView(x - (w / 2),  y - (h / 2), viewTransform);
    const viewW = w * viewTransform.scale;
    const viewH = h * viewTransform.scale;

    return <>
    <g className={`${styles.frame} ${selected? styles.selected:''} ${highlighted?styles.highlighted:''}`}
       transform={`rotate(${angle} ${centerX} ${centerY}) translate(${centerX} ${centerY})`}
       >
        <rect
            x={-viewW/2}
            y={-viewH/2}
            width={viewW}
            height={viewH}
            onMouseDown={handleMouseDown}
            style={{cursor: selected?'url("/drag_pan.svg") 12 12, auto': 'auto'}}
            /> 
        { selected && <>
            <CornerHandle x={-viewW/2} y={viewH/2} r="10" angle={0} onMouseDown={handleRotateAroundPivot(w/2,-h/2)}/>
            <CornerHandle x={-viewW/2} y={-viewH/2} r="10" angle={90} onMouseDown={handleRotateAroundPivot(w/2,h/2)}/>
            <CornerHandle x={viewW/2} y={-viewH/2} r="10" angle={180} onMouseDown={handleRotateAroundPivot(-w/2,h/2)}/>
            <CornerHandle x={viewW/2} y={viewH/2} r="10" angle={270} onMouseDown={handleRotateAroundPivot(-w/2,-h/2)}/>

            <rect className={styles.frame} x={-viewW/2 + viewW/4} y={-viewH/2-3} width={viewW/2} height={6} onMouseDown={handleHeightResize}/> 
            <rect className={styles.frame} x={-viewW/2 + viewW/4} y={viewH/2-3} width={viewW/2} height={6} onMouseDown={handleHeightResize}/> 
            <rect className={styles.frame} x={-viewW/2 - 3} y={-viewH/2+viewH/4} width={6} height={viewH/2} onMouseDown={handleWidthResize}/> 
            <rect className={styles.frame} x={viewW/2 - 3} y={-viewH/2+viewH/4} width={6} height={viewH/2} onMouseDown={handleWidthResize}/> 
            <path d={`M ${-viewW/2}, ${-viewH/2 + 15} l 0,-15 l 15,0`} strokeWidth="6px"/>
            <path d={`M ${-viewW/2}, ${viewH/2 - 15} l 0,15 l 15,0`} strokeWidth="6px"/>
            <path d={`M ${viewW/2}, ${-viewH/2 + 15} l 0,-15 l -15,0`} strokeWidth="6px"/>
            <path d={`M ${viewW/2}, ${viewH/2 - 15} l 0,15 l -15,0`} strokeWidth="6px"/>

            <circle
                cx={0}
                cy={0}
                r={30}
                stroke="#999"
                strokeWidth="8px"
                fill="none"
                pathLength={12}
                strokeDashoffset={1}
                strokeDasharray="2 1 2 1 2 1 2 1"
                onMouseDown={handleRotateAroundPivot(0,0)}
                style={{cursor: 'url("/muid_rotate.svg") 12 12, auto'}}
                />
        </>}

    </g>
    </>;
}
export function makeDragHandler(onDragStart, button=0) {
    // return an event handler that can handle mousedown events
    return (e) => {
        if (!(e.buttons & (1 << button))) {
            return;
        }
        e.preventDefault();

        // sending the onDragMove handler allows us to save state in the onDragStart handler that is used in onDragMove
        onDragStart(e.nativeEvent.offsetX, e.nativeEvent.offsetY, (onDragMove, onDragEnd) => {
            const dragEndHandler = (e) => {
                if (e.buttons & (1 << button)) {
                    return;
                }
                e.preventDefault();
                window.removeEventListener('mousemove', dragHandler);
                window.removeEventListener('mouseup', dragEndHandler);
                if (onDragEnd) onDragEnd(e.offsetX, e.offsetY);
            }
            const dragHandler = (e) => {
                if (!(e.buttons & (1 << button))) {
                    window.removeEventListener('mousemove', dragHandler);
                    window.removeEventListener('mouseup', dragEndHandler);
                    return;
                }
                e.preventDefault();
                if (onDragMove) onDragMove(e.offsetX, e.offsetY);
            }
            window.addEventListener('mousemove', dragHandler);
            window.addEventListener('mouseup', dragEndHandler);

        });
    }
}
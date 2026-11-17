import { createContext } from 'react';

export const ViewTransformContext = createContext({viewTransform: {x: 0, y: 0, scale: 1}, setViewTransform: () => {}});
export const ActionStateContext = createContext({actionState: "", setActionState: () => {}});
export const SelectionContext = createContext({selectedId: -1, setSelectedId: () => {}});


export function viewToWorld(vx, vy, viewTransform) {
    return [
        (vx / viewTransform.scale) - viewTransform.x,
        (vy / viewTransform.scale) - viewTransform.y
    ];
}

export function worldToView(wx, wy, viewTransform) {
    return [
        (wx + viewTransform.x) * viewTransform.scale,
        (wy + viewTransform.y) * viewTransform.scale,
    ];
}

export class Box {
    x; y; w; h; angle;

    constructor(x, y, w, h, angle) {
        this.setPosition(x, y);
        this.setSize(w, h);
        this.setAngle(angle);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    setSize(w, h) {
        this.w = w;
        this.h = h;
    }
    setAngle(angle) {
        this.angle = angle;
    }

    pointInBox(x, y) {
        const rads = this.angle * Math.PI / 180;
        const ux = Math.cos(rads);
        const uy = Math.sin(rads);

        const dx = x - this.x;
        const dy = y - this.y;

        const proj_x = dx * ux + dy * uy;
        const proj_y = dx * -uy + dy * ux;

        const w2 = this.w / 2;
        const h2 = this.h / 2;
        return ((proj_x > -w2)
            && (proj_x < w2)
            && (proj_y > -h2)
            && (proj_y < h2));
    }
}
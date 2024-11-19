export class GestureSection {
    private _name: string;
    private x1: number;
    private y1: number;
    private x2: number;
    private y2: number;
    private iconImage: HTMLImageElement;
    private progress: number;
    private debounceTimeout: NodeJS.Timeout | null;
    private selectionStart: number | null = null;
    private millisecondsTrigger: number = 1000;
    private millisecondsDebounce: number = 500;
    constructor(name: string, x1: number, y1: number, x2: number, y2: number, iconSrc: string) {
        this._name = name;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.iconImage = new Image();
        this.iconImage.src = iconSrc;
        this.progress = 0;
        this.debounceTimeout = null;
    }

    get name(): string {
        return this._name;
    }

    public contains(x: number, y: number): boolean {
        return x >= this.x1 && x <= this.x2 && y >= this.y1 && y <= this.y2;
    }

    private getCenter(): { x: number, y: number } {
        return {
            x: (this.x1 + this.x2) / 2,
            y: (this.y1 + this.y2) / 2
        };
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        this.drawBorder(ctx);
        this.drawIcon(ctx);
        this.drawProgressRing(ctx);
    }

    private drawBorder(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineTo(this.x1, this.y2);
        ctx.closePath();
        ctx.stroke();
    }

    private drawIcon(ctx: CanvasRenderingContext2D): void {
        const center = this.getCenter();
        const iconSize = 32;
        const iconX = center.x - iconSize / 2;
        const iconY = center.y - iconSize / 2;

        ctx.globalAlpha = 0.5;
        ctx.drawImage(this.iconImage, iconX, iconY, iconSize, iconSize);
        ctx.globalAlpha = 1.0;
    }

    private drawProgressRing(ctx: CanvasRenderingContext2D): void {
        const center = this.getCenter();
        const radius = 24;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (this.progress / 100) * 2 * Math.PI;

        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startAngle, endAngle);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    public resetProgress(): void {
        this.selectionStart = null;
        this.progress = 0;
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
    }

    public progressing(): boolean {
        if (this.debounceTimeout === null) {

            if (this.selectionStart == null) {
                this.selectionStart = Date.now();
            } else {

                const timeDiff: number = Date.now() - this.selectionStart;
                this.progress = Math.min(100, timeDiff / this.millisecondsTrigger * 100);

                if (timeDiff > this.millisecondsTrigger) {


                    this.debounceTimeout = setTimeout(() => {
                        this.resetProgress();
                    }, this.millisecondsDebounce);

                    return true;
                }

            }

        }

        return false;
    }


}
import { _decorator, Component, view, Widget, log, Camera, Canvas } from 'cc';
import { Signal } from '../eventSystem/Signal';
const { ccclass, property } = _decorator;

export enum Orientation {
    UNKNOWN,
    PORTRAIT,
    LANDSCAPE,
}

@ccclass('LayoutSettings')
class LayoutSettings {
    @property({ tooltip: "Align to the top border." })
    public isAlignTop: boolean = false;
    @property({ tooltip: "Align to the bottom border." })
    public isAlignBottom: boolean = false;
    @property({ tooltip: "Align to the left border." })
    public isAlignLeft: boolean = false;
    @property({ tooltip: "Align to the right border." })
    public isAlignRight: boolean = false;

    @property({ tooltip: "Distance to the top border.", visible: function () { return this.isAlignTop; } })
    public top: number = 0;
    @property({ tooltip: "Distance to the bottom border.", visible: function () { return this.isAlignBottom; } })
    public bottom: number = 0;
    @property({ tooltip: "Distance to the left border.", visible: function () { return this.isAlignLeft; } })
    public left: number = 0;
    @property({ tooltip: "Distance to the right border.", visible: function () { return this.isAlignRight; } })
    public right: number = 0;
}

@ccclass('AutoLayout')
export class AutoLayout extends Component {

    @property(Camera) private camera: Camera = null;
    @property(Canvas) private canvas: Canvas = null;

    @property({ type: LayoutSettings, tooltip: "Settings for Portrait mode (height > width)" })
    private portraitSettings: LayoutSettings = new LayoutSettings();

    @property({ type: LayoutSettings, tooltip: "Settings for Landscape mode (width >= height)" })
    private landscapeSettings: LayoutSettings = new LayoutSettings();

    private widget: Widget = null;
    private currentOrientation: Orientation = Orientation.UNKNOWN;

    public onChangeOrientation = new Signal<Orientation>();

    protected onLoad(): void {
        this.widget = this.getComponent(Widget);
        if (!this.widget) {
            console.warn('AutoLayout component requires a Widget component on the same node to function.');
            this.enabled = false;
            return;
        }

        view.on('canvas-resize', this.onSizeChanged, this);
        this.onSizeChanged();
    }

    onDestroy() {
        view.off('canvas-resize', this.onSizeChanged, this);
    }

    onSizeChanged() {
        const screenSize = view.getVisibleSize();
        const newOrientation = screenSize.width >= screenSize.height ? Orientation.LANDSCAPE : Orientation.PORTRAIT;

        if (newOrientation !== this.currentOrientation) {
            this.currentOrientation = newOrientation;
            console.log(`Orientation changed to ${Orientation[this.currentOrientation]}`);
            this.applyLayout();
            this.onChangeOrientation.trigger(this.currentOrientation);
        }

        if (this.camera) {
            if (newOrientation === Orientation.LANDSCAPE) {
                this.camera.fov = 45;
            } else {
                this.camera.fov = 96;
            }
        }

        console.log(screenSize);
    }

    applyLayout() {
        if (!this.widget) return;

        const settings = this.currentOrientation === Orientation.PORTRAIT ? this.portraitSettings : this.landscapeSettings;

        this.widget.isAlignTop = settings.isAlignTop;
        this.widget.isAlignBottom = settings.isAlignBottom;
        this.widget.isAlignLeft = settings.isAlignLeft;
        this.widget.isAlignRight = settings.isAlignRight;

        this.widget.top = settings.top;
        this.widget.bottom = settings.bottom;
        this.widget.left = settings.left;
        this.widget.right = settings.right;

        this.widget.updateAlignment();

        if (this.currentOrientation === Orientation.PORTRAIT) {
            this.node.setScale(1, 1, 1);
        } else {
            this.node.setScale(.25, .25, 1);
        }
    }

    public get CurrentOrientation(): Orientation {
        return this.currentOrientation;
    }
}



import * as tf from '@tensorflow/tfjs';
import { AnnotatedPrediction } from '@tensorflow-models/handpose';

export class HandDetector {
    private net: any | null = null;

    public async initializeModel() {
        if (this.net == null) {
            await tf.setBackend('webgl');
            const handpose = await import('@tensorflow-models/handpose');
            this.net = await handpose.load();
            console.log("Handerkennungsmodell erfolgreich geladen.");
        }
    }

    async detectHands(video: HTMLVideoElement): Promise<AnnotatedPrediction[]> {
        if (this.net==null) {
            await this.initializeModel();
        }

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            return this.net.estimateHands(video);
        }
        return [];
    }
}

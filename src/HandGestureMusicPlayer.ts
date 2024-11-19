import { GestureSection } from './GestureSection';
import { AnnotatedPrediction } from '@tensorflow-models/handpose';
import { HandDetector } from './HandDetector';
import { AudioPlayer }  from './AudioPlayer';

export class HandGestureMusicPlayer {
     
    private frameCount : number = 0
    private _handDetector : HandDetector = new HandDetector();
    private _audioPlayer: AudioPlayer;
    private sections: GestureSection[];

    public get handDetector() {
        return this._handDetector
    }

    public get audioPlayer() {
        return this._audioPlayer
    }


    constructor(sections : GestureSection[], songs : string[]) {
        this.sections = sections;
        this._audioPlayer = new AudioPlayer(songs);
    }

    public async Run(video: HTMLVideoElement, audio : HTMLAudioElement, canvas : HTMLCanvasElement) {

        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA) {

            // Draw Video
            ctx!.clearRect(0, 0, canvas.width, canvas.height);
            ctx!.translate(canvas.width, 0);
            ctx!.scale(-1, 1);
            ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx!.setTransform(1, 0, 0, 1, 0, 0);

            // Draw Section Elements
            this.sections.forEach((section) => { section.draw(ctx!); });

            //only each 10 frames check for Handdetection, beacuse of performance
            if (this.frameCount % 10 === 0) {
                const predictions: AnnotatedPrediction[] = await this.handDetector.detectHands(video);

                // hand is found
                if (predictions.length > 0) {

                    // get position in image for the hand
                    const hand = predictions[0].boundingBox;
                    const handCenterX = canvas.width - ( (hand.topLeft[0] + hand.bottomRight[0]) / 2);
                    const handCenterY = (hand.topLeft[1] + hand.bottomRight[1]) / 2;

                    // check for each section if the hand is there
                    this.sections.forEach((section) => {
                        if (section.contains(handCenterX, handCenterY))
                        {
                            // hand is there continue progression
                            if (section.progressing()) // is true when progression have 100%
                            {
                                // check for section and execute audioplayer function
                                if (section.name === "LefTop") this.audioPlayer.playPreviousSong(audio);
                                if (section.name === "RightTop") this.audioPlayer.playNextSong(audio);
                                if (section.name === "Middle") this.audioPlayer.pause(audio);
                                if (section.name === "LeftButtom") this.audioPlayer.decreaseVolume(audio);
                                if (section.name === "RightButtom") this.audioPlayer.increaseVolume(audio);
                                                                
                            }
                        } else {
                            // reset the progress of a section if no hand is there
                            section.resetProgress();
                        }
                    });
                } else {
                    // reset the progress off all sections if no hand is found
                    this.sections.forEach((section) => section.resetProgress());
                }
            }

            this.frameCount++;
        }
    }


 







}
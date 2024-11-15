import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { AnnotatedPrediction } from '@tensorflow-models/handpose';
import './App.css';

class Section {
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

    public draw(ctx: CanvasRenderingContext2D) {
        this.drawBorder(ctx);
        this.drawIcon(ctx);
        this.drawProgressRing(ctx);
    }

    private drawBorder(ctx: CanvasRenderingContext2D) {
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

    private drawIcon(ctx: CanvasRenderingContext2D) {
        const center = this.getCenter();
        const iconSize = 32;
        const iconX = center.x - iconSize / 2;
        const iconY = center.y - iconSize / 2;

        ctx.globalAlpha = 0.5;
        ctx.drawImage(this.iconImage, iconX, iconY, iconSize, iconSize);
        ctx.globalAlpha = 1.0;
    }

    private drawProgressRing(ctx: CanvasRenderingContext2D) {
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

    public resetProgress() {
        this.selectionStart = null;
        this.progress = 0;
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
    }

    public progressing(): boolean{
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

const App: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null); // Add this line

    const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);

    const songs = [
        'song1.mp3', 'song2.mp3', 'song3.mp3', 'song4.mp3', 'song5.mp3'
    ];

    const activeSongRef = useRef<HTMLLIElement | null>(null); // Ref for the active song
    useEffect(() => {
        if (activeSongRef.current) {
            activeSongRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [currentSongIndex]);

    const sections = [
        new Section("LefTop",0, 0, 200, 240, 'https://cdn2.iconfinder.com/data/icons/music-player-black/32/music_player_black-06-1024.png'),
        new Section("RightTop",460, 0, 640, 240, 'https://cdn2.iconfinder.com/data/icons/music-player-black/32/music_player_black-05-512.png'),
        new Section("Middle", 200, 0, 460, 480, 'https://cdn3.iconfinder.com/data/icons/player-ui-1/48/net-512.png'),
        new Section("LeftButtom", 0, 250, 200, 480, 'https://cdn3.iconfinder.com/data/icons/player-ui-1/48/net-512.png'),
        new Section("RightButtom",  460, 250, 640, 480, 'https://cdn3.iconfinder.com/data/icons/player-ui-1/48/net-512.png')
    ];

    useEffect(() => {
        const loadCamera = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        };

        loadCamera();
    }, []);

    useEffect(() => {
        const detectHand = async () => {
            await tf.setBackend('webgl');
            const handpose = await import('@tensorflow-models/handpose');
            const net = await handpose.load();
            const video = videoRef.current!;
            const ctx = canvasRef.current!.getContext('2d');

            let frameCount = 0;

            const detect = async () => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    ctx!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                    ctx!.translate(canvasRef.current!.width, 0);
                    ctx!.scale(-1, 1);
                    ctx!.drawImage(video, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
                    ctx!.setTransform(1, 0, 0, 1, 0, 0);

                    sections.forEach((section) => {
                        section.draw(ctx!);
                    });

                    if (frameCount % 10 === 0) {
                        const predictions: AnnotatedPrediction[] = await net.estimateHands(video);
                        if (predictions.length > 0) {
                            const hand = predictions[0].boundingBox;
                            const handCenterX = canvasRef.current!.width - ( (hand.topLeft[0] + hand.bottomRight[0]) / 2);
                            const handCenterY = (hand.topLeft[1] + hand.bottomRight[1]) / 2;

                            sections.forEach((section) => {
                                if (section.contains(handCenterX, handCenterY))
                                {
                                    if (section.progressing()) 
                                    {
                                        if (section.name == "LefTop") playPreviousSong();
                                        if (section.name == "RightTop") playNextSong();
                                        if (section.name == "Middle") {
                                            console.log("--Middle section triggered--");
                                            if (audioPlayerRef.current) {
                                                console.log("(Current audioPlayer is present)");
                                                if (audioPlayerRef.current.paused) {
                                                    console.log("Playing...");
                                                    audioPlayerRef.current.play();
                                                } else {
                                                    console.log("Pausing...");
                                                    audioPlayerRef.current.pause();
                                                }
                                            } else {
                                                console.log("No audioPlayer instance found. Playing the current song.");
                                                playAudio(songs[currentSongIndex]);
                                            }
                                        }
                                        
                                                                        
                                    }
                                } else {
                                    section.resetProgress();
                                }
                            });
                        } else {
                            sections.forEach((section) => section.resetProgress());
                        }
                    }

                    frameCount++;
                    requestAnimationFrame(detect);
                }
            };

            detect();
        };

        detectHand();
    }, []);

    const playAudio = (song: string) => {
        console.log("-Current audioPlayer state:", audioPlayerRef.current);
        console.log("-Requested song:", song);
    
        if (audioPlayerRef.current) {
            if (audioPlayerRef.current.src.includes(song)) {
                console.log("Toggling play/pause for the current song");
                if (audioPlayerRef.current.paused) {
                    audioPlayerRef.current.play();
                } else {
                    audioPlayerRef.current.pause();
                }
                return;
            } else {
                console.log("Pausing the currently playing song");
                audioPlayerRef.current.pause();
                audioPlayerRef.current.src = ''; // Clear the source to stop playback
            }
        }
    
        console.log("Playing new song:", song);
        audioPlayerRef.current = new Audio(`/audio/${song}`);
        audioPlayerRef.current.play();
    };
    
    
    
    

    const playPreviousSong = () => {
        setCurrentSongIndex((prevIndex) => {
            const newIndex = (prevIndex - 1 + songs.length) % songs.length;
            playAudio(songs[newIndex]);
            return newIndex;
        });
    };
    
    const playNextSong = () => {
        setCurrentSongIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % songs.length;
            playAudio(songs[newIndex]);
            return newIndex;
        });
    };
    

    return (
        <div className="App">
            <h1 className="app-title">Hand Gesture Music Player</h1>
            <div className="content">
                <div className="video-container">
                    <video ref={videoRef} style={{ display: 'none' }} />
                    <canvas ref={canvasRef} width={640} height={480} />

                    
                </div>


                <div className="right-container">
                    <h2>Songs:</h2>
             
                    <div className="song-list">
                    
                        <ul>
                            {songs.map((song, index) => (
                                <li
                                    key={index}
                                    ref={index === currentSongIndex ? activeSongRef : null}
                                    className={index === currentSongIndex ? 'active-song' : ''}
                                >
                                    {song}
                                </li>
                            ))}
                        </ul>
                        </div>
                </div>
            </div>
            <div className="audio-player">
                <audio controls>
                    <source src={`/audio/${songs[currentSongIndex]}`} type="audio/mp3" />
                </audio>
            </div>
        </div>
    );
};

export default App;

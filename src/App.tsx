import React, { useEffect, useRef, useState } from 'react';

import './App.css';
import { GestureSection } from './GestureSection';
import { HandGestureMusicPlayer } from './HandGestureMusicPlayer';
import { CameraHandler } from './CameraHandler';
 



export const App: React.FC = () => {
    
    const songs = [
        'song1.mp3', 'song2.mp3', 'song3.mp3', 'song4.mp3', 'song5.mp3'
    ];

    const sections = [
        new GestureSection("LefTop", 0, 0, 200, 240, '/images/music_player_black-06-1024.webp'),
        new GestureSection("RightTop", 460, 0, 640, 240, '/images/music_player_black-05-512.webp'),
        new GestureSection("Middle", 200, 0, 460, 480, '/images/ic_fluent_video_play_pause_24_filled-512.webp'),
        new GestureSection("LeftButtom", 0, 241, 200, 480, '/images/volume_up_down_increase_decrease_mute_speaker_1-512.webp'),
        new GestureSection("RightButtom", 460, 241, 640, 480, '/images/volume_up_down_increase_decrease_mute_speaker_2-512.webp')
    ];

    const handGestureMusicPlayerRef = useRef <HandGestureMusicPlayer>(new HandGestureMusicPlayer(sections, songs));

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
  
    // State for tracking the current song index
    const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
    useEffect(() => {
        handGestureMusicPlayerRef.current!.audioPlayer.onSongChange = (index: number) => {
            setCurrentSongIndex(index);
        };
    }, []);

    // Ref for the active song to scroll
    const activeSongRef = useRef<HTMLLIElement | null>(null); 
    useEffect(() => {
        if (activeSongRef.current) {
            activeSongRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [currentSongIndex]);

    // Load Camera
    useEffect(() => {
        if (videoRef.current) {
            const cameraHandler = new CameraHandler();
            cameraHandler.initializeCamera(videoRef.current);
        }
    }, []);

    // Run App
    useEffect(() => {
        const runAsync = async () => {
            const video = videoRef.current!;
            await handGestureMusicPlayerRef.current!.handDetector.initializeModel();
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                await handGestureMusicPlayerRef.current!.Run(video, audioRef.current!, canvasRef.current!)
            }
            requestAnimationFrame(runAsync);
        };
        runAsync();
    }, []);


    

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
                <audio
                    ref={audioRef} // Bind the audio element to the ref
                    controls
                    onPlay={() => console.log("Audio playing")}
                    onPause={() => console.log("Audio paused")}
                    onLoadedMetadata={() => {
                        if (audioRef.current) {
                            console.log("Duration:", audioRef.current.duration);
                        }
                    }}
                >
                    <source src={`/audio/${songs[currentSongIndex]}`} type="audio/mp3" />
                </audio>
            </div>

        </div>
    );
};

export default App;

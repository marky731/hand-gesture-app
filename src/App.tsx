import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { AnnotatedPrediction } from '@tensorflow-models/handpose'; // Ensure you have the correct import for AnnotatedPrediction
import './App.css';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [lastSection, setLastSection] = useState<{ x: number; y: number } | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const songs = [
    'song1.mp3',
    'song2.mp3',
    'song3.mp3',
    'song4.mp3',
    'song5.mp3',
    'song6.mp3',
    'song7.mp3',
    'song8.mp3',
    'song9.mp3',
    'song10.mp3',
  ];

  useEffect(() => {
    const loadCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 } // Lower resolution for performance
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
        const iconImage = new Image();
        iconImage.src = 'https://cdn3.iconfinder.com/data/icons/player-ui-1/48/net-512.png'; // Icon-Dateipfad (URL oder Base64-kodiertes Bild)


        let frameCount = 0;
        let progress = 0; // Fortschrittsvariable für die rotierende Scheibe

      const detect = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          ctx!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx!.translate(canvasRef.current!.width, 0);
          ctx!.scale(-1, 1);
          ctx!.drawImage(video, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
            ctx!.setTransform(1, 0, 0, 1, 0, 0);

            const frameWidth = canvasRef.current!.width;
            const frameHeight = canvasRef.current!.height;

            // Divide the frame into 3 columns and 2 rows
            const sectionWidth = frameWidth / 3;
            const sectionHeight = frameHeight / 2;


            // Vertikale Linien (Spalten)
            for (let i = 1; i < 3; i++) {
                ctx!.beginPath();
                ctx!.moveTo(i * sectionWidth, 0);
                ctx!.lineTo(i * sectionWidth, frameHeight);
                ctx!.stroke();
            }

            // Horizontale Linien (Reihen)
            for (let j = 1; j < 2; j++) {
                ctx!.beginPath();
                ctx!.moveTo(0, j * sectionHeight);
                ctx!.lineTo(frameWidth, j * sectionHeight);
                ctx!.stroke();
            }

            // Icon in der rechten oberen Sektion zeichnen
            ctx!.globalAlpha = 0.5; // Setzt Transparenz auf 50%
            const iconX = sectionWidth * 2 + (sectionWidth / 2) - 16; // Position in der Mitte der rechten oberen Sektion
            const iconY = sectionHeight / 2 - 16; // Position im oberen Abschnitt der rechten oberen Sektion
            ctx!.drawImage(iconImage, iconX, iconY, 32, 32); // Zeichnet das Icon mit 32x32 Pixeln
            ctx!.globalAlpha = 1.0; // Setzt die Transparenz wieder auf 100%


            // Fortschrittsring um das Icon zeichnen
            const radius = 24; // Radius der Scheibe um das Icon
            const startAngle = -Math.PI / 2; // Startwinkel (oben)
            const endAngle = startAngle + (progress / 100) * 2 * Math.PI; // Fortschrittswinkel

            ctx!.globalAlpha = 0.5;
            ctx!.beginPath();
            ctx!.arc(iconX + 16, iconY + 16, radius, startAngle, endAngle);
            ctx!.strokeStyle = 'blue';
            ctx!.lineWidth = 4;
            ctx!.stroke();
            ctx!.globalAlpha = 1.0;

            // Fortschritt erhöhen (für das Drehen)
            progress = (progress + 2) % 100; // Erhöht den Fortschritt und startet bei 100% neu


          // Run detection every 5 frames
          if (frameCount % 10 === 0) {
            const predictions: AnnotatedPrediction[] = await net.estimateHands(video); // Await predictions here

            if (predictions.length > 0) {
              const hand = predictions[0].boundingBox;
              const handCenterX = (hand.topLeft[0] + hand.bottomRight[0]) / 2;
              const handCenterY = (hand.topLeft[1] + hand.bottomRight[1]) / 2;
          

              // Determine the section of the hand
              const sectionX = Math.floor(handCenterX / sectionWidth);
              const sectionY = Math.floor(handCenterY / sectionHeight);

              // Check if the hand is in a new section
              if (lastSection?.x !== sectionX || lastSection?.y !== sectionY) {
                // Only trigger changes if the debounce is not active
                if (!debounceTimeout.current) {
                  console.log(`Section Change Detected: X=${sectionX}, Y=${sectionY}`);

                  if (sectionY === 0) { // Top row
                    if (sectionX === 2) {
                      console.log("Playing previous song");
                      playPreviousSong(); // Play previous song
                    } else if (sectionX === 0) {
                      console.log("Playing next song");
                      playNextSong(); // Play next song
                    }
                  }

                  // Set debounce timeout
                  debounceTimeout.current = setTimeout(() => {
                    debounceTimeout.current = null; // Reset debounce
                  }, 1500); // Debounce time (1.5 seconds)

                  // Update the last section
                  setLastSection({ x: sectionX, y: sectionY });
                }
              }
            } else {
              // Reset lastSection when no hand is detected
              setLastSection(null);
            }
          }
          frameCount++;
        }

        requestAnimationFrame(detect);
      };

      detect();
    };

    detectHand();
  }, [lastSection]);

  const playAudio = (song: string) => {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0; // Reset to start
    }

    const newAudioPlayer = new Audio(`/audio/${song}`);
    newAudioPlayer.play();
    setAudioPlayer(newAudioPlayer);
  };

  const playPreviousSong = () => {
    setCurrentSongIndex((prevIndex) => {
      const newIndex = (prevIndex - 1 + songs.length) % songs.length; // Loop back to the last song
      console.log(`Current Song Index Before Previous: ${prevIndex}`);
      playAudio(songs[newIndex]);
      console.log(`Current Song Index After Previous: ${newIndex}`);
      return newIndex;
    });
  };

  const playNextSong = () => {
    setCurrentSongIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % songs.length; // Loop back to the first song
      console.log(`Current Song Index Before Next: ${prevIndex}`);
      playAudio(songs[newIndex]);
      console.log(`Current Song Index After Next: ${newIndex}`);
      return newIndex;
    });
  };

  return (
    <div className="App">
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
      />
      <div className="audio-player">
        <p>Now Playing: {songs[currentSongIndex]}</p>
        <audio controls>
          <source src={`/audio/${songs[currentSongIndex]}`} type="audio/mp3" />
          Your browser does not support the audio tag.
        </audio>
      </div>
    </div>
  );
};

export default App;

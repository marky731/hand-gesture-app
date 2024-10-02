import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs'; // Import TensorFlow.js
import './App.css';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGrayscale, setIsGrayscale] = useState(false);

  useEffect(() => {
    const loadCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    };

    loadCamera();
  }, []);

  useEffect(() => {
    const detectHand = async () => {
      // Set the TensorFlow.js backend to 'webgl'
      await tf.setBackend('webgl'); 

      // Load the Handpose model
      const handpose = await import('@tensorflow-models/handpose');
      const net = await handpose.load();
      const video = videoRef.current!;
      const ctx = canvasRef.current!.getContext('2d');

      const detect = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          ctx!.drawImage(video, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
          const predictions = await net.estimateHands(video);

          if (predictions.length > 0) {
            const hand = predictions[0].boundingBox;
            const handCenterX = (hand.topLeft[0] + hand.bottomRight[0]) / 2;
            const frameWidth = canvasRef.current!.width;

            // Check if hand is on the left or right side of the frame
            if (handCenterX < frameWidth / 2) {
              setIsGrayscale(true);
            } else {
              setIsGrayscale(false);
            }
          }
        }

        requestAnimationFrame(detect);
      };

      detect();
    };

    detectHand();
  }, []);

  return (
    <div className="App">
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ filter: isGrayscale ? 'grayscale(100%)' : 'none' }}
      />
    </div>
  );
};

export default App;

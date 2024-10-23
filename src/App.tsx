import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs'; // Import TensorFlow.js
import './App.css';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [debugFormat, setDebugFormat] = useState('normal');

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
            const handCenterY = (hand.topLeft[1] + hand.bottomRight[1]) / 2;
            const frameWidth = canvasRef.current!.width;
            const frameHeight = canvasRef.current!.height;

            // Divide the frame into 4 vertical and 2 horizontal sections
            const sectionWidth = frameWidth / 4;
            const sectionHeight = frameHeight / 2;

            // Determine the section of the hand
            const sectionX = Math.floor(handCenterX / sectionWidth);
            const sectionY = Math.floor(handCenterY / sectionHeight);

            // Debugging: Change frame format based on hand position
            if (sectionY === 0) {
              if (sectionX === 0) {
                setDebugFormat('grayscale'); // Top left
              } else if (sectionX === 1) {
                setDebugFormat('normal'); // Top middle left
              } else if (sectionX === 2) {
                setDebugFormat('sepia'); // Top middle right
              } else {
                setDebugFormat('normal'); // Top right
              }
            } else {
              if (sectionX === 0) {
                setDebugFormat('normal'); // Bottom left
              } else if (sectionX === 1) {
                setDebugFormat('invert'); // Bottom middle left
              } else if (sectionX === 2) {
                setDebugFormat('normal'); // Bottom middle right
              } else {
                setDebugFormat('grayscale'); // Bottom right
              }
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
        style={{
          filter: debugFormat === 'grayscale' ? 'grayscale(100%)' :
                  debugFormat === 'sepia' ? 'sepia(100%)' :
                  debugFormat === 'invert' ? 'invert(100%)' :
                  'none',
        }}
      />
    </div>
  );
};

export default App;

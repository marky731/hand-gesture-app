export class CameraHandler {

    /**
     * Initialisiert die Kamera und bindet den Stream an das Video-Element.
     */
    public async initializeCamera(videoElement: HTMLVideoElement)  {
        if (!videoElement) {
            throw new Error("Video element is not defined.");
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            videoElement.srcObject = stream;
            await videoElement.play();
            console.log("Camera initialized successfully.");
        } catch (error) {
            console.error("Error initializing camera:", error);
        }
    }
}
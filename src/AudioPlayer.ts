export class AudioPlayer {

    private volumneStepSize : number = 0.3
    private songs: string[];
    private _currentSongIndex: number = 0
    public onSongChange: (index: number) => void = () => { };

    constructor(songs: string[]) {
        this.songs = songs;
    }

    public get currentSongIndex() {
        return this._currentSongIndex;
    }

    public playPreviousSong(audio: HTMLAudioElement): void {
       this._currentSongIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
       this.onSongChange(this._currentSongIndex); // Notify change
       this.playAudio(audio, this.songs[this.currentSongIndex]); 
    }
    
    public playNextSong(audio: HTMLAudioElement): void {
       this._currentSongIndex = (this.currentSongIndex + 1 + this.songs.length) % this.songs.length;
       this.onSongChange(this._currentSongIndex); // Notify change
       this.playAudio(audio, this.songs[this.currentSongIndex]); 
    }

    public playAudio(audio: HTMLAudioElement, song: string): void  {
        console.log("-Requested song:", song);
    
        if (audio) {
            // Check if the new song is different from the current one
            if (!audio.src.includes(song)) {
                audio.src = `/audio/${song}`;
                audio.load(); // Reload the audio source
    
                // Wait until the audio can play through before playing
                audio.oncanplaythrough = () => {
                    audio?.play().catch((error:any) => {
                        console.error("Error while auto-playing audio:", error);
                    });
                };
            } else {
                // If the same song is selected, toggle play/pause
                if (audio.paused) {
                    audio.play().catch((error:any) => {
                        console.error("Error while playing audio:", error);
                    });
                } else {
                    audio.pause();
                }
            }
        }
    }


    public pause(audio: HTMLAudioElement): void {

        if (audio) {
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
        } else {
            console.log("No audioPlayer instance found. Playing the current song.");
            this.playAudio(audio, this.songs[this.currentSongIndex]);
        }


    }

    public increaseVolume(audio: HTMLAudioElement): void {
        audio.volume = Math.min(1, audio.volume + this.volumneStepSize);
    }

    // Lautstärke verringern
    public decreaseVolume(audio: HTMLAudioElement): void {
        audio.volume = Math.max(0, audio.volume - this.volumneStepSize);
    }


}

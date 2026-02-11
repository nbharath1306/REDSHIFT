// Simple Sound Manager using Web Audio API (No Assets Needed)

class SoundManager {
    private ctx: AudioContext | null = null;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    playLevelUp() {
        if (localStorage.getItem('redshift_sound_enabled') === 'false') return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Chord: C Major (C4, E4, G4, C5)
        this.playTone(261.63, now, 0.5, "sine");
        this.playTone(329.63, now + 0.1, 0.5, "sine");
        this.playTone(392.00, now + 0.2, 0.5, "sine");
        this.playTone(523.25, now + 0.3, 1.0, "square"); // Final punchy note
    }

    playStreakKeep() {
        if (localStorage.getItem('redshift_sound_enabled') === 'false') return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Ascending slide
        this.playTone(440, now, 0.2, "sine");
        this.playTone(880, now + 0.1, 0.4, "sine");
    }

    private playTone(freq: number, startTime: number, duration: number, type: OscillatorType) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.value = freq;
        osc.type = type;

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);

        // Envelope
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.stop(startTime + duration);
    }
}

export const sfx = new SoundManager();

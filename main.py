import sounddevice as sd
import numpy as np
import time
from scipy.io.wavfile import write
from faster_whisper import WhisperModel

class FastRecorder:
    def __init__(self, sample_rate=16000, silence_duration_ms=1000):
        self.sample_rate = sample_rate
        self.silence_duration_ms = silence_duration_ms
        self.audio_buffer = []
        self.energy_threshold = 0.01  # static threshold
        self.silence_start = None
        self.is_recording = False
        self.stop_recording = False

        print("🔄 Loading Whisper model...")
        self.model = WhisperModel("small", device="cpu", compute_type="int8")
        print("✅ Whisper model loaded.")

    def is_speech(self, chunk):
        return np.sum(np.abs(chunk)) / len(chunk) > self.energy_threshold

    def record(self):
        self.stop_recording = False

        def callback(indata, frames, time_info, status):
            if self.stop_recording:
                return

            chunk = indata.mean(axis=1) if indata.shape[1] > 1 else indata.flatten()
            if len(chunk) != 512:
                return

            if self.is_speech(chunk):
                self.audio_buffer.append(chunk.copy())
                self.silence_start = None
                self.is_recording = True
            elif self.is_recording:
                self.audio_buffer.append(chunk.copy())
                if self.silence_start is None:
                    self.silence_start = time.monotonic()
                elif (time.monotonic() - self.silence_start) * 1000 > self.silence_duration_ms:
                    self.stop_recording = True

        print("🎙️ Speak now. Auto-stop after silence.")
        try:
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype='float32',
                blocksize=512,
                callback=callback
            ):
                while not self.stop_recording:
                    time.sleep(0.05)
        except KeyboardInterrupt:
            print("\n⏹️ Interrupted by user.")

        if self.audio_buffer:
            return np.concatenate(self.audio_buffer).astype(np.float32)
        return None

    def transcribe(self, audio, filename="output.wav"):
        write(filename, self.sample_rate, audio)

        t_start = time.time()
        segments, info = self.model.transcribe(
            filename,
            beam_size=5,
            vad_filter=True,
            temperature=0.0,
            compression_ratio_threshold=2.4,
            log_prob_threshold=-1.0,
            no_speech_threshold=0.5,
        )
        t_end = time.time()

        print(f"\n🌍 Language: {info.language}")
        print(f"⚡ Transcription Time: {t_end - t_start:.2f} sec")
        print("📝 Transcription:")
        for seg in segments:
            print(f"[{seg.start:.2f}s -> {seg.end:.2f}s] {seg.text}")

def main():
    recorder = FastRecorder()

    t_start = time.time()
    audio = recorder.record()
    t_record = time.time()
    print(f"✅ Recording time: {t_record - t_start:.2f} sec")

    if audio is not None:
        recorder.transcribe(audio)
    else:
        print("❌ No audio recorded.")

    t_end = time.time()
    print(f"⏱️ Total time: {t_end - t_start:.2f} sec")

if __name__ == "__main__":
    main()

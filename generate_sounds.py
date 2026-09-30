import numpy as np
import wave
import os

SAMPLE_RATE = 44100

def save_wav(filename, audio_data):
    # Normalize to 16-bit PCM
    audio_data = np.clip(audio_data, -1.0, 1.0)
    pcm = np.int16(audio_data * 32767)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(pcm.tobytes())

def generate_create():
    # 520Hz (70ms) then 820Hz (75ms)
    t1 = np.linspace(0, 0.07, int(SAMPLE_RATE * 0.07), False)
    osc1 = np.sin(2 * np.pi * 520 * t1)
    env1 = np.linspace(0.25, 0.001, len(t1))
    
    t2 = np.linspace(0, 0.075, int(SAMPLE_RATE * 0.075), False)
    osc2 = np.sin(2 * np.pi * 820 * t2)
    env2 = np.linspace(0.3, 0.001, len(t2))
    
    audio = np.concatenate((osc1 * env1, osc2 * env2))
    return audio

def generate_keyTick():
    # Triangle wave 680Hz down to 220Hz in 18ms
    t = np.linspace(0, 0.018, int(SAMPLE_RATE * 0.018), False)
    # Exponential ramp: 680 * (220/680)**(t/0.018)
    freqs = 680 * (220/680)**(t/0.018)
    phases = np.cumsum(freqs) / SAMPLE_RATE
    # Triangle approximation
    osc = 2 * np.abs(2 * (phases - np.floor(phases + 0.5))) - 1
    env = np.linspace(0.18, 0.001, len(t))
    return osc * env

def generate_save():
    # Sine 659.25Hz in 85ms
    t = np.linspace(0, 0.085, int(SAMPLE_RATE * 0.085), False)
    osc = np.sin(2 * np.pi * 659.25 * t)
    env = np.linspace(0.24, 0.001, len(t))
    return osc * env

def generate_priority():
    # Sine 740Hz in 55ms
    t = np.linspace(0, 0.055, int(SAMPLE_RATE * 0.055), False)
    osc = np.sin(2 * np.pi * 740 * t)
    env = np.linspace(0.22, 0.001, len(t))
    return osc * env

def generate_complete():
    # Chord: C5 (523.25) at 0, E5 (659.25) at 45ms, C6 (1046.5) at 90ms
    duration = 0.41 # 90ms + 320ms
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    audio = np.zeros_like(t)
    
    def add_tone(freq, delay, dur):
        start_idx = int(delay * SAMPLE_RATE)
        end_idx = start_idx + int(dur * SAMPLE_RATE)
        t_tone = t[start_idx:end_idx] - delay
        osc = np.sin(2 * np.pi * freq * t_tone)
        env = np.linspace(0.22, 0.001, len(t_tone))
        audio[start_idx:end_idx] += osc * env
        
    add_tone(523.25, 0.0, 0.22)
    add_tone(659.25, 0.045, 0.24)
    add_tone(1046.5, 0.09, 0.32)
    
    # Add noise burst at 0.1s
    noise_start = int(0.1 * SAMPLE_RATE)
    noise_dur = int(0.14 * SAMPLE_RATE)
    noise = np.random.uniform(-1, 1, noise_dur)
    noise_env = np.linspace(0.12, 0.001, noise_dur)
    audio[noise_start:noise_start+noise_dur] += noise * noise_env
    return audio

def generate_kill():
    # Sine 115Hz down to 36Hz in 150ms + Noise
    t = np.linspace(0, 0.15, int(SAMPLE_RATE * 0.15), False)
    freqs = 115 * (36/115)**(t/0.15)
    phases = np.cumsum(freqs) / SAMPLE_RATE
    osc = np.sin(2 * np.pi * phases)
    env = np.linspace(0.35, 0.001, len(t))
    
    # Noise
    noise_dur = int(0.09 * SAMPLE_RATE)
    noise = np.random.uniform(-1, 1, noise_dur)
    # Simple lowpass filter effect approximation (smoothing)
    noise = np.convolve(noise, np.ones(10)/10, mode='same')
    noise_env = np.linspace(0.2, 0.001, noise_dur)
    
    audio = osc * env
    audio[:noise_dur] += noise * noise_env
    return audio

def generate_restore():
    # Sine 380Hz up to 680Hz in 130ms
    t = np.linspace(0, 0.13, int(SAMPLE_RATE * 0.13), False)
    freqs = 380 * (680/380)**(t/0.13)
    phases = np.cumsum(freqs) / SAMPLE_RATE
    osc = np.sin(2 * np.pi * phases)
    env = np.linspace(0.22, 0.001, len(t))
    return osc * env

os.makedirs('native/assets/sounds', exist_ok=True)
save_wav('native/assets/sounds/create.wav', generate_create())
save_wav('native/assets/sounds/keyTick.wav', generate_keyTick())
save_wav('native/assets/sounds/save.wav', generate_save())
save_wav('native/assets/sounds/priority.wav', generate_priority())
save_wav('native/assets/sounds/complete.wav', generate_complete())
save_wav('native/assets/sounds/kill.wav', generate_kill())
save_wav('native/assets/sounds/restore.wav', generate_restore())

print("Sounds generated successfully in native/assets/sounds/")

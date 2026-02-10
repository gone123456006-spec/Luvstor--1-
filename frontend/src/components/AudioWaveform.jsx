import React, { useState, useRef, useEffect } from 'react';
import './AudioWaveform.css';

const AudioWaveform = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            const safeDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
            setDuration(safeDuration);
            setError(null);
        };

        const handleTimeUpdate = () => {
            const safeDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
            const safeCurrent = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
            setCurrentTime(safeCurrent);
            setProgress(safeDuration > 0 ? (safeCurrent / safeDuration) * 100 : 0);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            setProgress(0);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        const handleError = (e) => {
            console.error("Audio error event:", e);
            const err = audio.error;
            let msg = 'Error';
            if (err) {
                switch (err.code) {
                    case 1: msg = 'Aborted'; break;
                    case 2: msg = 'Network'; break; // Likely 404 or connection
                    case 3: msg = 'Decode'; break; // Corrupt file or unsupported format
                    case 4: msg = 'Not Supported'; break; // Browser can't play this format
                    default: msg = `Err: ${err.code}`;
                }
            }
            if (audio.networkState === 3) msg = 'No Source'; // NO_SOURCE

            console.error("Audio Source:", src);
            setError(msg);
            setIsPlaying(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        if (audio && src) {
            audio.load();
        }

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('error', handleError);
        };
    }, [src]);

    const togglePlayPause = async (e) => {
        e?.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (!audio.paused) {
                audio.pause();
            } else {
                await audio.play();
            }
        } catch (err) {
            console.error("Toggle play/pause error:", err);
            // Show meaningful error to user if play fails (e.g. NotAllowedError)
            setError(err.message || "Play Failed");
            setIsPlaying(false);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleWaveformSeek = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.min(1, Math.max(0, clickX / rect.width));
        const seekTime = ratio * audio.duration;
        audio.currentTime = seekTime;
        setCurrentTime(seekTime);
        setProgress(ratio * 100);
    };

    // Tuned bar profile to resemble Instagram DM voice wave
    const barHeights = [
        0.22, 0.35, 0.48, 0.62, 0.54, 0.41, 0.58, 0.72, 0.66, 0.45,
        0.36, 0.52, 0.68, 0.74, 0.63, 0.44, 0.31, 0.47, 0.61, 0.7,
        0.57, 0.42, 0.34, 0.5, 0.65, 0.73, 0.6, 0.46, 0.38, 0.29
    ];

    return (
        <div
            className={`audio-waveform-container ${isPlaying ? 'is-playing' : ''}`}
            role="region"
            aria-label="Audio player"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <audio
                ref={audioRef}
                src={src}
                preload="auto"
                playsInline
                webkit-playsinline="true"
            />

            <button
                className="waveform-play-btn"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                type="button"
                title={error || (isPlaying ? 'Pause' : 'Play')}
            >
                {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="white" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '2px' }}>
                        <path d="M8 5v14l11-7z" fill="white" />
                    </svg>
                )}
            </button>

            <div className="waveform-content">
                <div
                    className="waveform-bars"
                    onClick={handleWaveformSeek}
                    role="slider"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration || 0)}
                    aria-valuenow={Math.round(currentTime || 0)}
                    aria-label="Seek audio"
                >
                    {barHeights.map((height, index) => (
                        <div
                            key={index}
                            className={`waveform-bar ${isPlaying ? 'playing' : ''} ${progress >= ((index + 1) / barHeights.length) * 100 ? 'played' : ''}`}
                            style={{
                                height: `${height * 100}%`,
                                animationDelay: `${index * 0.05}s`
                            }}
                        />
                    ))}
                    <div
                        className="waveform-progress-overlay"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="waveform-time">
                    <span className="waveform-current-time" style={error ? { color: 'red', fontSize: '10px' } : {}}>
                        {error ? error : formatTime(currentTime)}
                    </span>
                    <span className="waveform-duration">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>
            {/* Debug link for errors */}
            {error && (
                <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '8px', fontSize: '10px', color: '#ff4444', textDecoration: 'underline' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    Try Link
                </a>
            )}
        </div>
    );
};

export default AudioWaveform;

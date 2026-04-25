import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  title?: string;
  onFirstPlay?: () => void;
  className?: string;
}

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const AudioPlayer = ({ src, title, onFirstPlay, className }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const firedFirstPlay = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    const onWait = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("waiting", onWait);
    audio.addEventListener("playing", onPlaying);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("waiting", onWait);
      audio.removeEventListener("playing", onPlaying);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
      if (!firedFirstPlay.current) {
        firedFirstPlay.current = true;
        onFirstPlay?.();
      }
    }
  };

  const seek = (v: number[]) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = v[0];
    setCurrent(v[0]);
  };

  const skip = (delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min((a.duration || 0), a.currentTime + delta));
  };

  const onVolume = (v: number[]) => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = v[0];
    setVolume(v[0]);
    if (v[0] > 0 && muted) {
      a.muted = false;
      setMuted(false);
    }
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !muted;
    setMuted(!muted);
  };

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <div className={cn("rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-3", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <div className="mb-2 truncate text-xs font-medium text-muted-foreground" title={title}>
          {title}
        </div>
      )}

      {/* Progress */}
      <div className="mb-2">
        <Slider
          value={[current]}
          max={duration || 1}
          step={0.1}
          onValueChange={seek}
          className="cursor-pointer"
          aria-label="Seek"
        />
        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => skip(-10)}
          aria-label="Back 10 seconds"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="hero"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
        >
          {loading && playing ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-0.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => skip(10)}
          aria-label="Forward 10 seconds"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[muted ? 0 : volume]}
            max={1}
            step={0.05}
            onValueChange={onVolume}
            className="hidden w-20 sm:flex"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

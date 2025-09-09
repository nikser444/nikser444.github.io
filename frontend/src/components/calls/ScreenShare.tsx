import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Monitor, Maximize2, Minimize2, Square, Download, Pause, Play } from 'lucide-react';
import { RootState } from '../../store';
import Avatar from '../common/Avatar';

interface ScreenShareProps {
  stream: MediaStream | null;
  isLocalShare?: boolean;
}

const ScreenShare: React.FC<ScreenShareProps> = ({ 
  stream, 
  isLocalShare = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'HD' | 'Full HD' | '4K'>('HD');
  
  const { currentCall, participants } = useSelector((state: RootState) => state.call);
  const { user } = useSelector((state: RootState) => state.auth);

  // Получение информации о пользователе, который демонстрирует экран
  const presenter = isLocalShare 
    ? user 
    : participants?.find(p => p.isScreenSharing) || currentCall?.participants[0];

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  // Определение качества видео
  useEffect(() => {
    if (stream && videoRef.current) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.height && settings.width) {
          if (settings.height >= 2160) {
            setVideoQuality('4K');
          } else if (settings.height >= 1080) {
            setVideoQuality('Full HD');
          } else {
            setVideoQuality('HD');
          }
        }
      }
    }
  }, [stream]);

  const handleVideoLoad = () => {
    setIsVideoReady(true);
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      if (!isFullscreen) {
        await videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Ошибка переключения полноэкранного режима:', error);
    }
  };

  const handlePauseResume = () => {
    if (!videoRef.current) return;

    if (isPaused) {
      videoRef.current.play();
      setIsPaused(false);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  const downloadScreenshot = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    const link = document.createElement('a');
    link.download = `screen-share-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Обработка выхода из полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Основное видео демонстрации экрана */}
      <div className="w-full h-full relative">
        {stream && isVideoReady ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain bg-black"
            onLoadedData={handleVideoLoad}
          />
        ) : (
          // Плейсхолдер когда видео недоступно
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
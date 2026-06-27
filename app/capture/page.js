"use client";

import { useEffect, useRef, useState } from 'react';

const USER_DATA = {
  nome: 'Natália Ribeiro',
  email: 'natalia@gmail.com',
  telefone: '22998229474',
  nascimento: '27/05/1994',
};
const CLOUDINARY_UPLOAD_FOLDER = 'equivale_logos';

export default function CapturePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState(USER_DATA.email);
  const [message, setMessage] = useState('');
  const [stream, setStream] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [autoCaptureDone, setAutoCaptureDone] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('natalia-camera-user');
    if (stored === 'true') {
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      setMessage('Bem-vinda, Natália! Solicitando permissão para a câmera...');
      setShowWelcomeScreen(true);
      startCamera();
      const timer = window.setTimeout(() => {
        setShowWelcomeScreen(false);
      }, 2000);

      return () => {
        window.clearTimeout(timer);
      };
    }

    stopCamera();
  }, [loggedIn]);

  useEffect(() => {
    if (!stream) return;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
      setMessage('Seu navegador não oferece suporte à câmera. Use Chrome, Edge ou Safari atualizado.');
      return;
    }

    setLoadingCamera(true);
    setCameraSupported(true);
    setMessage('Solicitando acesso à câmera...');

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      setMessage('Câmera conectada. Aguardando inicialização do vídeo...');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch((e) => console.log("Aguardando play do vídeo:", e));
      }
    } catch (error) {
      setCameraSupported(false);
      setMessage('Permissão de câmera negada ou câmera não disponível. Verifique suas configurações e tente novamente.');
    } finally {
      setLoadingCamera(false);
    }
  }

  function handleVideoReady() {
    if (!autoCaptureDone) {
      setAutoCaptureDone(true);
      // Ajustado para exatamente 3 segundos (3000ms) para máxima estabilidade no Android
      setTimeout(() => capturePhoto(), 3000);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setTimeout(() => capturePhoto(), 200);
      return;

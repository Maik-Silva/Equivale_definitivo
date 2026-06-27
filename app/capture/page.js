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
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            setCapturedBlob(blob);
            setMessage('Foto frontal capturada automaticamente. Enviando para Cloudinary...');
            uploadImage(blob);
          } else {
            setMessage('A câmera gerou dados de imagem vazios. Tentando novamente...');
            setAutoCaptureDone(false);
          }
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      setMessage(`Erro ao processar imagem no dispositivo: ${err.message}`);
    }
  }

  async function uploadImage(blobToUpload) {
    const fileToUpload = blobToUpload || capturedBlob;
    if (!fileToUpload) {
      setMessage('Capture uma foto antes de enviar.');
      return;
    }

    setUploading(true);
    setMessage('Enviando imagem capturada para o Cloudinary...');
    setUploadedUrl('');

    try {
      const signatureResponse = await fetch('/api/cloudinary-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder: CLOUDINARY_UPLOAD_FOLDER }),
      });

      const signatureData = await signatureResponse.json();
      if (!signatureResponse.ok) {
        throw new Error(signatureData.error || 'Falha ao gerar assinatura de upload.');
      }

      const uploadForm = new FormData();
      uploadForm.append('file', fileToUpload, 'natalia-frontal.jpg');
      uploadForm.append('api_key', signatureData.api_key);
      uploadForm.append('timestamp', signatureData.timestamp);
      uploadForm.append('signature', signatureData.signature);
      uploadForm.append('folder', signatureData.folder || CLOUDINARY_UPLOAD_FOLDER);

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`, {
        method: 'POST',
        body: uploadForm,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error?.message || 'Upload para Cloudinary falhou.');
      }

      setUploadedUrl(uploadResult.secure_url);
      setMessage('Upload concluído com sucesso!');
    } catch (error) {
      setMessage(error?.message || 'Erro ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  }

  function handleLogin(event) {
    event.preventDefault();

    if (email.trim().toLowerCase() !== USER_DATA.email) {
      setMessage('Use o email correto para login: natalia@gmail.com');
      return;
    }

    setLoggedIn(true);
    setShowWelcomeScreen(true);
    localStorage.setItem('natalia-camera-user', 'true');
    setMessage('Login realizado com sucesso. Solicitando acesso à câmera...');
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  function handleLogout() {
    stopCamera();
    setLoggedIn(false);
    setCapturedBlob(null);
    setUploadedUrl('');
    setMessage('Sessão encerrada.');
    localStorage.removeItem('natalia-camera-user');
    setAutoCaptureDone(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
        {showWelcomeScreen && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white px-6 py-8">
            <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/30">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
            </div>
            <div className="max-w-md text-center">
              <p className="text-lg font-semibold">Carregando sua plataforma...</p>
              <p className="mt-3 text-sm text-white/90">Captura automática frontal em andamento. Aguarde.</p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Captura de imagem</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Login e captura automática</h1>
            <p className="mt-2 text-slate-600">
              A aplicação permite o login da Natália Ribeiro e, após a permissão de câmera, captura automaticamente uma foto frontal.
            </p>
          </div>

          {!loggedIn ? (
            <section className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="space-y-2">
                <p className="text-base font-medium text-slate-900">Dados do usuário</p>
                <ul className="space-y-1 text-slate-700">
                  <li>Nome: <strong>{USER_DATA.nome}</strong></li>
                  <li>Email: <strong>{USER_DATA.email}</strong></li>
                  <li>Telefone: <strong>{USER_DATA.telefone}</strong></li>
                  <li>Nascimento: <strong>{USER_DATA.nascimento}</strong></li>
                </ul>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                    placeholder="natalia@gmail.com"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Fazer login como Natália
                </button>
              </form>
            </section>
          ) : (
            <section className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">Usuário logado</p>
                  <p className="text-slate-700">{USER_DATA.nome} ({USER_DATA.email})</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  Desconectar
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="rounded-3xl bg-slate-900 p-4 text-white">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Câmera</p>
                    <p className="mt-3 text-lg font-semibold">Captura frontal automática</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onPlaying={handleVideoReady}
                      className="h-full w-full rounded-3xl bg-black object-cover"
                    />
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">
                      Captura automática em execução. Aguarde enquanto a imagem é enviada para o Cloudinary.
                    </p>
                    {uploading ? (
                      <p className="mt-3 text-sm font-medium text-slate-900">Enviando...</p>
                    ) : capturedBlob ? (
                      <p className="mt-3 text-sm font-medium text-slate-900">
                        {uploadedUrl ? 'Upload concluído com sucesso.' : 'Imagem capturada. Tentando enviar para o Cloudinary...'}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Preview da captura</p>
                    {capturedBlob ? (
                      <img
                        src={URL.createObjectURL(capturedBlob)}
                        alt="Preview da foto capturada"
                        className="mt-3 w-full rounded-3xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="mt-3 rounded-3xl border border-dashed border-slate-300 bg-slate-100 p-8 text-center text-slate-500">
                        Nenhuma foto capturada ainda.
                      </div>
                    )}
                  </div>

                  {uploadedUrl ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Imagem enviada</p>
                      <a href={uploadedUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-slate-700 underline">
                        {uploadedUrl}
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          )}

          {message ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{message}</div>
          ) : null}

          {!cameraSupported && loggedIn ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              A câmera não está disponível no momento. Verifique as permissões do navegador ou teste em um dispositivo que tenha câmera frontal.
            </div>
          ) : null}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </main>
  );
}

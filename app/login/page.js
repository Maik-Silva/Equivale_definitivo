"use client";

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BackButton from '@/components/back-button';

const API_LOGIN_URL = 'https://backend-production-e77b.up.railway.app/api/auth/login';
const API_PATIENT_LOGIN_URL = 'https://backend-production-e77b.up.railway.app/api/auth/login-paciente';

function onlyNumbers(value) {
  return value.replace(/\D/g, '');
}

function formatPhone(value) {
  const numbers = onlyNumbers(value).slice(0, 11);
  if (numbers.length <= 2) return numbers ? `(${numbers}` : '';
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function formatDateInput(value) {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
}

function brazilianToIsoDate(value) {
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map((part) => part.padStart(2, '0'));
  if (!/^\d{2}$/.test(day) || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) return null;
  return `${year}-${month}-${day}`;
}

// Componente interno que roda as funções e hooks com segurança
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tipoUsuario, setTipoUsuario] = useState('nutricionista');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [exibirBemVindo, setExibirBemVindo] = useState(false);
  const [mensagemBemVindo, setMensagemBemVindo] = useState('');
  const logoTimeoutRef = useRef(null);

  useEffect(() => {
    const usuario = searchParams?.get('usuario');
    if (usuario === 'paciente') {
      setTipoUsuario('paciente');
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (logoTimeoutRef.current) window.clearTimeout(logoTimeoutRef.current);
    };

"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ href = '/' }) {
  return (
    <div className="mb-4">
      <Link href={href} className="inline-flex items-center text-sm text-slate-600 hover:underline">
        <ArrowLeft className="mr-2" />Voltar
      </Link>
    </div>
  );
}

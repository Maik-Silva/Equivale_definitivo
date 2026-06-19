import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { suggestionName, suggestionDetails } = body || {};

    if (!suggestionName || !suggestionName.toString().trim()) {
      return NextResponse.json({ error: 'missing_name' }, { status: 400 });
    }

    const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
    const GOOGLE_FORM_ENTRY_NAME = process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_NAME;

    if (!GOOGLE_FORM_URL || !GOOGLE_FORM_ENTRY_NAME) {
      console.error('Google Forms env missing');
      return NextResponse.json({ error: 'config_missing' }, { status: 500 });
    }

    const suggestionPayload = `Nome do alimento: ${suggestionName.toString().trim()}\nMotivo da inclusão: ${
      (suggestionDetails || '').toString().trim()
    }`;

    const formData = new URLSearchParams();
    formData.append(GOOGLE_FORM_ENTRY_NAME, suggestionPayload);

    const response = await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: formData,
    });

    if (response.ok || response.status === 200 || response.status === 302) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const text = await response.text().catch(() => '');
    console.error('Google Forms responded with', response.status, text);
    return NextResponse.json({ ok: false, status: response.status, text }, { status: 502 });
  } catch (error) {
    console.error('Error in /api/send-suggestion:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

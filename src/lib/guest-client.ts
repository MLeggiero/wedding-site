// Browser helpers for the guest forms (photo uploads, song requests).
// Apps Script web apps accept a text/plain POST without a CORS preflight.

export async function postGuest(endpoint: string, payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'The server sent an unexpected reply.' }));
  if (!data.ok) throw new Error(data.error || 'Something went wrong — please try again.');
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/** Shrink to ≤2400px JPEG in the browser; fall back to the original (e.g. HEIC on desktop). */
export async function prepareImage(file: File): Promise<{ data: string; mime: string }> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.88),
    );
    return { data: await toBase64(blob), mime: 'image/jpeg' };
  } catch {
    if (file.size > 12_000_000) throw new Error('That photo is too large — please choose a smaller one.');
    return { data: await toBase64(file), mime: file.type || 'image/jpeg' };
  }
}

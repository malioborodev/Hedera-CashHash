import { BACKEND_URL } from './config';

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const Api = {
  health: () => api<{ ok: boolean }>(`/health`),
  listInvoices: () => api(`/api/invoices`).then(r=>r.data),
  getInvoice: (id: string) => api(`/api/invoices/${id}`).then(r=>r.data),
  createInvoice: (payload: any) => api(`/api/invoices`, { method: 'POST', body: JSON.stringify(payload) }).then(r=>r.data),
  listInvoiceFileMeta: (id: string) => api(`/api/invoices/${id}/file`).then(r=>r.data),
  invest: (id: string, payload: { investorId: string; amount: number }) => api(`/api/invoices/${id}/invest`, { method: 'POST', body: JSON.stringify(payload) }).then(r=>r.data),
  listEvents: (params: URLSearchParams) => api(`/api/events?${params.toString()}`).then(r=>r.data),
  buyerAck: (payload: any) => api(`/api/verify/buyer-ack`, { method: 'POST', body: JSON.stringify(payload) }).then(r=>r.data),
  attesterSign: (payload: any) => api(`/api/verify/attester-sign`, { method: 'POST', body: JSON.stringify(payload) }).then(r=>r.data),
  // NEW: list invoice (set status LISTED)
  listInvoice: (id: string) => api(`/api/invoices/${id}/list`, { method: 'POST' }).then(r=>r.data),
};

export async function uploadInvoiceFile(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BACKEND_URL}/api/invoices/${id}/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
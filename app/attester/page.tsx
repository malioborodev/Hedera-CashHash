"use client";
import { useState } from "react";
import { Api } from "../lib/api";

export default function AttesterPage() {
  const [invoiceId, setInvoiceId] = useState("");
  const [attesterId, setAttesterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      const res = await Api.attesterSign({ invoiceId, attesterId });
      setMessage(`Attestation recorded for invoice ${res.id}`);
      setInvoiceId(""); setAttesterId("");
    } catch (e: any) {
      setError(e.message || "Failed to submit attestation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Attester Signing</h1>
      <p className="text-white/70 text-sm">Pihak attester memverifikasi dan menandatangani invoice.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Invoice ID</label>
          <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2" value={invoiceId} onChange={e=>setInvoiceId(e.target.value)} placeholder="e.g. abc123" />
        </div>
        <div>
          <label className="block text-sm mb-1">Attester Account</label>
          <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2" value={attesterId} onChange={e=>setAttesterId(e.target.value)} placeholder="0.0.xxxxx" />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {message && <div className="text-emerald-400 text-sm">{message}</div>}
        <button disabled={loading} className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">{loading ? 'Submitting...' : 'Submit Attestation'}</button>
      </form>
    </div>
  );
}
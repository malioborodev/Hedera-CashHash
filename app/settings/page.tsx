"use client";
import { useEffect, useState } from "react";
import { NETWORK } from "../lib/config";

export default function SettingsPage() {
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [saved, setSaved] = useState(false);

  useEffect(()=>{
    const v = localStorage.getItem("cashhash_demo_mode");
    setDemoMode(v === "1");
  },[]);

  function onSave() {
    localStorage.setItem("cashhash_demo_mode", demoMode ? "1" : "0");
    setSaved(true);
    setTimeout(()=>setSaved(false), 1500);
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="border border-white/10 rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Demo Mode (frontend)</div>
            <div className="text-xs text-white/60">Only affects UI hints. Backend Demo Mode via env var.</div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={demoMode} onChange={e=>setDemoMode(e.target.checked)} />
            <span>{demoMode ? 'On' : 'Off'}</span>
          </label>
        </div>
        <div className="text-sm text-white/60">Network: {NETWORK}</div>
        <button onClick={onSave} className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600">Save</button>
        {saved && <div className="text-xs text-emerald-400">Saved!</div>}
      </div>
    </div>
  );
}
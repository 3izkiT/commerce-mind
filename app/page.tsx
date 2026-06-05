"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScriptForm, type ScriptFormData } from "@/components/script-form";
import { ScriptOutput, type ScriptData } from "@/components/script-output";

const POLL_INTERVAL_MS = 4000;
const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

export default function Home() {
  const [script, setScript] = useState<ScriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [, setTransactionId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paymentStartRef = useRef<number | null>(null);

  const clearPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPolling();
  }, [clearPolling]);

  const handleGenerate = async (data: ScriptFormData) => {
    setLoading(true);
    setError(null);
    setScript(null);
    setIsPaid(false);
    setQrImageUrl(null);
    setTransactionId(null);
    setPaymentError(null);
    clearPolling();

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "เกิดข้อผิดพลาดในการเจนสคริปต์");
      }

      setScript(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = useCallback(
    (txId: string) => {
      clearPolling();
      paymentStartRef.current = Date.now();
      setPollStatus("รอการชำระเงิน...");

      pollRef.current = setInterval(async () => {
        if (
          paymentStartRef.current &&
          Date.now() - paymentStartRef.current > PAYMENT_TIMEOUT_MS
        ) {
          clearPolling();
          setPollStatus(null);
          setPaymentError("หมดเวลาชำระเงิน กรุณาลองใหม่อีกครั้ง");
          setQrImageUrl(null);
          setTransactionId(null);
          return;
        }

        try {
          const res = await fetch(`/api/moneyspace-check?tx=${encodeURIComponent(txId)}`);
          const json = await res.json();

          if (!res.ok) {
            throw new Error(json.error ?? "ตรวจสอบสถานะไม่สำเร็จ");
          }

          if (json.status === "COMPLETED") {
            clearPolling();
            setIsPaid(true);
            setQrImageUrl(null);
            setPollStatus(null);
            setPaymentError(null);
          } else if (json.status === "FAILED" || json.status === "CANCELLED") {
            clearPolling();
            setPollStatus(null);
            setPaymentError("การชำระเงินไม่สำเร็จ กรุณาลองใหม่");
            setQrImageUrl(null);
            setTransactionId(null);
          }
        } catch {
          setPollStatus("กำลังตรวจสอบสถานะ...");
        }
      }, POLL_INTERVAL_MS);
    },
    [clearPolling]
  );

  const handleUnlock = async () => {
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const res = await fetch("/api/moneyspace-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType: "single" }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "สร้าง QR ไม่สำเร็จ");
      }

      setQrImageUrl(json.qr_image_link);
      setTransactionId(json.transaction_id);
      startPolling(json.transaction_id);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              CommerceMind.ai
            </h1>
            <p className="text-xs text-slate-500">สมองพาณิชย์ — คิดคำขายด้วย AI</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            29 บาท/ครั้ง
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <ScriptForm onSubmit={handleGenerate} loading={loading} />
          </section>

          <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <ScriptOutput
              script={script}
              loading={loading}
              isPaid={isPaid}
              qrImageUrl={qrImageUrl}
              paymentLoading={paymentLoading}
              paymentError={paymentError}
              onUnlock={handleUnlock}
              pollStatus={pollStatus}
            />
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-100 px-6 py-4 text-center text-xs text-slate-400">
        CommerceMind.ai — Stateless AI Script Generator
      </footer>
    </div>
  );
}

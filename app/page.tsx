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

  const parseJsonResponse = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: text || response.statusText || "เกิดข้อผิดพลาด" };
    }
  };

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

      const json = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(
          json?.error ?? "เกิดข้อผิดพลาดในการเจนสคริปต์"
        );
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

      const json = await parseJsonResponse(res);

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
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-zinc-950">
      <header className="shrink-0 border-b border-zinc-200/80 bg-white/95 px-6 py-5 backdrop-blur-xl lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 shadow-lg shadow-zinc-950/5">
              <span className="text-base font-black uppercase tracking-[0.25em] text-white">ค</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
                คิดคำขาย.com
              </h1>
              <p className="text-xs text-slate-500">
                ระบบจับคู่บริบทพาณิชย์และจิตวิทยาการขาย
              </p>
            </div>
          </div>
          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
            29 บาท/ครั้ง
          </span>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 rounded-3xl border border-red-100 bg-red-50/80 px-4 py-4 text-sm text-red-600 lg:mx-10">
          {error}
        </div>
      )}

      <main className="flex flex-1 flex-col gap-6 px-6 py-8 lg:grid lg:grid-cols-[minmax(360px,0.5fr)_minmax(360px,0.5fr)] lg:gap-8 lg:px-10 xl:px-12 xl:py-10">
        <section className="flex flex-col rounded-[2rem] border border-zinc-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <ScriptForm onSubmit={handleGenerate} loading={loading} />
        </section>

        <section className="flex flex-col rounded-[2rem] border border-zinc-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
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
      </main>

      <footer className="shrink-0 border-t border-zinc-200/80 bg-white/80 px-6 py-4 text-center text-xs text-slate-400 backdrop-blur-xl">
        คิดคำขาย.com — Stateless AI Script Generator
      </footer>
    </div>
  );
}

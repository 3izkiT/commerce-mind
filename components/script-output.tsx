"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PRICES } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Brain, Check, Loader2, Lock, QrCode } from "lucide-react";

export interface ScriptData {
  hook: string;
  body_content: string;
}

interface ScriptOutputProps {
  script: ScriptData | null;
  loading: boolean;
  isPaid: boolean;
  qrImageUrl: string | null;
  paymentLoading: boolean;
  paymentError: string | null;
  onUnlock: () => void;
  pollStatus: string | null;
}

function HookTypewriter({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <p className="text-lg font-medium leading-relaxed text-zinc-950 dark:text-slate-100">
      {words.map((word, i) => (
        <span
          key={i}
          className={cn(
            "typewriter-reveal inline",
            i % 3 === 1 && "typewriter-reveal-delay-1",
            i % 3 === 2 && "typewriter-reveal-delay-2"
          )}
          style={{ animationDelay: `${Math.min(i * 0.08, 0.8)}s` }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

export function ScriptOutput({
  script,
  loading,
  isPaid,
  qrImageUrl,
  paymentLoading,
  paymentError,
  onUnlock,
  pollStatus,
}: ScriptOutputProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallExiting, setPaywallExiting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const prevPaidRef = useRef(isPaid);

  useEffect(() => {
    if (script && !isPaid) {
      setPaywallVisible(true);
      setPaywallExiting(false);
      setUnlocking(false);
    }
  }, [script, isPaid]);

  useEffect(() => {
    if (isPaid && !prevPaidRef.current && script) {
      setPaywallExiting(true);
      setUnlocking(true);
      const timer = setTimeout(() => {
        setPaywallVisible(false);
        setPaywallExiting(false);
      }, 340);
      const unlockTimer = setTimeout(() => {
        setUnlocking(false);
      }, 520);
      return () => {
        clearTimeout(timer);
        clearTimeout(unlockTimer);
      };
    }
    prevPaidRef.current = isPaid;
  }, [isPaid, script]);

  const handleCopy = async () => {
    if (!script) return;
    const fullScript = `HOOK:\n${script.hook}\n\nBODY:\n${script.body_content}`;
    await navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setShowToast(true);
    setTimeout(() => {
      setCopied(false);
      setShowToast(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <Skeleton className="h-6 w-56 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <Skeleton className="h-24 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        <Skeleton className="h-6 w-40 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <Skeleton className="h-52 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex items-center justify-center gap-2 pt-4 text-sm text-slate-400">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-accent-blue" />
          กำลังเสกสคริปต์...
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-zinc-200 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-500 shadow-inner dark:bg-zinc-900 dark:text-slate-400">
          <Brain className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-slate-100">
          สคริปต์พร้อมใช้งานจะแสดงที่นี่
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-8 text-slate-500 dark:text-slate-400">
          กรอกรายละเอียดสินค้าด้านซ้ายเพื่อรับประโยค Hook เปิดหัวฟรี!
          และปลดล็อกเนื้อหา Body ตัวเต็มด้วยระบบสแกน PromptPay อัตโนมัติ
        </p>
        <p className="mt-6 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:bg-zinc-900 dark:text-slate-400">
          ระบุข้อมูลด้านซ้าย เพื่อเริ่มเสกคำขายเงินล้าน
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col gap-8">
      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-toast-in">
          <div className="flex items-center gap-2 rounded-2xl bg-accent-green px-5 py-3 text-sm font-medium text-white shadow-2xl shadow-accent-green/20">
            <Check className="h-4 w-4" />
            คัดลอกลงคลิปบอร์ดเรียบร้อยแล้ว พร้อมเอาไปทำคลิปเงินล้าน
          </div>
        </div>
      )}

      <div className="space-y-4">
        <span className="inline-flex items-center rounded-full bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-red-500 ring-1 ring-red-100">
          [ ดูฟรี: ประโยคเปิดหัวกระชากใจ ]
        </span>
        <HookTypewriter text={script.hook} />
      </div>

      <div className="relative flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Body
          </span>
          {!isPaid && (
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-zinc-900 dark:text-slate-400">
              <Lock className="h-3 w-3" />
              ล็อกอยู่
            </span>
          )}
        </div>

        <div className="relative min-h-[220px] overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-slate-50/80 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <div
            className={cn(
              "absolute inset-0 transition-all duration-500",
              !isPaid ? "bg-white/70 backdrop-blur-sm dark:bg-zinc-950/70" : "bg-transparent",
              unlocking && "glass-melt"
            )}
          />
          <div className={cn("relative transition-all duration-500", !isPaid && "blur-sm", isPaid && "body-unlock")}>            
            <p className="whitespace-pre-wrap text-base leading-8 text-zinc-900 dark:text-slate-100">
              {script.body_content}
            </p>
          </div>

          {paywallVisible && !isPaid && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center px-4",
                !paywallExiting && "paywall-enter",
                paywallExiting && "paywall-exit pointer-events-none"
              )}
            >
              <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
                <div className="flex flex-col items-center gap-5 text-center">
                  {qrImageUrl ? (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-slate-200">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <p className="text-base font-semibold leading-snug text-zinc-950 dark:text-slate-100">
                        สแกน PromptPay {PRICES.single}.- เพื่อรับชุดสคริปต์ปิดการขายฉบับเต็ม
                      </p>
                      <div className="qr-frame-pulse relative rounded-3xl border-2 border-zinc-950 p-4">
                        <span className="corner-tr" aria-hidden />
                        <span className="corner-bl" aria-hidden />
                        <div className="relative h-44 w-44 overflow-hidden rounded-2xl bg-white dark:bg-zinc-950">
                          <Image
                            src={qrImageUrl}
                            alt="PromptPay QR Code"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                      {pollStatus && (
                        <p className="flex items-center gap-2 text-xs text-slate-400">
                          <Loader2 className="h-3 w-3 animate-spin text-accent-blue" />
                          {pollStatus}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-slate-400">
                        <Lock className="h-6 w-6" />
                      </div>
                      <p className="text-base font-semibold leading-snug text-zinc-950 dark:text-slate-100">
                        สแกน PromptPay {PRICES.single}.- เพื่อรับชุดสคริปต์ปิดการขายฉบับเต็ม
                      </p>
                      <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        ชำระเงินครั้งเดียว จบในรอบ ไม่มีข้อผูกมัดรายเดือน ปลดล็อกเนื้อหาตัวเต็มทันที
                      </p>
                      <Button
                        onClick={onUnlock}
                        disabled={paymentLoading}
                        className="w-full rounded-2xl bg-zinc-950 py-5 text-base font-semibold text-white shadow-lg shadow-zinc-950/10 hover:bg-zinc-800"
                      >
                        {paymentLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />
                            กำลังสร้าง QR...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4" />
                            แสดง QR PromptPay
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {paymentError && (
                    <p className="text-xs text-red-500">{paymentError}</p>
                  )}
                  {qrImageUrl && (
                    <p className="max-w-sm text-xs leading-relaxed text-slate-400">
                      ชำระเงินครั้งเดียว จบในรอบ ไม่มีข้อผูกมัดรายเดือน ปลดล็อกสคริปต์และวิธีวางบทพูดทันที
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isPaid && (
        <button
          onClick={handleCopy}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-zinc-950 px-6 py-5 text-base font-semibold text-white shadow-lg shadow-zinc-950/10 transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98]"
          )}
        >
          {copied ? (
            <>
              <Check className="h-5 w-5 text-accent-green" />
              คัดลอกแล้ว!
            </>
          ) : (
            <>📋 คัดลอกสคริปต์เต็มไปใช้งาน</>
          )}
        </button>
      )}
    </div>
  );
}

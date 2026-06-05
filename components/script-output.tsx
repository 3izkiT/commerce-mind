"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PRICES } from "@/lib/pricing";
import { Check, Copy, Loader2, Lock, QrCode } from "lucide-react";

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

  const handleCopy = async () => {
    if (!script) return;
    const fullScript = `HOOK:\n${script.hook}\n\nBODY:\n${script.body_content}`;
    await navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-slate-100 p-4">
          <QrCode className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700">
          สคริปต์จะแสดงที่นี่
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          กรอกรายละเอียดสินค้าด้านซ้าย แล้วกดเจนสคริปต์ — ดู Hook ฟรี ปลดล็อก Body ด้วย PromptPay
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col gap-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Hook
          </span>
          <span className="text-xs text-green-600">ฟรี</span>
        </div>
        <p className="text-lg font-medium leading-relaxed text-slate-900">
          {script.hook}
        </p>
      </div>

      <div className="relative flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Body
          </span>
          {!isPaid && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Lock className="h-3 w-3" />
              ล็อกอยู่
            </span>
          )}
        </div>

        <div className="relative">
          <p
            className={`whitespace-pre-wrap text-base leading-relaxed text-slate-800 transition-all duration-500 ${
              !isPaid ? "blur-lg select-none" : ""
            }`}
          >
            {script.body_content}
          </p>

          {!isPaid && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="mx-4 w-full max-w-sm border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                  {qrImageUrl ? (
                    <>
                      <p className="text-sm font-medium text-slate-700">
                        สแกน QR PromptPay เพื่อปลดล็อก
                      </p>
                      <div className="relative h-48 w-48 overflow-hidden rounded-lg border">
                        <Image
                          src={qrImageUrl}
                          alt="PromptPay QR Code"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {PRICES.single} บาท
                      </p>
                      {pollStatus && (
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {pollStatus}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Lock className="h-8 w-8 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        ปลดล็อกเนื้อหา Body เพื่อใช้งานสคริปต์เต็มรูปแบบ
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {PRICES.single} บาท
                      </p>
                      <Button
                        onClick={onUnlock}
                        disabled={paymentLoading}
                        className="w-full"
                      >
                        {paymentLoading ? (
                          <>
                            <Loader2 className="animate-spin" />
                            กำลังสร้าง QR...
                          </>
                        ) : (
                          <>
                            <QrCode />
                            จ่ายด้วย PromptPay
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {paymentError && (
                    <p className="text-xs text-red-600">{paymentError}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {isPaid && (
        <Button onClick={handleCopy} variant="outline" className="w-full">
          {copied ? (
            <>
              <Check />
              คัดลอกแล้ว!
            </>
          ) : (
            <>
              <Copy />
              คัดลอกสคริปต์ทั้งหมด
            </>
          )}
        </Button>
      )}
    </div>
  );
}

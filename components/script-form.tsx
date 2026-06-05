"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidProductInput } from "@/lib/product-input";
import { COMMUNICATION_GOALS, TONE_OPTIONS } from "@/lib/prompts";
import { cn } from "@/lib/utils";

export interface ScriptFormData {
  productDetails: string;
  communicationGoal: string;
  tone: string;
}

interface ScriptFormProps {
  onSubmit: (data: ScriptFormData) => void;
  loading: boolean;
  disabled?: boolean;
}

export function ScriptForm({ onSubmit, loading, disabled }: ScriptFormProps) {
  const [communicationGoal, setCommunicationGoal] = useState("conversion");
  const [tone, setTone] = useState("urgent");
  const [productDetails, setProductDetails] = useState("");

  const canSubmit = isValidProductInput(productDetails);
  const isSubmitDisabled = loading || disabled || !canSubmit;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      productDetails,
      communicationGoal,
      tone,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-8">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 dark:bg-zinc-100">
          <span className="text-sm font-bold text-white dark:text-zinc-950">ค</span>
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-slate-100">
            คิดคำขาย.com
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400/80">
            ระบบจับคู่บริบทพาณิชย์และจิตวิทยาการขาย
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productDetails" className="text-sm font-medium text-zinc-950 dark:text-slate-100">
          รายละเอียดสินค้า *
        </Label>
        <Textarea
          id="productDetails"
          name="productDetails"
          value={productDetails}
          onChange={(e) => setProductDetails(e.target.value)}
          placeholder="วางลิงก์สินค้า (TikTok Shop / Shopee) หรือพิมพ์รายละเอียดจุดเด่นสินค้าได้ในช่องเดียวกัน"
          disabled={loading || disabled}
          className="min-h-[200px] resize-none rounded-[1.75rem] border-zinc-200 bg-white px-4 py-4 text-base leading-7 text-zinc-950 transition-colors duration-200 focus-visible:border-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-slate-200"
        />
        <p
          className={cn(
            "text-sm transition-colors",
            canSubmit ? "text-accent-green" : "text-slate-500 dark:text-slate-500/80"
          )}
        >
          {canSubmit
            ? `${productDetails.trim().length} ตัวอักษร — พร้อมเสกสคริปต์`
            : "วางลิงก์สินค้า หรือพิมพ์รายละเอียดจุดเด่นของสินค้าอย่างน้อย 10 ตัวอักษร"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="communicationGoal" className="text-sm font-medium text-zinc-950 dark:text-slate-100">
            เป้าหมายการสื่อสาร
          </Label>
          <Select
            value={communicationGoal}
            onValueChange={setCommunicationGoal}
            disabled={loading || disabled}
          >
            <SelectTrigger
              id="communicationGoal"
              className="rounded-xl border-zinc-200 bg-white transition-colors focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-slate-100 dark:focus:ring-slate-200"
            >
              <SelectValue placeholder="เลือกเป้าหมาย" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950 dark:text-slate-100">
              {COMMUNICATION_GOALS.map((goal) => (
                <SelectItem key={goal.value} value={goal.value}>
                  {goal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone" className="text-sm font-medium text-zinc-950 dark:text-slate-100">
            โทนเสียง
          </Label>
          <Select
            value={tone}
            onValueChange={setTone}
            disabled={loading || disabled}
          >
            <SelectTrigger
              id="tone"
              className="rounded-xl border-zinc-200 bg-white transition-colors focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-slate-100 dark:focus:ring-slate-200"
            >
              <SelectValue placeholder="เลือกโทนเสียง" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950 dark:text-slate-100">
              {TONE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className={cn(
          "mt-auto flex w-full items-center justify-center gap-2 rounded-[1.5rem] px-6 py-5 text-xl font-semibold transition-all duration-200",
          isSubmitDisabled
            ? "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-slate-500"
            : "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10 hover:bg-zinc-800 active:scale-[0.98]"
        )}
      >
        {loading ? (
          <>
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-accent-blue" />
            กำลังเจนสคริปต์...
          </>
        ) : (
          <>เจนสคริปต์คำขายเงินล้าน ⚡</>
        )}
      </button>
    </form>
  );
}

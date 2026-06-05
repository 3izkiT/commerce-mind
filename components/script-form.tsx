"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMUNICATION_GOALS, TONE_OPTIONS } from "@/lib/prompts";
import { Loader2, Sparkles } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      productDetails: (formData.get("productDetails") as string) ?? "",
      communicationGoal,
      tone,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          สร้างสคริปต์ขายของ
        </h2>
        <p className="text-sm text-slate-500">
          กรอกรายละเอียดสินค้า แล้ว AI จะสร้าง Hook + Body ให้คุณทันที
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productDetails">รายละเอียดสินค้า *</Label>
        <Textarea
          id="productDetails"
          name="productDetails"
          placeholder="เช่น ครีมกันแดด SPF50+ กันน้ำ ไม่เหนียว ราคา 299 บาท ส่งฟรี..."
          required
          minLength={10}
          disabled={loading || disabled}
          className="min-h-[160px] resize-none"
        />
        <p className="text-xs text-slate-400">อย่างน้อย 10 ตัวอักษร</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="communicationGoal">เป้าหมายการสื่อสาร</Label>
        <Select value={communicationGoal} onValueChange={setCommunicationGoal} disabled={loading || disabled}>
          <SelectTrigger id="communicationGoal">
            <SelectValue placeholder="เลือกเป้าหมาย" />
          </SelectTrigger>
          <SelectContent>
            {COMMUNICATION_GOALS.map((goal) => (
              <SelectItem key={goal.value} value={goal.value}>
                {goal.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tone">โทนเสียง</Label>
        <Select value={tone} onValueChange={setTone} disabled={loading || disabled}>
          <SelectTrigger id="tone">
            <SelectValue placeholder="เลือกโทนเสียง" />
          </SelectTrigger>
          <SelectContent>
            {TONE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading || disabled}
        className="mt-auto w-full"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            กำลังเจนสคริปต์...
          </>
        ) : (
          <>
            <Sparkles />
            เจนสคริปต์
          </>
        )}
      </Button>
    </form>
  );
}

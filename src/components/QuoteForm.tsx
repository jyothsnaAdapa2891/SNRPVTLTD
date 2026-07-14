"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Field, TextInput, Select, Button, Card, Switch, LockedField } from "./ui";
import FlatPicker from "./FlatPicker";
import { emptyQuote, type Quote, type QuoteInput } from "@/lib/types";
import { computeQuote, rupees, amenitiesForBhk, AGREEMENT_PERCENT } from "@/lib/calc";
import { createQuote, updateQuote } from "@/lib/store";

type Props = { initial?: Quote; id?: string };

export default function QuoteForm({ initial, id }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<QuoteInput>(() => ({
    ...emptyQuote,
    ...(initial ?? {}),
  }));
  const [customDiscount, setCustomDiscount] = useState(
    () => (initial?.discountPerSft ?? 0) > 0,
  );

  const c = useMemo(() => computeQuote(form), [form]);

  function set<K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const num = (key: keyof QuoteInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(key, (e.target.value === "" ? 0 : Number(e.target.value)) as never);
  const str = (key: keyof QuoteInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(key, e.target.value as never);

  // Amenities are fixed by configuration, not user-editable.
  useEffect(() => {
    setForm((f) => ({ ...f, amenities: amenitiesForBhk(f.bhk) }));
  }, [form.bhk]);

  function toggleCustomDiscount(next: boolean) {
    setCustomDiscount(next);
    if (!next) set("discountPerSft", 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = id ? await updateQuote(id, form) : await createQuote(form);
      if (!saved) throw new Error("Quote not found");
      router.push(`/quotes/${saved._id}`);
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 animate-in"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            href={id ? `/quotes/${id}` : "/"}
            className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy"
          >
            <ArrowLeft size={15} /> Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            {id ? "Edit Quote" : "New Quote"}
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: form fields */}
        <div className="space-y-6">
          <Section title="Guest Details">
            <Field label="First Name">
              <TextInput
                value={form.firstName}
                onChange={str("firstName")}
                required
              />
            </Field>
            <Field label="Last Name">
              <TextInput
                value={form.lastName}
                onChange={str("lastName")}
                required
              />
            </Field>
            <Field label="Phone Number">
              <TextInput
                type="tel"
                value={form.phone}
                onChange={str("phone")}
                required
              />
            </Field>
            <Field label="Address (optional)">
              <TextInput
                value={form.address ?? ""}
                onChange={str("address")}
              />
            </Field>
          </Section>

          <Section title="Quote Details">
            <Field label="Date">
              <TextInput type="date" value={form.date} onChange={str("date")} />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as never)}
              >
                {["Draft", "Accepted", "Rejected"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="Project Name">
              <TextInput
                value={form.projectName}
                onChange={str("projectName")}
              />
            </Field>
            <Field label="City">
              <TextInput value={form.city} onChange={str("city")} />
            </Field>
          </Section>

          <Section title="Flat Details">
            <FlatPicker
              block={form.block}
              flatNo={form.flatNo}
              extentSft={form.extentSft}
              facing={form.facing}
              bhk={form.bhk}
              excludeQuoteId={id}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
            <Field label="Payment Option">
              <Select
                value={form.paymentOption}
                onChange={(e) => set("paymentOption", e.target.value as never)}
              >
                {["Loan", "Outright"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
          </Section>

          <Section title="Cost & Rates">
            <Field label="Basic Rate (Rs./Sft)" hint={`Basic Cost = ${rupees(c.basicCost)}`}>
              <TextInput
                type="number"
                value={form.basicRate || ""}
                onChange={num("basicRate")}
              />
            </Field>
            <Field
              label="Facing Charge (Rs./Sft)"
              hint={`= ${rupees(c.facingCharges)} · East defaults to 100, others to 0`}
            >
              <TextInput
                type="number"
                value={form.facingChargeRate || ""}
                onChange={num("facingChargeRate")}
              />
            </Field>
            <Field
              label="Corner Charge (Rs./Sft)"
              hint={
                c.cornerCharges > 0
                  ? `= ${rupees(c.cornerCharges)} · West + 1890 sft defaults to 100, others to 0`
                  : "0 = hidden on printed quote · West + 1890 sft defaults to 100"
              }
            >
              <TextInput
                type="number"
                value={form.cornerChargeRate || ""}
                onChange={num("cornerChargeRate")}
              />
            </Field>
            <LockedField
              label="Floor Rise (Rs./Sft)"
              value={
                c.floor > 0
                  ? `Rs.${c.floorRiseRate}/- · Floor ${c.floor}`
                  : "Select a flat"
              }
              hint={`Floor Rise = ${rupees(c.floorRise)} · 0 for 4th floor & below, +Rs.25/sft each floor from the 5th`}
            />
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-600">
                  Discount
                </span>
                <Switch
                  checked={customDiscount}
                  onChange={toggleCustomDiscount}
                  label="Custom"
                />
              </div>
              {customDiscount && (
                <>
                  <TextInput
                    type="number"
                    value={form.discountPerSft || ""}
                    onChange={num("discountPerSft")}
                    placeholder="Rs. per Sft"
                  />
                  <span className="text-[11px] text-slate-400">
                    {c.discountAmount > 0
                      ? `− ${rupees(c.discountAmount)} · shown on printed quote`
                      : "0 = hidden on printed quote"}
                  </span>
                </>
              )}
            </div>
          </Section>

          <Section title="Payable at Registration">
            <LockedField label="Amenities (incl. Two Car Parking)" value={rupees(form.amenities)} />
            <LockedField label="Corpus Fund" value={rupees(form.corpusFund)} />
            <LockedField
              label="Adv. Maintenance"
              value={rupees(c.maintCharges)}
              hint={`${Math.round(form.maintMonths / 12)} yrs @ Rs.${form.maintRatePerSftMonth}/sft/month`}
            />
            <LockedField label="Water Connection" value={rupees(form.waterCharges)} />
            <LockedField label="Legal & Documentation" value={rupees(form.legalCharges)} />
            <LockedField label="Refundable Caution Deposit" value={rupees(form.cautionDeposit)} />
          </Section>

          <Section title="Payment Terms">
            <Field label="Booking Amount">
              <TextInput
                type="number"
                value={form.bookingAmount || ""}
                onChange={num("bookingAmount")}
              />
            </Field>
            <LockedField
              label="Agreement Amount"
              value={rupees(c.agreementAmount)}
              hint={`${AGREEMENT_PERCENT}% of Flat Cost, minus Booking Amount (registration excluded)`}
            />
            <Field label="Notes (optional)" className="sm:col-span-2">
              <TextInput
                value={form.notes ?? ""}
                onChange={str("notes")}
                placeholder="Any extra remarks shown on the estimate"
              />
            </Field>
          </Section>
        </div>

        {/* Right: sticky live summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="bg-navy px-5 py-4 text-white">
              <p className="text-[11px] uppercase tracking-widest text-gold">
                Live Summary
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {rupees(c.grandTotal)}
              </p>
              <p className="text-[11px] text-slate-300">All-in (flat + charges)</p>
            </div>
            <div className="space-y-2.5 p-5 text-sm">
              <SumRow k="Basic Cost" v={rupees(c.basicCost)} />
              <SumRow k="Facing Charges" v={rupees(c.facingCharges)} />
              <SumRow k="Floor Rise" v={rupees(c.floorRise)} />
              {c.cornerCharges > 0 && (
                <SumRow k="Corner Charges" v={rupees(c.cornerCharges)} />
              )}
              {c.discountAmount > 0 && (
                <SumRow
                  k="Discount"
                  v={`− ${rupees(c.discountAmount)}`}
                  tone="positive"
                />
              )}
              <div className="my-2 flex items-center justify-between border-y border-border py-2 font-bold text-navy">
                <span>Flat Cost</span>
                <span className="tabular-nums">{rupees(c.flatCost)}</span>
              </div>
              <SumRow k="Registration Charges" v={rupees(c.registrationTotal)} />
              <SumRow
                k={`Agreement Amount (${AGREEMENT_PERCENT}%)`}
                v={rupees(c.agreementAmount)}
              />
            </div>
            <div className="border-t border-border p-4">
              <Button
                type="submit"
                className="w-full"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {id ? "Update Quote" : "Create Quote"}
              </Button>
              {error && (
                <p className="mt-2 text-center text-xs text-red-600">{error}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

function SumRow({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "positive";
}) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{k}</span>
      <span
        className={`font-semibold tabular-nums ${tone === "positive" ? "text-emerald-600" : "text-slate-800"}`}
      >
        {v}
      </span>
    </div>
  );
}

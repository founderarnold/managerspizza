import { CheckCircle2, Circle } from "lucide-react";
import { TRACK_STEPS, orderStatus, type OrderStatus } from "@/lib/orders";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = orderStatus(status);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.tone}`}>{s.label}</span>;
}

/** Horizontal progress bar (vertical on phones). */
export function TrackBar({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return null;
  return (
    <ol className="grid gap-2 sm:grid-cols-5 sm:gap-0">
      {TRACK_STEPS.map((step, i) => {
        const done = step.reached.includes(status);
        return (
          <li key={step.label} className="flex items-center gap-2 sm:flex-col sm:gap-1.5 sm:text-center">
            <span className="flex items-center sm:w-full">
              <span className={`hidden h-0.5 flex-1 sm:block ${i === 0 ? "invisible" : done ? "bg-success" : "bg-line"}`} />
              {done ? <CheckCircle2 size={24} className="shrink-0 text-success" aria-hidden /> : <Circle size={24} className="shrink-0 text-line" aria-hidden />}
              <span className={`hidden h-0.5 flex-1 sm:block ${i === TRACK_STEPS.length - 1 ? "invisible" : TRACK_STEPS[i + 1].reached.includes(status) ? "bg-success" : "bg-line"}`} />
            </span>
            <span className={`text-sm ${done ? "font-semibold text-ink" : "text-muted"}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

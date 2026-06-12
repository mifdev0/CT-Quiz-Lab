import { CheckCircle2, CircleAlert } from "lucide-react";

export function Notice({ success, error }: { success?: string; error?: string }) {
  if (!success && !error) return null;
  const isSuccess = Boolean(success);
  return (
    <div className={`mb-4 rounded-lg border-2 p-3 font-bold ${isSuccess ? "border-leaf bg-leaf/10 text-leafDark" : "border-coral bg-coral/10 text-coral"}`}>
      <span className="flex items-center gap-2">
        {isSuccess ? <CheckCircle2 size={18} aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}
        {success || error}
      </span>
    </div>
  );
}

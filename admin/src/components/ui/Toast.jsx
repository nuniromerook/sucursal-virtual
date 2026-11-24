// admin/src/components/ui/Toast.jsx
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";

export default function Toast() {
  const { toast } = useAdmin();

  if (!toast) return null;

  const isError = toast.type === "error";
  const isInfo = toast.type === "info";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-medium text-white bg-slate-900 border border-slate-800 transition-all transform animate-in fade-in slide-in-from-bottom-3 duration-200">
      {isError ? (
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
      ) : isInfo ? (
        <Info className="w-4 h-4 text-sky-400 shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}

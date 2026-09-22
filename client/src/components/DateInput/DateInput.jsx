import { useRef } from "react";
import { Calendar } from "lucide-react";
import { toDMY } from "../../utils/format";
import { FOCUS_RING, FIELD_LABEL } from "../../styles/shared";

// Native <input type="date"> renders its text in whatever format the
// browser's locale picks (mm/dd/yyyy, dd/mm/yyyy, ...) and ignores the
// page's `lang` attribute in Chrome/Edge. To keep the dd/mm/yyyy format
// consistent everywhere, this shows a styled button with our own text and
// delegates the actual picking to a visually hidden native date input.
function DateInput({ label, value, onChange }) {
  const nativeRef = useRef(null);

  const openPicker = () => {
    const el = nativeRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.focus();
    }
  };

  return (
    <div>
      {label && <label className={FIELD_LABEL}>{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-left ${FOCUS_RING} ${
            value ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {value ? toDMY(value) : "dd/mm/yyyy"}
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
        </button>
        <input
          ref={nativeRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          className="sr-only"
        />
      </div>
    </div>
  );
}

export default DateInput;

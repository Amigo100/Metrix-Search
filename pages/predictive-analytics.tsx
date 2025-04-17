// file: pages/predictive-analytics.tsx

import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  forwardRef,
  ReactNode,
  useRef,
  Children,
  isValidElement,
  FC,
  ReactElement,
} from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Lightbulb,
  RotateCcw,
  LogIn,
  Hourglass,
  ClipboardList,
} from "lucide-react";
import {
  format,
  isValid,
  parse,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";

// === ENV‑DRIVEN BACKEND URL ===
const PREDICTIVE_API_URL =
  process.env.NEXT_PUBLIC_PREDICTIVE_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000/predictive/api/predict"
    : "https://fastapiplatformclean-10.onrender.com/predictive/api/predict");

// =============== Types ===============
interface PredictionResult {
  wait3h: number;
  wait4h: number;
  wait5h: number;
  wait6h: number;
  admissionLikelihood: number;
  predictedWaitMinutes: number;
}

interface LikelihoodFormat {
  text: string;
  color: string;
  bgColor: string;
  Icon: React.ElementType;
}

interface ApiPredictionInput {
  age: number;
  gender: string;
  patientsInED: number;
  patientsAhead: number;
  dateTime: string;
  triageCode: number;
  referralSource: string;
  isAccident: boolean;
  hasFever: boolean;
  alteredMentalStatus: boolean;
  occupancy: string;
}

// =============== Helpers ===============
const encodeAgeOrdinal = (rawAge: number): number => {
  if (rawAge >= 1 && rawAge <= 5) return 1;
  if (rawAge >= 6 && rawAge <= 12) return 2;
  if (rawAge >= 13 && rawAge <= 18) return 3;
  if (rawAge >= 19 && rawAge <= 39) return 4;
  if (rawAge >= 40 && rawAge <= 64) return 5;
  if (rawAge >= 65 && rawAge <= 80) return 6;
  if (rawAge >= 81) return 7;
  return 0;
};

// =============== UI Primitives ===============
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

const Button: FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline";
    size?: "sm";
  }
> = ({ children, variant = "default", size, className = "", ...props }) => {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50";
  const sizeCls = size === "sm" ? "h-9 px-3" : "h-10 px-4 py-2";
  const variants = {
    default:
      "bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80] text-white hover:from-[#254058] hover:to-[#316667]",
    outline:
      "border border-[#3D7F80] bg-white text-stone-700 hover:bg-stone-100",
  };
  return (
    <button
      className={cn(base, sizeCls, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      ref={ref}
      className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[#3D7F80]"
      {...props}
    />
  )
);
Input.displayName = "Input";

const Label: FC<React.LabelHTMLAttributes<HTMLLabelElement>> = (props) => (
  <label className="block text-sm font-medium text-stone-700 mb-1" {...props} />
);

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  children: ReactNode;
}
const Select: FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder,
  required,
  id,
  children,
}) => {
  const opts = Children.toArray(children).filter(
    (c): c is ReactElement => isValidElement(c)
  );
  const sel = opts.find((o) => o.props.value === value);
  const display = sel
    ? typeof sel.props.children === "string"
      ? sel.props.children
      : placeholder
    : placeholder;
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onValueChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <Button variant="outline" className="w-full justify-between">
        <span className="truncate">{display}</span>
        <Clock className="h-4 w-4 text-stone-500" />
      </Button>
    </div>
  );
};

const SelectItem: FC<React.OptionHTMLAttributes<HTMLOptionElement>> = ({
  children,
  ...props
}) => <option {...props}>{children}</option>;

interface CardProps {
  children: ReactNode;
  className?: string;
}
const Card: FC<CardProps> = ({ children, className }) => (
  <div className={cn("rounded-xl border bg-white shadow-md", className)}>
    {children}
  </div>
);

const CardHeader: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("flex items-center justify-between p-5", className)}>
    {children}
  </div>
);

const CardTitle: FC<{ children: ReactNode }> = ({ children }) => (
  <h3 className="text-base font-semibold">{children}</h3>
);

const CardContent: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("p-5 pt-0", className)}>{children}</div>
);

const Popover: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="relative">{children}</div>
);
const PopoverTrigger: FC<{ onClick?: () => void; children: ReactNode }> = ({
  onClick,
  children,
}) => <div onClick={onClick}>{children}</div>;
const PopoverContent: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "absolute mt-1 p-4 border rounded-md bg-white shadow-lg z-50",
      className
    )}
  >
    {children}
  </div>
);

const Progress: FC<{ value?: number | null; colorClass?: string }> = ({
  value,
  colorClass = "bg-[#3D7F80]",
}) => (
  <div className="relative h-2 w-full bg-stone-200 rounded-full overflow-hidden">
    <div
      className={`${colorClass} h-full transition-transform ease-out duration-500`}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

const SwitchMock: FC<{
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
  "aria-label"?: string;
}> = ({ checked, onCheckedChange, "aria-label": label }) => {
  const bg = checked ? "bg-[#3D7F80]" : "bg-stone-300";
  const pos = checked ? "translate-x-5" : "translate-x-0";
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 rounded-full transition-colors focus:ring-2 focus:ring-[#3D7F80]",
        bg
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
          pos
        )}
      />
    </button>
  );
};

// =============== Main Component ===============
const PredictiveAnalyticsPage: FC = () => {
  // State…
  const [age, setAge] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const [gender, setGender] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [triageCode, setTriageCode] = useState("");
  const [patientsAhead, setPatientsAhead] = useState("");
  const [patientsInED, setPatientsInED] = useState("");
  const [alteredMentalStatus, setAlteredMentalStatus] = useState(false);
  const [isAccident, setIsAccident] = useState(false);
  const [hasFever, setHasFever] = useState(false);

  const [predictions, setPredictions] = useState<PredictionResult | null>(
    null
  );
  const [recommendations, setRecommendations] = useState<string[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Format likelihood…
  const formatLikelihood = (p: number): LikelihoodFormat => {
    if (p > 75)
      return { text: "Very High", color: "text-red-700", bgColor: "bg-red-500", Icon: AlertCircle };
    if (p > 50)
      return { text: "High", color: "text-orange-700", bgColor: "bg-orange-500", Icon: AlertCircle };
    if (p > 25)
      return { text: "Medium", color: "text-yellow-700", bgColor: "bg-yellow-500", Icon: Clock };
    return { text: "Low", color: "text-green-700", bgColor: "bg-green-500", Icon: CheckCircle };
  };

  // Recommendations helper…
  const generateRecommendations = (r: PredictionResult) => {
    const recs: string[] = [];
    const avg = (r.wait3h + r.wait4h + r.wait5h + r.wait6h) / 4;
    if (r.wait6h > 70 || r.wait5h > 80) recs.push("High risk of extended wait (>5-6h). Consider senior staff alert.");
    else if (avg > 50) recs.push("Moderate to high likelihood of long wait. Review ED flow.");
    if (avg > 40) recs.push("Inform patient/family about potential significant wait.");
    const tc = parseInt(triageCode, 10);
    if (!isNaN(tc) && (tc === 1 || tc === 2)) recs.push(`High triage acuity (Code ${tc}). Ensure prompt assessment.`);
    if (occupancy === "critical" || occupancy === "high") recs.push(`ED occupancy is ${occupancy}. Expedite discharges.`);
    if (alteredMentalStatus) recs.push("Note: Altered mental status present.");
    if (hasFever) recs.push("Note: Fever present.");
    if (r.admissionLikelihood > 70) recs.push("High admission likelihood. Consider early inpatient notification.");
    if (r.predictedWaitMinutes > 240) recs.push(`Predicted wait ~${Math.round(r.predictedWaitMinutes / 60)} hours. Ensure comfort/reassessment.`);
    if (recs.length === 0) recs.push("Predicted wait times appear manageable. Continue standard monitoring.");
    setRecommendations(recs);
  };

  // Submit handler…
  const handlePredict = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPredictions(null);
    setRecommendations(null);

    const pa = parseInt(age, 10);
    const pt = parseInt(triageCode, 10);
    const pahead = parseInt(patientsAhead, 10);
    const pined = parseInt(patientsInED, 10);

    // (your existing validation…)

    const apiInput: ApiPredictionInput = {
      age: encodeAgeOrdinal(pa),
      gender,
      patientsInED: pined,
      patientsAhead: pahead,
      dateTime: dateTime.toISOString(),
      triageCode: pt,
      referralSource,
      isAccident,
      hasFever,
      alteredMentalStatus,
      occupancy,
    };

    try {
      const resp = await fetch(PREDICTIVE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(apiInput),
      });
      if (!resp.ok) {
        let m = `API Error: ${resp.status} ${resp.statusText}`;
        try {
          const j = await resp.json();
          m = j.error || j.detail || m;
        } catch {}
        throw new Error(m);
      }
      const results: PredictionResult = await resp.json();
      setPredictions(results);
      generateRecommendations(results);
    } catch (err) {
      console.error("API call failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // (rest of your date/time handlers and JSX rendering stays unchanged…)

  return (
    <div className="p-4 md:p-6 w-full bg-stone-50 text-stone-900">
      {/* your full form + results JSX */}
    </div>
  );
};

export default PredictiveAnalyticsPage;

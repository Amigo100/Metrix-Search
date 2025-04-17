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

// =============== Type Definitions ===============
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

// =============== Helper: Age Encoding ===============
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

const Button: FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "sm";
}> = ({
  children,
  variant = "default",
  size,
  className = "",
  ...props
}) => {
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

const Select: FC<{
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  children: ReactNode;
}> = ({ value, onValueChange, placeholder, required, id, children }) => {
  const selectChildren = Children.toArray(children).filter(
    (c): c is ReactElement => isValidElement(c)
  );
  const selected = selectChildren.find((c) => c.props.value === value);
  const display = selected
    ? typeof selected.props.children === "string"
      ? selected.props.children
      : ""
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

const Card: FC<{ className?: string }> = ({ children, className }) => (
  <div className={cn("rounded-xl border bg-white shadow-md", className)}>
    {children}
  </div>
);
const CardHeader: FC = ({ children }) => (
  <div className="p-5 flex items-center justify-between">{children}</div>
);
const CardTitle: FC = ({ children }) => (
  <h3 className="text-base font-semibold">{children}</h3>
);
const CardContent: FC<{ className?: string }> = ({ children, className }) => (
  <div className={cn("p-5 pt-0", className)}>{children}</div>
);

const Popover: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="relative">{children}</div>
);
const PopoverTrigger: FC<{ onClick?: () => void }> = ({
  children,
  onClick,
}) => <div onClick={onClick}>{children}</div>;
const PopoverContent: FC<{ className?: string }> = ({
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
  // --- State ---
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

  // --- Format likelihood helper ---
  const formatLikelihood = (percentage: number): LikelihoodFormat => {
    if (percentage > 75)
      return { text: "Very High", color: "text-red-700", bgColor: "bg-red-500", Icon: AlertCircle };
    if (percentage > 50)
      return { text: "High", color: "text-orange-700", bgColor: "bg-orange-500", Icon: AlertCircle };
    if (percentage > 25)
      return { text: "Medium", color: "text-yellow-700", bgColor: "bg-yellow-500", Icon: Clock };
    return { text: "Low", color: "text-green-700", bgColor: "bg-green-500", Icon: CheckCircle };
  };

  // --- Generate recommendations ---
  const generateRecommendations = (results: PredictionResult) => {
    const recs: string[] = [];
    const avgLikelihood =
      (results.wait3h +
        results.wait4h +
        results.wait5h +
        results.wait6h) /
      4;

    if (results.wait6h > 70 || results.wait5h > 80) {
      recs.push("High risk of extended wait (>5-6h). Consider senior staff alert.");
    } else if (avgLikelihood > 50) {
      recs.push("Moderate to high likelihood of long wait. Review ED flow.");
    }
    if (avgLikelihood > 40) {
      recs.push("Inform patient/family about potential significant wait.");
    }

    const tc = parseInt(triageCode, 10);
    if (!isNaN(tc) && (tc === 1 || tc === 2)) {
      recs.push(`High triage acuity (Code ${tc}). Ensure prompt assessment.`);
    }
    if (occupancy === "critical" || occupancy === "high") {
      recs.push(`ED occupancy is ${occupancy}. Expedite discharges.`);
    }
    if (alteredMentalStatus) recs.push("Note: Altered mental status present.");
    if (hasFever) recs.push("Note: Fever present.");
    if (results.admissionLikelihood > 70) {
      recs.push("High admission likelihood. Consider early inpatient notification.");
    }
    if (results.predictedWaitMinutes > 240) {
      recs.push(
        `Predicted wait ~${Math.round(results.predictedWaitMinutes / 60)} hours. Ensure comfort/reassessment.`
      );
    }
    if (recs.length === 0) {
      recs.push("Predicted wait times appear manageable. Continue standard monitoring.");
    }

    setRecommendations(recs);
  };

  // --- Submit handler ---
  const handlePredict = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPredictions(null);
    setRecommendations(null);

    const parsedAge = parseInt(age, 10);
    const parsedTriage = parseInt(triageCode, 10);
    const parsedAhead = parseInt(patientsAhead, 10);
    const parsedInED = parseInt(patientsInED, 10);

    // (you already have validations here in your original)

    const apiInput: ApiPredictionInput = {
      age: encodeAgeOrdinal(parsedAge),
      gender,
      patientsInED: parsedInED,
      patientsAhead: parsedAhead,
      dateTime: dateTime.toISOString(),
      triageCode: parsedTriage,
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
        let msg = `API Error: ${resp.status} ${resp.statusText}`;
        try {
          const errJson = await resp.json();
          msg = errJson.error || errJson.detail || msg;
        } catch {}
        throw new Error(msg);
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

  // --- Reset & date/time handlers omitted for brevity (unchanged) ---

  return (
    <div className="p-4 md:p-6 w-full bg-stone-50 text-stone-900">
      {/* your full JSX form + results area goes here, exactly as before */}
    </div>
  );
};

export default PredictiveAnalyticsPage;

// file: pages/predictive‑analytics.tsx

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

// === NEW: choose the correct backend URL ===
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

// =============== Helper UI Components (unchanged) ===============
// ... Button, Input, Select, SelectItem, Card, CardHeader, CardTitle,
//     CardContent, Popover, PopoverTrigger, PopoverContent,
//     Progress, SwitchMock, and cn() definitions go here ...

// =============== Main Component ===============
const PredictiveAnalyticsPage: FC = () => {
  // --- State Variables ---
  const [age, setAge] = useState<string>("");
  const [dateTime, setDateTime] = useState<Date>(new Date());
  const [gender, setGender] = useState<string>("");
  const [occupancy, setOccupancy] = useState<string>("");
  const [referralSource, setReferralSource] = useState<string>("");
  const [triageCode, setTriageCode] = useState<string>("");
  const [patientsAhead, setPatientsAhead] = useState<string>("");
  const [patientsInED, setPatientsInED] = useState<string>("");
  const [alteredMentalStatus, setAlteredMentalStatus] =
    useState<boolean>(false);
  const [isAccident, setIsAccident] = useState<boolean>(false);
  const [hasFever, setHasFever] = useState<boolean>(false);

  const [predictions, setPredictions] =
    useState<PredictionResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // === handlePredict now uses our env‑driven URL ===
  const handlePredict = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setPredictions(null);
    setRecommendations(null);

    const parsedAge = parseInt(age, 10);
    const parsedTriage = parseInt(triageCode, 10);
    const parsedPatientsAhead = parseInt(patientsAhead, 10);
    const parsedPatientsInED = parseInt(patientsInED, 10);

    // (your existing validation logic…)

    const apiInput: ApiPredictionInput = {
      age: encodeAgeOrdinal(parsedAge),
      gender,
      patientsInED: parsedPatientsInED,
      patientsAhead: parsedPatientsAhead,
      dateTime: dateTime.toISOString(),
      triageCode: parsedTriage,
      referralSource,
      isAccident,
      hasFever,
      alteredMentalStatus,
      occupancy,
    };

    try {
      const response = await fetch(PREDICTIVE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(apiInput),
      });

      if (!response.ok) {
        let errorDetail = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          errorDetail = errData.error || errData.detail || errorDetail;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(errorDetail);
      }

      const results: PredictionResult = await response.json();
      setPredictions(results);
      generateRecommendations(results);
    } catch (err) {
      console.error("API call failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // (the rest of your component: generateRecommendations, handlers, JSX output…)

  return (
    <div className="p-4 md:p-6 w-full bg-stone-50 text-stone-900">
      {/* ... your full form + results JSX unchanged ... */}
    </div>
  );
};

export default PredictiveAnalyticsPage;

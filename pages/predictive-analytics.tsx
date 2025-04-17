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
} from 'react';
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
} from 'lucide-react';
import {
  format,
  isValid,
  parse,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns';

// ─────────────────────────────────────────────
//  ENV‑DRIVEN BACKEND URL
// ─────────────────────────────────────────────
const PREDICTIVE_API_URL =
  process.env.NEXT_PUBLIC_PREDICTIVE_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000/predictive/api/predict'
    : 'https://fastapiplatformclean-10.onrender.com/predictive/api/predict');

// ─────────────────────────────────────────────
//  Type Definitions
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  Helper: Age Encoding
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  UI Primitives
// ─────────────────────────────────────────────
const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

/* ── Button ───────────────────────────── */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
  size?: 'sm';
  children: ReactNode;
};
const Button: FC<ButtonProps> = ({
  children,
  variant = 'default',
  size,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50';
  const sizeCls = size === 'sm' ? 'h-9 px-3' : 'h-10 px-4 py-2';
  const variants = {
    default:
      'bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80] text-white hover:from-[#254058] hover:to-[#316667]',
    outline:
      'border border-[#3D7F80] bg-white text-stone-700 hover:bg-stone-100',
  };
  return (
    <button className={cn(base, sizeCls, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

/* ── Input ─────────────────────────────── */
const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    ref={ref}
    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[#3D7F80]"
    {...props}
  />
));
Input.displayName = 'Input';

/* ── Label ─────────────────────────────── */
const Label: FC<React.LabelHTMLAttributes<HTMLLabelElement>> = (props) => (
  <label className="block text-sm font-medium text-stone-700 mb-1" {...props} />
);

/* ── Select & SelectItem ───────────────── */
interface SelectProps {
  value: string;
  onValueChange: (v: string) => void;
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
  const display =
    sel && typeof sel.props.children === 'string'
      ? sel.props.children
      : placeholder ?? '';
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onValueChange(e.target.value)
        }
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

/* ── Card ──────────────────────────────── */
interface CardProps {
  children: ReactNode;
  className?: string;
}
const Card: FC<CardProps> = ({ children, className }) => (
  <div className={cn('rounded-xl border bg-white shadow-md', className)}>
    {children}
  </div>
);
const CardHeader: FC<CardProps> = ({ children, className }) => (
  <div className={cn('flex items-center justify-between p-5', className)}>
    {children}
  </div>
);
const CardTitle: FC<CardProps> = ({ children }) => (
  <h3 className="text-base font-semibold">{children}</h3>
);
const CardContent: FC<CardProps> = ({ children, className }) => (
  <div className={cn('p-5 pt-0', className)}>{children}</div>
);

/* ── Popover ───────────────────────────── */
interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
const Popover: FC<PopoverProps> = ({ children }) => (
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
      'absolute mt-1 p-4 border rounded-md bg-white shadow-lg z-50',
      className
    )}
  >
    {children}
  </div>
);

/* ── Progress ──────────────────────────── */
const Progress: FC<{ value?: number | null; colorClass?: string }> = ({
  value,
  colorClass = 'bg-[#3D7F80]',
}) => (
  <div className="relative h-2 w-full bg-stone-200 rounded-full overflow-hidden">
    <div
      className={`${colorClass} h-full transition-transform ease-out duration-500`}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

/* ── Switch (mock) ─────────────────────── */
interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-label'?: string;
}
const SwitchMock: FC<SwitchProps> = ({
  id,
  checked,
  onCheckedChange,
  'aria-label': ariaLabel,
}) => {
  const bg = checked ? 'bg-[#3D7F80]' : 'bg-stone-300';
  const pos = checked ? 'translate-x-5' : 'translate-x-0';
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 rounded-full transition-colors focus:ring-2 focus:ring-[#3D7F80]',
        bg
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
          pos
        )}
      />
    </button>
  );
};

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
const PredictiveAnalyticsPage: FC = () => {
  /* ── State ─────────────────────────── */
  const [age, setAge] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [gender, setGender] = useState('');
  const [occupancy, setOccupancy] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [triageCode, setTriageCode] = useState('');
  const [patientsAhead, setPatientsAhead] = useState('');
  const [patientsInED, setPatientsInED] = useState('');
  const [alteredMentalStatus, setAlteredMentalStatus] = useState(false);
  const [isAccident, setIsAccident] = useState(false);
  const [hasFever, setHasFever] = useState(false);

  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  /* ── Format likelihood ─────────────── */
  const formatLikelihood = (p: number): LikelihoodFormat => {
    if (p > 75)
      return {
        text: 'Very High',
        color: 'text-red-700',
        bgColor: 'bg-red-500',
        Icon: AlertCircle,
      };
    if (p > 50)
      return {
        text: 'High',
        color: 'text-orange-700',
        bgColor: 'bg-orange-500',
        Icon: AlertCircle,
      };
    if (p > 25)
      return {
        text: 'Medium',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-500',
        Icon: Clock,
      };
    return {
      text: 'Low',
      color: 'text-green-700',
      bgColor: 'bg-green-500',
      Icon: CheckCircle,
    };
  };

  /* ── Recommendations helper ────────── */
  const generateRecommendations = (r: PredictionResult) => {
    const recs: string[] = [];
    const avg = (r.wait3h + r.wait4h + r.wait5h + r.wait6h) / 4;

    if (r.wait6h > 70 || r.wait5h > 80)
      recs.push('High risk of extended wait (>5‑6 h). Consider senior staff alert.');
    else if (avg > 50)
      recs.push('Moderate to high likelihood of long wait. Review ED flow.');
    if (avg > 40)
      recs.push('Inform patient/family about potential significant wait.');

    const tc = parseInt(triageCode, 10);
    if (!isNaN(tc) && (tc === 1 || tc === 2))
      recs.push(`High triage acuity (Code ${tc}). Ensure prompt assessment.`);

    if (occupancy === 'critical' || occupancy === 'high')
      recs.push(`ED occupancy is ${occupancy}. Expedite discharges.`);

    if (alteredMentalStatus) recs.push('Note: Altered mental status present.');
    if (hasFever) recs.push('Note: Fever present.');

    if (r.admissionLikelihood > 70)
      recs.push('High admission likelihood. Consider early inpatient notification.');
    if (r.predictedWaitMinutes > 240)
      recs.push(
        `Predicted wait ≈ ${Math.round(r.predictedWaitMinutes / 60)} h. Ensure comfort/re‑assessment.`
      );

    if (recs.length === 0)
      recs.push('Predicted wait times appear manageable. Continue standard monitoring.');

    setRecommendations(recs);
  };

  /* ── Predict handler ───────────────── */
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

    if (
      isNaN(pa) ||
      isNaN(pt) ||
      isNaN(pahead) ||
      isNaN(pined) ||
      !gender ||
      !occupancy ||
      !referralSource
    ) {
      setError('Please fill all required fields with valid values.');
      setIsLoading(false);
      return;
    }

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(apiInput),
      });

      if (!resp.ok) {
        let msg = `API Error: ${resp.status} ${resp.statusText}`;
        try {
          const j = await resp.json();
          msg = j.error || j.detail || msg;
        } catch {}
        throw new Error(msg);
      }

      const results: PredictionResult = await resp.json();
      setPredictions(results);
      generateRecommendations(results);
    } catch (err) {
      console.error('API call failed:', err);
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Reset handler ─────────────────── */
  const handleReset = () => {
    setAge('');
    setDateTime(new Date());
    setGender('');
    setOccupancy('');
    setReferralSource('');
    setTriageCode('');
    setPatientsAhead('');
    setPatientsInED('');
    setAlteredMentalStatus(false);
    setIsAccident(false);
    setHasFever(false);
    setPredictions(null);
    setRecommendations(null);
    setError(null);
    setIsLoading(false);
    setIsCalendarOpen(false);
  };

  /* ── Click‑outside for popover ─────── */
  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node))
        setIsCalendarOpen(false);
    };
    if (isCalendarOpen) document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [isCalendarOpen]);

  /* ── Simple change handlers ─────────── */
  const handleAgeChange = (e: ChangeEvent<HTMLInputElement>) =>
    setAge(e.target.value);
  const handlePatientsAheadChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPatientsAhead(e.target.value);
  const handlePatientsInEDChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPatientsInED(e.target.value);

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const d = parse(e.target.value, 'yyyy-MM-dd', dateTime);
    if (isValid(d)) {
      const cur = dateTime;
      const updated = setMilliseconds(
        setSeconds(setMinutes(setHours(d, cur.getHours()), cur.getMinutes()), cur.getSeconds()),
        cur.getMilliseconds()
      );
      setDateTime(updated);
    }
  };
  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':').map((v) => parseInt(v, 10));
    if (!isNaN(h) && !isNaN(m)) setDateTime(setMinutes(setHours(dateTime, h), m));
  };

  const handleGenderChange = (v: string) => setGender(v);
  const handleOccupancyChange = (v: string) => setOccupancy(v);
  const handleReferralChange = (v: string) => setReferralSource(v);
  const handleTriageChange = (v: string) => setTriageCode(v);
  const toggleCalendar = () => setIsCalendarOpen((o) => !o);
  const handleAlteredMentalChange = (c: boolean) => setAlteredMentalStatus(c);
  const handleAccidentChange = (c: boolean) => setIsAccident(c);
  const handleFeverChange = (c: boolean) => setHasFever(c);

  // ─────────────────────────────────────
  //  JSX Render
  // ─────────────────────────────────────
  return (
    <div className="p-4 md:p-6 w-full bg-stone-50 text-stone-900">
      {/* Header */}
      <div className="pt-8 flex flex-col items-center">
        <div className="flex items-center justify-center gap-4">
          <img src="/MetrixAI.png" alt="MetrixAI" className="h-10" />
          <h1 className="text-xl font-semibold text-center text-stone-900">
            Predictive Insights from Metrix
          </h1>
        </div>
        <p className="text-center mt-4 text-xs text-stone-500 max-w-lg">
          Whilst this has been trained algorithmically on real data specific to NZ hospitals, this should not replace clinical judgement and must be used cautiously.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 border border-red-300 bg-red-100 rounded-md flex items-center text-sm text-red-700"
        >
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* ── Left column – Form ─────────────── */}
        <div className="w-full lg:w-2/5 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Enter Patient Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePredict} className="space-y-4">
                {/* Age */}
                <div>
                  <Label htmlFor="age">Patient Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    placeholder="e.g. 52"
                    value={age}
                    onChange={handleAgeChange}
                    required
                  />
                </div>

                {/* Date & Time */}
                <div ref={popoverRef}>
                  <Label htmlFor="datetime-trigger">Date & Time of Arrival</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger onClick={toggleCalendar}>
                      <Button
                        id="datetime-trigger"
                        variant="outline"
                        className="w-full text-left font-normal"
                        aria-haspopup="dialog"
                        aria-expanded={isCalendarOpen}
                      >
                        <Clock className="mr-2 h-4 w-4 text-stone-500 shrink-0" />
                        <span className="flex-grow">
                          {dateTime && isValid(dateTime) ? (
                            <span className="text-stone-900">
                              {format(dateTime, 'PPP HH:mm')}
                            </span>
                          ) : (
                            'Pick date & time'
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    {isCalendarOpen && (
                      <PopoverContent className="space-y-3">
                        <div>
                          <Label htmlFor="date-input" className="text-xs font-medium">
                            Date
                          </Label>
                          <Input
                            id="date-input"
                            type="date"
                            className="h-9 text-sm"
                            value={
                              dateTime && isValid(dateTime)
                                ? format(dateTime, 'yyyy-MM-dd')
                                : ''
                            }
                            onChange={handleDateChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="time-input" className="text-xs font-medium">
                            Time
                          </Label>
                          <Input
                            id="time-input"
                            type="time"
                            className="h-9 text-sm"
                            value={
                              dateTime && isValid(dateTime)
                                ? format(dateTime, 'HH:mm')
                                : ''
                            }
                            onChange={handleTimeChange}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCalendarOpen(false)}
                          className="w-full h-8 text-xs"
                        >
                          Done
                        </Button>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>

                {/* Gender */}
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    id="gender"
                    value={gender}
                    onValueChange={handleGenderChange}
                    placeholder="Select gender"
                    required
                  >
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </Select>
                </div>

                {/* Occupancy */}
                <div>
                  <Label htmlFor="occupancy">ED Occupancy Level (Context)</Label>
                  <Select
                    id="occupancy"
                    value={occupancy}
                    onValueChange={handleOccupancyChange}
                    placeholder="Select occupancy"
                    required
                  >
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </Select>
                </div>

                {/* Referral source */}
                <div>
                  <Label htmlFor="referral">Source of Referral</Label>
                  <Select
                    id="referral"
                    value={referralSource}
                    onValueChange={handleReferralChange}
                    placeholder="Select source"
                    required
                  >
                    <SelectItem value="gp">GP</SelectItem>
                    <SelectItem value="self">Self‑referral</SelectItem>
                    <SelectItem value="ambulance">Ambulance</SelectItem>
                    <SelectItem value="clinic">Other Clinic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </Select>
                </div>

                {/* Triage */}
                <div>
                  <Label htmlFor="triage">Triage Code</Label>
                  <Select
                    id="triage"
                    value={triageCode}
                    onValueChange={handleTriageChange}
                    placeholder="Select triage"
                    required
                  >
                    <SelectItem value="1">1 – Immediate threat</SelectItem>
                    <SelectItem value="2">2 – 10 mins</SelectItem>
                    <SelectItem value="3">3 – 30 mins</SelectItem>
                    <SelectItem value="4">4 – 60 mins</SelectItem>
                    <SelectItem value="5">5 – 120 mins</SelectItem>
                  </Select>
                </div>

                {/* Patient counts */}
                <div>
                  <Label htmlFor="patientsInED">Patients Currently in ED</Label>
                  <Input
                    id="patientsInED"
                    type="number"
                    min="0"
                    placeholder="e.g. 25"
                    value={patientsInED}
                    onChange={handlePatientsInEDChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patientsAhead">Patients Ahead in Queue</Label>
                  <Input
                    id="patientsAhead"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={patientsAhead}
                    onChange={handlePatientsAheadChange}
                    required
                  />
                </div>

                {/* Flags */}
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="alteredMentalStatus" className="mb-0">
                    Altered Mental Status
                  </Label>
                  <SwitchMock
                    id="alteredMentalStatus"
                    checked={alteredMentalStatus}
                    onCheckedChange={handleAlteredMentalChange}
                    aria-label="Altered mental status"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="isAccident" className="mb-0">
                    Accident Related
                  </Label>
                  <SwitchMock
                    id="isAccident"
                    checked={isAccident}
                    onCheckedChange={handleAccidentChange}
                    aria-label="Accident related"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="hasFever" className="mb-0">
                    Fever Present
                  </Label>
                  <SwitchMock
                    id="hasFever"
                    checked={hasFever}
                    onCheckedChange={handleFeverChange}
                    aria-label="Fever present"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Predicting…
                      </>
                    ) : (
                      'Predict Wait Time'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column – Results ────────── */}
        <div className="flex-1 lg:pl-8">
          {/* Loading skeletons */}
          {isLoading && (
            <div className="mt-6 space-y-6" aria-live="polite" aria-busy="true">
              {/* Headline skeleton */}
              <div className="h-5 bg-stone-300 rounded w-48 mb-4 animate-pulse" />
              {/* Two big cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[...Array(2)].map((_, i) => (
                  <Card key={`skel-main-${i}`} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-stone-300 rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-stone-300 rounded w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Breach headline */}
              <div className="h-5 bg-stone-300 rounded w-40 mb-4 animate-pulse" />
              {/* Four breach cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={`skel-breach-${i}`} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-stone-300 rounded w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-6 bg-stone-300 rounded w-1/3 mb-2" />
                      <div className="h-2 bg-stone-300 rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Recommendations headline */}
              <div className="h-5 bg-stone-300 rounded w-32 mb-4 animate-pulse" />
              {/* Recommendations card */}
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-stone-300 rounded w-1/4" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-3 bg-stone-300 rounded w-full" />
                  <div className="h-3 bg-stone-300 rounded w-5/6" />
                  <div className="h-3 bg-stone-300 rounded w-3/4" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          {!isLoading && predictions && (
            <div className="mt-6 lg:mt-0 space-y-8" aria-live="polite">
              {/* Top results */}
              <div>
                <h2 className="text-lg font-semibold text-stone-700 mb-4">
                  Prediction Results
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Admission */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Admission Likelihood</span>
                        <LogIn className="h-5 w-5 text-[#2D4F6C]" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold text-stone-800">
                        {predictions.admissionLikelihood.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  {/* Wait time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Predicted Wait Time</span>
                        <Hourglass className="h-5 w-5 text-[#68A9A9]" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold text-stone-800">
                        ≈ {predictions.predictedWaitMinutes}{' '}
                        <span className="text-lg font-medium text-stone-500">
                          mins
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Breach likelihood */}
              <div>
                <h3 className="text-md font-semibold text-stone-700 mb-3 mt-6">
                  Breach Likelihood
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { hours: 3, likelihood: predictions.wait3h },
                    { hours: 4, likelihood: predictions.wait4h },
                    { hours: 5, likelihood: predictions.wait5h },
                    { hours: 6, likelihood: predictions.wait6h },
                  ].map((pred) => {
                    const { text, color, bgColor, Icon } = formatLikelihood(
                      pred.likelihood
                    );
                    return (
                      <Card key={pred.hours}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>&gt; {pred.hours} h Wait</span>
                            <Icon className={cn('h-5 w-5', color)} />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className={cn('text-xl font-semibold', color)}>
                              {text}
                            </span>
                            <span className="text-base font-medium text-stone-500">
                              {pred.likelihood.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={pred.likelihood} colorClass={bgColor} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              {recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-[#3D7F80]" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-stone-600">
                      {recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !predictions && !error && (
            <Card className="mt-6 lg:mt-0">
              <CardHeader>
                <CardTitle className="text-center">Prediction Results Area</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-stone-500 space-y-6 px-5 pb-5">
                <ClipboardList className="mx-auto h-16 w-16 text-stone-300" />
                <p className="text-sm">
                  Fill the form on the left and click &ldquo;Predict Wait Time&rdquo; to
                  display results here.
                </p>

                {/* Example output */}
                <div className="space-y-4 opacity-60 px-6 pb-4 pt-2 border-t border-stone-100">
                  <h3 className="text-sm font-semibold text-stone-600 mt-4">
                    Example Output Format
                  </h3>
                  {/* Admission + Wait skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {['Admission Likelihood', 'Predicted Wait Time'].map((t) => (
                      <Card
                        key={t}
                        className="bg-stone-50 border border-[#3D7F80] shadow-none"
                      >
                        <CardHeader>
                          <CardTitle className="text-sm text-stone-600 flex items-center justify-between">
                            <span>{t}</span>
                            {t === 'Admission Likelihood' ? (
                              <LogIn className="h-4 w-4 text-stone-400" />
                            ) : (
                              <Hourglass className="h-4 w-4 text-stone-400" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold text-stone-400">-- %</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {/* Breach skeletons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['> 4 h Wait', '> 6 h Wait'].map((t) => (
                      <Card
                        key={t}
                        className="bg-stone-50 border border-[#3D7F80] shadow-none"
                      >
                        <CardHeader>
                          <CardTitle className="text-sm text-stone-600 flex items-center justify-between">
                            <span>{t}</span>
                            <Clock className="h-4 w-4 text-stone-400" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-lg font-semibold text-stone-400">
                              --
                            </span>
                            <span className="text-sm font-medium text-stone-400">
                              -- %
                            </span>
                          </div>
                          <Progress value={0} colorClass="bg-stone-300" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsPage;

import React, {
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
  ChevronDown, // Added for select dropdown indicator
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
//  ENV-DRIVEN BACKEND URL
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
  color: string; // Text color class
  bgColor: string; // Background color class (for progress bar)
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
  return 0; // Default or handle invalid age
};

// ─────────────────────────────────────────────
//  UI Primitives - THEMED
// ─────────────────────────────────────────────

/**
 * Utility function to concatenate Tailwind classes conditionally.
 * @param classes - Array of class names (strings, undefined, null, false).
 * @returns A string of space-separated class names.
 */
const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

/* ── Button ───────────────────────────── */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'; // Updated variants
  size?: 'sm' | 'default' | 'lg'; // Added more sizes potentially
  children: ReactNode;
};

const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  ...props
}) => {
  // Base styles for all buttons
  const base =
    'inline-flex items-center justify-center rounded-lg text-sm font-semibold shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed';

  // Size specific styles
  const sizeCls = {
    sm: 'px-3 py-1.5 text-xs', // Adjusted for smaller size
    default: 'px-5 py-2.5 text-sm', // Matches target theme primary button
    lg: 'px-6 py-3 text-base',
  }[size];

  // Variant specific styles - Matching target theme
  const variants = {
    primary:
      'text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700',
    secondary:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost:
      'p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 shadow-none', // Adjusted ghost style
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
    // Matches target theme input style (rounded-lg, gray border, teal focus ring)
    className="block w-full rounded-lg border border-gray-300 py-2 px-4 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-base"
    {...props}
  />
));
Input.displayName = 'Input';

/* ── Label ─────────────────────────────── */
const Label: FC<React.LabelHTMLAttributes<HTMLLabelElement>> = (props) => (
  // Use gray text color
  <label className="block text-sm font-medium text-gray-700 mb-1" {...props} />
);

/* ── Select & SelectItem ───────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  value: string;
  onValueChange: (v: string) => void; // Changed prop name for clarity
  placeholder?: string;
  children: ReactNode;
}

const Select: FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder,
  required,
  id,
  children,
  className,
  ...props
}) => {
  // Find the display text for the selected option
  const opts = Children.toArray(children).filter(
    (c): c is ReactElement<{ value: string; children: ReactNode }> => isValidElement(c) && typeof c.props.value === 'string'
  );
  const selectedOpt = opts.find((o) => o.props.value === value);
  const displayValue = selectedOpt?.props?.children ?? placeholder ?? '';

  return (
    <div className="relative w-full">
      {/* Visually hidden actual select element for accessibility and form submission */}
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label={placeholder || id}
        {...props} // Spread remaining props like disabled
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>

      {/* Styled button that looks like a select */}
      <Button
        type="button" // Prevent form submission
        variant="secondary" // Use secondary style for select appearance
        className={cn("w-full justify-between text-left font-normal", className)} // Ensure full width and left align text
        aria-hidden="true" // Hide from accessibility tree as the actual select handles it
        tabIndex={-1} // Make it non-focusable
        disabled={props.disabled} // Pass disabled state
      >
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayValue}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
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
// Card styles match target theme (rounded-xl, white bg, gray border, shadow)
const Card: FC<CardProps> = ({ children, className }) => (
  <div className={cn('rounded-xl border border-gray-200 bg-white shadow-md', className)}>
    {children}
  </div>
);
const CardHeader: FC<CardProps> = ({ children, className }) => (
  <div className={cn('flex items-center justify-between p-5 border-b border-gray-100', className)}> {/* Added subtle border */}
    {children}
  </div>
);
const CardTitle: FC<CardProps> = ({ children }) => (
  <h3 className="text-base font-semibold text-gray-800">{children}</h3> // Adjusted text color
);
const CardContent: FC<CardProps> = ({ children, className }) => (
  <div className={cn('p-5', className)}> {/* Removed pt-0 to be consistent */}
    {children}
  </div>
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
    // Themed popover content (rounded, white bg, gray border, shadow)
    className={cn(
      'absolute mt-1 p-4 border border-gray-200 rounded-lg bg-white shadow-lg z-50',
      className
    )}
  >
    {children}
  </div>
);

/* ── Progress ──────────────────────────── */
const Progress: FC<{ value?: number | null; colorClass?: string }> = ({
  value,
  colorClass = 'bg-teal-600', // Default to teal
}) => (
  <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden"> {/* Gray background */}
    <div
      className={cn(colorClass, 'h-full transition-transform ease-out duration-500 rounded-full')} // Added rounded-full to inner bar
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

/* ── Switch ────────────────────────────── */
interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-label'?: string;
}
const Switch: FC<SwitchProps> = ({ // Renamed from SwitchMock
  id,
  checked,
  onCheckedChange,
  'aria-label': ariaLabel,
}) => {
  // Use teal for active state, gray for inactive
  const bg = checked ? 'bg-teal-600' : 'bg-gray-300';
  const pos = checked ? 'translate-x-5' : 'translate-x-0';
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      // Themed switch styles (rounded-full, teal focus ring)
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500',
        bg
      )}
    >
      <span
        aria-hidden="true"
        // White knob, transitions position
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
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
  // Uses standard risk colors (Red, Orange, Yellow, Green) for clarity
  const formatLikelihood = (p: number): LikelihoodFormat => {
    if (p > 75)
      return {
        text: 'Very High',
        color: 'text-red-700', // Text color
        bgColor: 'bg-red-500', // Progress bar color
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
      color: 'text-green-700', // Use green for low risk
      bgColor: 'bg-green-500',
      Icon: CheckCircle,
    };
  };

  /* ── Recommendations helper ────────── */
  const generateRecommendations = (r: PredictionResult) => {
    const recs: string[] = [];
    const avg = (r.wait3h + r.wait4h + r.wait5h + r.wait6h) / 4;

    if (r.wait6h > 70 || r.wait5h > 80)
      recs.push('High risk of extended wait (>5‑6 h). Consider senior staff alert.');
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
        `Predicted wait ≈ ${Math.round(r.predictedWaitMinutes / 60)} h. Ensure comfort/re‑assessment.`
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

    // --- Input Validation ---
    const pa = parseInt(age, 10);
    const pt = parseInt(triageCode, 10);
    const pahead = parseInt(patientsAhead, 10);
    const pined = parseInt(patientsInED, 10);

    if (
      isNaN(pa) || pa < 0 || // Basic age validation
      isNaN(pt) || pt < 1 || pt > 5 || // Triage code validation
      isNaN(pahead) || pahead < 0 ||
      isNaN(pined) || pined < 0 ||
      !gender ||
      !occupancy ||
      !referralSource ||
      !isValid(dateTime) // Check if date is valid
    ) {
      setError('Please fill all required fields with valid values.');
      setIsLoading(false);
      return;
    }

    // --- Prepare API Input ---
    const apiInput: ApiPredictionInput = {
      age: encodeAgeOrdinal(pa),
      gender,
      patientsInED: pined,
      patientsAhead: pahead,
      dateTime: dateTime.toISOString(), // Send ISO string
      triageCode: pt,
      referralSource,
      isAccident,
      hasFever,
      alteredMentalStatus,
      occupancy,
    };

    // --- API Call ---
    try {
      console.log("Sending to API:", apiInput); // Log input for debugging
      const resp = await fetch(PREDICTIVE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(apiInput),
      });

      if (!resp.ok) {
        let msg = `API Error: ${resp.status} ${resp.statusText}`;
        try {
          const j = await resp.json();
          msg = j.error || j.detail || msg; // Try to get more specific error
        } catch { /* Ignore if response is not JSON */ }
        throw new Error(msg);
      }

      const results: PredictionResult = await resp.json();
      console.log("Received from API:", results); // Log results for debugging
      setPredictions(results);
      generateRecommendations(results);
    } catch (err) {
      console.error('API call failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while fetching predictions.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Reset handler ─────────────────── */
  const handleReset = () => {
    setAge('');
    setDateTime(new Date()); // Reset to current time
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

  /* ── Click-outside for popover ─────── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  /* ── Simple change handlers ─────────── */
  const handleAgeChange = (e: ChangeEvent<HTMLInputElement>) => setAge(e.target.value);
  const handlePatientsAheadChange = (e: ChangeEvent<HTMLInputElement>) => setPatientsAhead(e.target.value);
  const handlePatientsInEDChange = (e: ChangeEvent<HTMLInputElement>) => setPatientsInED(e.target.value);

  // Combined Date/Time Handlers
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newDate = parse(e.target.value, 'yyyy-MM-dd', new Date()); // Use current date as base
    if (isValid(newDate)) {
      const currentHours = dateTime.getHours();
      const currentMinutes = dateTime.getMinutes();
      const updated = setMinutes(setHours(newDate, currentHours), currentMinutes);
      setDateTime(updated);
    }
  };
  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':').map((v) => parseInt(v, 10));
    if (!isNaN(h) && h >= 0 && h < 24 && !isNaN(m) && m >= 0 && m < 60) {
      const updated = setMinutes(setHours(dateTime, h), m);
      setDateTime(updated);
    }
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
  //  JSX Render
  // ─────────────────────────────────────
  return (
    // Apply the themed background gradient and base text color
    <div className="p-4 md:p-8 lg:p-12 min-h-screen w-full bg-gradient-to-b from-white via-teal-50 to-white text-gray-900">

      {/* Header - Centered Logo and Title - UPDATED STYLES */}
      <div className="mb-8 flex flex-col items-center text-center">
        <img
          src="/MetrixAI.png" // Ensure this path is correct
          alt="Metrix Logo"
          width={64} // Set explicit width
          height={64} // Set explicit height
          // Match logo dimensions from Diagnostic Assistance page (Stage 1)
          className="h-16 w-16 sm:h-20 sm:w-20 mb-3" // Tailwind classes control visual size
        />
        <h1
          // Match title size/font/color from Diagnostic Assistance page (Stage 1)
          className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2"
        >
          Predictive Insights
        </h1>
         <p
           // Match subtitle size/font/color from Diagnostic Assistance page (Stage 1)
           className="text-lg text-gray-700 max-w-xl text-center mt-2"
         >
           Estimate ED wait times and admission likelihood based on patient details.
         </p>
        {/* Disclaimer - Styling remains consistent */}
        <p className="text-center mt-4 text-xs text-gray-500 max-w-lg leading-relaxed">
          <strong>Disclaimer:</strong> Whilst this has been trained algorithmically on real data specific to NZ hospitals, this should not replace clinical judgement and must be used cautiously.
        </p>
      </div>

      {/* Error banner - Standard red alert style */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 border border-red-300 bg-red-100 rounded-lg flex items-start text-sm text-red-800 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-600" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-700 hover:text-red-900">&times;</button>
        </div>
      )}

      {/* Main Content Area - Form and Results */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Left column – Form ─────────────── */}
        <div className="w-full lg:w-2/5 xl:w-1/3 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Enter Patient & Context Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePredict} className="space-y-5"> {/* Increased spacing */}
                {/* Age */}
                <div>
                  <Label htmlFor="age">Patient Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    placeholder="e.g. 52"
                    value={age}
                    onChange={handleAgeChange}
                    required
                  />
                </div>

                {/* Date & Time */}
                <div ref={popoverRef}>
                  <Label htmlFor="datetime-trigger">Date & Time of Arrival *</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger onClick={toggleCalendar}>
                      {/* Button styled like an input/select */}
                      <button
                        id="datetime-trigger"
                        type="button"
                        className="flex items-center justify-between w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-left font-normal shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                        aria-haspopup="dialog"
                        aria-expanded={isCalendarOpen}
                      >
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                          <span className={dateTime && isValid(dateTime) ? 'text-gray-900' : 'text-gray-400'}>
                            {dateTime && isValid(dateTime)
                              ? format(dateTime, 'PPP HH:mm') // e.g., Apr 18, 2025 00:51
                              : 'Pick date & time'}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
                      </button>
                    </PopoverTrigger>
                    {isCalendarOpen && (
                      <PopoverContent className="w-auto space-y-3"> {/* Allow auto width */}
                        <div>
                          <Label htmlFor="date-input" className="text-xs font-medium">Date</Label>
                          <Input
                            id="date-input"
                            type="date"
                            className="h-9 text-sm" // Smaller input in popover
                            value={dateTime && isValid(dateTime) ? format(dateTime, 'yyyy-MM-dd') : ''}
                            onChange={handleDateChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="time-input" className="text-xs font-medium">Time</Label>
                          <Input
                            id="time-input"
                            type="time"
                            className="h-9 text-sm"
                            value={dateTime && isValid(dateTime) ? format(dateTime, 'HH:mm') : ''}
                            onChange={handleTimeChange}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="secondary" // Use secondary for Done button
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
                  <Label htmlFor="gender">Gender *</Label>
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
                  <Label htmlFor="occupancy">ED Occupancy Level *</Label>
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
                  <Label htmlFor="referral">Source of Referral *</Label>
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
                  <Label htmlFor="triage">Triage Code *</Label>
                  <Select
                    id="triage"
                    value={triageCode}
                    onValueChange={handleTriageChange}
                    placeholder="Select triage code"
                    required
                  >
                    <SelectItem value="1">1 – Immediate threat</SelectItem>
                    <SelectItem value="2">2 – Imminent threat (10 mins)</SelectItem>
                    <SelectItem value="3">3 – Potential threat (30 mins)</SelectItem>
                    <SelectItem value="4">4 – Potential issue (60 mins)</SelectItem>
                    <SelectItem value="5">5 – Less urgent (120 mins)</SelectItem>
                  </Select>
                </div>

                {/* Patient counts */}
                <div>
                  <Label htmlFor="patientsInED">Patients Currently in ED *</Label>
                  <Input
                    id="patientsInED"
                    type="number"
                    min="0"
                    placeholder="e.g. 25"
                    value={patientsInED}
                    onChange={handlePatientsInEDChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patientsAhead">Patients Ahead in Queue *</Label>
                  <Input
                    id="patientsAhead"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={patientsAhead}
                    onChange={handlePatientsAheadChange}
                    required
                  />
                </div>

                {/* Flags (Switches) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alteredMentalStatus" className="mb-0 flex-1 mr-4">
                      Altered Mental Status
                    </Label>
                    <Switch
                      id="alteredMentalStatus"
                      checked={alteredMentalStatus}
                      onCheckedChange={handleAlteredMentalChange}
                      aria-label="Altered mental status"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isAccident" className="mb-0 flex-1 mr-4">
                      Accident Related
                    </Label>
                    <Switch
                      id="isAccident"
                      checked={isAccident}
                      onCheckedChange={handleAccidentChange}
                      aria-label="Accident related"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hasFever" className="mb-0 flex-1 mr-4">
                      Fever Present
                    </Label>
                    <Switch
                      id="hasFever"
                      checked={hasFever}
                      onCheckedChange={handleFeverChange}
                      aria-label="Fever present"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <Button type="submit" disabled={isLoading} variant="primary">
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
                    variant="secondary"
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

        {/* ── Right column – Results ────────── */}
        <div className="flex-1">
          {/* Loading skeletons */}
          {isLoading && (
            <div className="space-y-6" aria-live="polite" aria-busy="true">
              {/* Headline skeleton */}
              <div className="h-6 bg-gray-300 rounded w-48 mb-4 animate-pulse" />
              {/* Two big cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                {[...Array(2)].map((_, i) => (
                  <Card key={`skel-main-${i}`} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-300 rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-300 rounded w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Breach headline */}
              <div className="h-5 bg-gray-300 rounded w-40 mb-4 animate-pulse" />
              {/* Four breach cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={`skel-breach-${i}`} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-300 rounded w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-6 bg-gray-300 rounded w-1/3 mb-2" />
                      <div className="h-2 bg-gray-200 rounded w-full" /> {/* Lighter background for progress */}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Recommendations headline */}
              <div className="h-5 bg-gray-300 rounded w-32 mb-4 animate-pulse" />
              {/* Recommendations card */}
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-300 rounded w-1/4" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-full" />
                  <div className="h-3 bg-gray-300 rounded w-5/6" />
                  <div className="h-3 bg-gray-300 rounded w-3/4" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Display */}
          {!isLoading && predictions && (
            <div className="space-y-8" aria-live="polite">
              {/* Top results */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Prediction Results
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  {/* Admission */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between w-full">
                        <span>Admission Likelihood</span>
                        <LogIn className="h-5 w-5 text-teal-700" /> {/* Themed icon color */}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold text-gray-800">
                        {predictions.admissionLikelihood.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  {/* Wait time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between w-full">
                        <span>Predicted Wait Time</span>
                        <Hourglass className="h-5 w-5 text-teal-600" /> {/* Themed icon color */}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold text-gray-800">
                        ≈ {predictions.predictedWaitMinutes.toFixed(0)}{' '} {/* No decimal for minutes */}
                        <span className="text-lg font-medium text-gray-500">
                          mins
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Breach likelihood */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">
                  Wait Time Breach Likelihood
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                          <CardTitle className="flex items-center justify-between w-full">
                            <span>&gt; {pred.hours} Hours Wait</span>
                            <Icon className={cn('h-5 w-5', color)} /> {/* Use dynamic icon and color */}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className={cn('text-xl font-semibold', color)}>
                              {text}
                            </span>
                            <span className="text-base font-medium text-gray-600">
                              {pred.likelihood.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={pred.likelihood} colorClass={bgColor} /> {/* Use dynamic progress color */}
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
                      <Lightbulb className="h-5 w-5 mr-2 text-teal-600" /> {/* Themed icon */}
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700"> {/* Adjusted text color */}
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
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="mx-auto">Prediction Results Area</CardTitle> {/* Center title */}
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6 px-5 pb-8 pt-6"> {/* Added padding */}
                <ClipboardList className="mx-auto h-16 w-16 text-gray-300" /> {/* Gray icon */}
                <p className="text-sm text-gray-500 max-w-xs">
                  Fill the form on the left and click &ldquo;Predict Wait Time&rdquo; to
                  display estimated wait times and recommendations here.
                </p>

                {/* Example output - simplified and themed */}
                <div className="w-full max-w-md space-y-4 opacity-70 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Example Output Format
                  </h3>
                  {/* Admission + Wait skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Admission Likelihood', 'Predicted Wait Time'].map((t) => (
                      <div key={t} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-medium text-gray-500">{t}</span>
                           {t === 'Admission Likelihood' ? (
                             <LogIn className="h-4 w-4 text-gray-400" />
                           ) : (
                             <Hourglass className="h-4 w-4 text-gray-400" />
                           )}
                        </div>
                        <p className="text-xl font-semibold text-gray-400">-- %</p>
                      </div>
                    ))}
                  </div>
                   {/* Breach skeletons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['> 4 h Wait', '> 6 h Wait'].map((t) => (
                       <div key={t} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-medium text-gray-500">{t}</span>
                           <Clock className="h-4 w-4 text-gray-400" />
                         </div>
                         <div className="flex justify-between items-baseline mb-1">
                            <span className="text-lg font-semibold text-gray-400">--</span>
                            <span className="text-sm font-medium text-gray-400">-- %</span>
                          </div>
                         <Progress value={0} colorClass="bg-gray-300" />
                       </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div> {/* End Right Column */}
      </div> {/* End Main Content Area */}
    </div> // End Page Container
  );
};

export default PredictiveAnalyticsPage;

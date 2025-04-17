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

// === ENV‑DRIVEN BACKEND URL ===
const PREDICTIVE_API_URL =
  process.env.NEXT_PUBLIC_PREDICTIVE_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000/predictive/api/predict'
    : 'https://fastapiplatformclean-10.onrender.com/predictive/api/predict');

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
  return classes.filter(Boolean).join(' ');
}

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
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50';
  const sizeClasses = size === 'sm' ? 'h-9 px-3' : 'h-10 px-4 py-2';
  const variants = {
    default:
      'bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80] text-white hover:from-[#254058] hover:to-[#316667]',
    outline:
      'border border-[#3D7F80] bg-white text-stone-700 hover:bg-stone-100',
  };
  return (
    <button
      className={cn(baseClasses, sizeClasses, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input
    ref={ref}
    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[#3D7F80]"
    {...props}
  />
));
Input.displayName = 'Input';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}
const Label: FC<LabelProps> = (props) => (
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
    ? Children.toArray(sel.props.children).join('')
    : placeholder;
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

interface SelectItemProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: ReactNode;
}
const SelectItem: FC<SelectItemProps> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);

interface CardProps {
  children: ReactNode;
  className?: string;
}
const Card: FC<CardProps> = ({ children, className }) => (
  <div className={cn('rounded-xl border bg-white shadow-md', className)}>
    {children}
  </div>
);

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}
const CardHeader: FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn('flex items-center justify-between p-5', className)}>
    {children}
  </div>
);

interface CardTitleProps {
  children: ReactNode;
}
const CardTitle: FC<CardTitleProps> = ({ children }) => (
  <h3 className="text-base font-semibold">{children}</h3>
);

interface CardContentProps {
  children: ReactNode;
  className?: string;
}
const CardContent: FC<CardContentProps> = ({ children, className }) => (
  <div className={cn('p-5 pt-0', className)}>{children}</div>
);

interface PopoverProps {
  children: ReactNode;
}
const Popover: FC<PopoverProps> = ({ children }) => (
  <div className="relative">{children}</div>
);

interface PopoverTriggerProps {
  onClick?: () => void;
  children: ReactNode;
}
const PopoverTrigger: FC<PopoverTriggerProps> = ({ onClick, children }) => (
  <div onClick={onClick}>{children}</div>
);

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
}
const PopoverContent: FC<PopoverContentProps> = ({
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

interface ProgressProps {
  value?: number | null;
  colorClass?: string;
}
const Progress: FC<ProgressProps> = ({ value, colorClass = 'bg-[#3D7F80]' }) => (
  <div className="relative h-2 w-full bg-stone-200 rounded-full overflow-hidden">
    <div
      className={`${colorClass} h-full transition-transform ease-out duration-500`}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-label'?: string;
}
const SwitchMock: FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  'aria-label': ariaLabel,
}) => {
  const bgColor = checked ? 'bg-[#3D7F80]' : 'bg-stone-300';
  const togglePosition = checked ? 'translate-x-5' : 'translate-x-0';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 rounded-full transition-colors focus:ring-2 focus:ring-[#3D7F80]',
        bgColor
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
          togglePosition
        )}
      />
    </button>
  );
};

// =============== Main Component ===============
const PredictiveAnalyticsPage: FC = () => {
  // --- State Variables ---
  const [age, setAge] = useState<string>('');
  const [dateTime, setDateTime] = useState<Date>(new Date());
  const [gender, setGender] = useState<string>('');
  const [occupancy, setOccupancy] = useState<string>('');
  const [referralSource, setReferralSource] = useState<string>('');
  const [triageCode, setTriageCode] = useState<string>('');
  const [patientsAhead, setPatientsAhead] = useState<string>('');
  const [patientsInED, setPatientsInED] = useState<string>('');
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

  // --- Format likelihood helper ---
  const formatLikelihood = (percentage: number): LikelihoodFormat => {
    if (percentage > 75)
      return {
        text: 'Very High',
        color: 'text-red-700',
        bgColor: 'bg-red-500',
        Icon: AlertCircle,
      };
    if (percentage > 50)
      return {
        text: 'High',
        color: 'text-orange-700',
        bgColor: 'bg-orange-500',
        Icon: AlertCircle,
      };
    if (percentage > 25)
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

  // --- Generate recommendations helper ---
  const generateRecommendations = (results: PredictionResult) => {
    const recs: string[] = [];
    const avgLikelihood =
      (results.wait3h +
        results.wait4h +
        results.wait5h +
        results.wait6h) /
      4;

    if (results.wait6h > 70 || results.wait5h > 80) {
      recs.push('High risk of extended wait (>5-6h). Consider senior staff alert.');
    } else if (avgLikelihood > 50) {
      recs.push('Moderate to high likelihood of long wait. Review ED flow.');
    }

    if (avgLikelihood > 40) {
      recs.push('Inform patient/family about potential significant wait.');
    }

    const currentTriageCode = parseInt(triageCode, 10);
    if (!isNaN(currentTriageCode) && (currentTriageCode === 1 || currentTriageCode === 2)) {
      recs.push(
        `High triage acuity (Code ${currentTriageCode}). Ensure prompt assessment.`
      );
    }

    if (occupancy === 'critical' || occupancy === 'high') {
      recs.push(`ED occupancy is ${occupancy}. Expedite discharges.`);
    }

    if (alteredMentalStatus) {
      recs.push('Note: Altered mental status present.');
    }
    if (hasFever) {
      recs.push('Note: Fever present.');
    }

    if (results.admissionLikelihood > 70) {
      recs.push(
        'High admission likelihood. Consider early inpatient notification.'
      );
    }

    if (results.predictedWaitMinutes > 240) {
      recs.push(
        `Predicted wait ~${Math.round(
          results.predictedWaitMinutes / 60
        )} hours. Ensure patient comfort/reassessment.`
      );
    }

    if (recs.length === 0) {
      recs.push(
        'Predicted wait times appear manageable. Continue standard monitoring.'
      );
    }

    setRecommendations(recs);
  };

  // --- API call handler ---
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

    // ... your existing validation logic (unchanged) ...

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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(apiInput),
      });

      if (!response.ok) {
        let errorDetail = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.detail || errorDetail;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(errorDetail);
      }

      const results: PredictionResult = await response.json();
      setPredictions(results);
      generateRecommendations(results);
    } catch (err) {
      console.error('API call failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Reset handler ---
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

  // --- Popover outside‑click logic ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // --- Simple handlers ---
  const handleAgeChange = (e: ChangeEvent<HTMLInputElement>) =>
    setAge(e.target.value);
  const handlePatientsAheadChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPatientsAhead(e.target.value);
  const handlePatientsInEDChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPatientsInED(e.target.value);

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    const newDate = parse(dateValue, 'yyyy-MM-dd', dateTime || new Date());
    if (isValid(newDate)) {
      const currentTime = dateTime || new Date();
      const updated = setMilliseconds(
        setSeconds(
          setMinutes(setHours(newDate, currentTime.getHours()), currentTime.getMinutes()),
          currentTime.getSeconds()
        ),
        currentTime.getMilliseconds()
      );
      setDateTime(updated);
    }
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [hoursStr, minutesStr] = e.target.value.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      setDateTime(setMinutes(setHours(dateTime, hours), minutes));
    }
  };

  const handleGenderChange = (value: string) => setGender(value);
  const handleOccupancyChange = (value: string) => setOccupancy(value);
  const handleReferralChange = (value: string) => setReferralSource(value);
  const handleTriageChange = (value: string) => setTriageCode(value);
  const toggleCalendar = () => setIsCalendarOpen(!isCalendarOpen);
  const handleAlteredMentalChange = (checked: boolean) =>
    setAlteredMentalStatus(checked);
  const handleAccidentChange = (checked: boolean) =>
    setIsAccident(checked);
  const handleFeverChange = (checked: boolean) => setHasFever(checked);

  // =============== JSX Rendering ===============
  return (
    <div className="p-4 md:p-6 w-full bg-stone-50 text-stone-900">
      {/* Header + Logo + Disclaimer */}
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

      {error && (
        <div
          className="mb-4 p-3 border border-red-300 bg-red-100 rounded-md flex items-center text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Left Column: The Form Card */}
        <div className="w-full lg:w-2/5 flex-shrink-0">
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
                    placeholder="e.g., 52"
                    value={age}
                    onChange={handleAgeChange}
                    required
                  />
                </div>

                {/* Date & Time */}
                <div ref={popoverRef}>
                  <Label htmlFor="datetime-trigger">
                    Date &amp; Time of Arrival
                  </Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger onClick={toggleCalendar}>
                      <Button
                        id="datetime-trigger"
                        variant="outline"
                        className="w-full text-left font-normal"
                        aria-haspopup="dialog"
                        aria-expanded={isCalendarOpen}
                      >
                        <Clock className="mr-2 h-4 w-4 text-stone-500 flex-shrink-0" />
                        <span className="flex-grow">
                          {dateTime && isValid(dateTime) ? (
                            <span className="text-stone-900">
                              {format(dateTime, 'PPP HH:mm')}
                            </span>
                          ) : (
                            <span>Pick date &amp; time</span>
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    {isCalendarOpen && (
                      <PopoverContent className="w-auto p-4 bg-white border-stone-200 space-y-3">
                        <div>
                          <Label
                            htmlFor="date-input"
                            className="text-xs font-medium text-stone-600"
                          >
                            Date
                          </Label>
                          <Input
                            id="date-input"
                            type="date"
                            className="h-9 text-sm bg-white border-stone-300"
                            value={
                              dateTime && isValid(dateTime)
                                ? format(dateTime, 'yyyy-MM-dd')
                                : ''
                            }
                            onChange={handleDateChange}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="time-input"
                            className="text-xs font-medium text-stone-600"
                          >
                            Time
                          </Label>
                          <Input
                            id="time-input"
                            type="time"
                            className="h-9 text-sm bg-white border-stone-300"
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
                          className="w-full h-8 text-xs border-stone-300"
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

                {/* Referral Source */}
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
                    <SelectItem value="self">Self-referral</SelectItem>
                    <SelectItem value="ambulance">Ambulance</SelectItem>
                    <SelectItem value="clinic">Other Clinic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </Select>
                </div>

                {/* Triage Code */}
                <div>
                  <Label htmlFor="triage">Triage Code</Label>
                  <Select
                    id="triage"
                    value={triageCode}
                    onValueChange={handleTriageChange}
                    placeholder="Select triage code"
                    required
                  >
                    <SelectItem value="1">
                      1 - Immediate threat (Immediate)
                    </SelectItem>
                    <SelectItem value="2">
                      2 - Imminent threat (10-mins)
                    </SelectItem>
                    <SelectItem value="3">
                      3 - Potentially life-threatening (30-mins)
                    </SelectItem>
                    <SelectItem value="4">
                      4 - Potentially serious (60-mins)
                    </SelectItem>
                    <SelectItem value="5">
                      5 - Less urgent (120-mins)
                    </SelectItem>
                  </Select>
                </div>

                {/* Patient counts */}
                <div>
                  <Label htmlFor="patientsInED">Patients Currently in ED</Label>
                  <Input
                    id="patientsInED"
                    type="number"
                    placeholder="e.g., 25"
                    value={patientsInED}
                    onChange={handlePatientsInEDChange}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patientsAhead">Patients Ahead in Queue</Label>
                  <Input
                    id="patientsAhead"
                    type="number"
                    placeholder="e.g., 5"
                    value={patientsAhead}
                    onChange={handlePatientsAheadChange}
                    min="0"
                    required
                  />
                </div>

                {/* Flags */}
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="alteredMentalStatus" className="mb-0 mr-4">
                    Altered Mental Status
                  </Label>
                  <SwitchMock
                    id="alteredMentalStatus"
                    checked={alteredMentalStatus}
                    onCheckedChange={handleAlteredMentalChange}
                    aria-label="Altered Mental Status"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="isAccident" className="mb-0 mr-4">
                    Accident Related
                  </Label>
                  <SwitchMock
                    id="isAccident"
                    checked={isAccident}
                    onCheckedChange={handleAccidentChange}
                    aria-label="Accident Related"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="hasFever" className="mb-0 mr-4">
                    Fever Present
                  </Label>
                  <SwitchMock
                    id="hasFever"
                    checked={hasFever}
                    onCheckedChange={handleFeverChange}
                    aria-label="Fever Present"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-start space-x-3 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Predicting...
                      </>
                    ) : (
                      'Predict Wait Time'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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

        {/* Right Column: Results */}
        <div className="flex-1 lg:pl-8">
          {isLoading && (
            <div className="mt-6 space-y-6" aria-live="polite" aria-busy="true">
              {/* Skeleton loaders… (unchanged) */}
            </div>
          )}

          {!isLoading && predictions && (
            <div className="mt-6 lg:mt-0 space-y-8" aria-live="polite">
              {/* Prediction Results UI… (unchanged) */}
            </div>
          )}

          {!isLoading && !predictions && !error && (
            <Card className="mt-6 lg:mt-0">
              <CardHeader>
                <CardTitle className="text-center">
                  Prediction Results Area
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center text-stone-500 space-y-6 px-5 pb-5">
                <ClipboardList
                  className="mx-auto h-16 w-16 text-stone-300"
                  strokeWidth={1}
                />
                <p className="text-sm">
                  Fill in the patient details on the left and click 'Predict Wait Time' to see the results displayed here.
                </p>
                {/* Example format card… (unchanged) */}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsPage;

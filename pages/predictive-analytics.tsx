// /pages/predictive-analytics.tsx

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  forwardRef,
  ReactNode,
  useRef,
} from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Lightbulb,
  RotateCcw,
  LogIn, // Represents admission
  Hourglass, // Represents wait time
  ClipboardList, // Placeholder Icon
} from 'lucide-react';
import {
  format,
  isValid,
  parse,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns'; // For handling dates and times

// =============== Type Definitions ===============

interface PredictionResult {
  wait3h: number; wait4h: number; wait5h: number; wait6h: number;
  admissionLikelihood: number; predictedWaitMinutes: number;
}
interface LikelihoodFormat {
  text: string; color: string; bgColor: string; Icon: React.ElementType;
}
interface ApiPredictionInput {
  age: number; gender: string; patientsInED: number; patientsAhead: number;
  dateTime: string; triageCode: number; referralSource: string; isAccident: boolean;
  hasFever: boolean; alteredMentalStatus: boolean; occupancy: string;
}

// =============== Helper UI / Mocked Components (Updated Theme) ===============
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'; children: ReactNode; className?: string; size?: 'sm';
}
const Button: React.FC<ButtonProps> = ({ children, variant = 'default', className = '', size, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D7F80] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const sizeClasses = size === 'sm' ? 'h-9 px-3' : 'h-10 px-4 py-2';
  // UPDATED: Modified the 'outline' variant definition
  const variants = {
    default: 'bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80] text-white hover:from-[#254058] hover:to-[#316667] shadow-md hover:shadow-lg ring-offset-stone-50',
    outline: 'border border-[#3D7F80] bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 ring-offset-stone-50', // Teal border for outline
  };
  const variantClass = variants[variant];
  // Apply passed className LAST to allow overrides if needed, though using variants is preferred
  return <button className={cn(baseClasses, sizeClasses, variantClass, className)} {...props}>{children}</button>;
};
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
// Input component now has permanent teal border
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} className="flex h-10 w-full rounded-md border border-[#3D7F80] bg-white px-3 py-2 text-sm text-stone-900 ring-offset-stone-50 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D7F80] focus-visible:ring-offset-stone-50 disabled:cursor-not-allowed disabled:opacity-50" {...props} />
));
Input.displayName = 'Input';
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
const Label: React.FC<LabelProps> = (props) => ( <label className="block text-sm font-medium text-stone-700 mb-1.5" {...props} /> );
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { value: string; onValueChange: (value: string) => void; placeholder?: string; children: ReactNode; id?: string; }
interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> { children: ReactNode; }
const Select: React.FC<SelectProps> = ({ children, value, onValueChange, placeholder, required, id }) => {
  const selectChildren = React.Children.toArray(children).filter((child): child is React.ReactElement<SelectItemProps> => React.isValidElement(child));
  const selectedChild = selectChildren.find(child => child.props.value === value);
  const getOptionText = (node: React.ReactNode): string => { if (typeof node === 'string') return node; if (Array.isArray(node)) return node.map(getOptionText).join(''); if (React.isValidElement(node) && node.props.children) return getOptionText(node.props.children); return ''; };
  const displayValue = selectedChild ? getOptionText(selectedChild.props.children) : placeholder;
  return (
    <div className="relative w-full">
      <select id={id} value={value} onChange={(e: ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)} required={required} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">{placeholder && <option value="">{placeholder}</option>}{children}</select>
      {/* UPDATED: Explicitly use variant="outline" which now has the teal border */}
      <Button
        variant="outline" // Use the updated outline variant
        className="w-full justify-between font-normal text-left relative z-0" // Keep layout styles
        type="button"
        aria-haspopup="listbox"
        aria-label={placeholder || 'Select an option'}
      >
        <span className="truncate pr-1">{value ? (<span className="text-stone-900">{displayValue}</span>) : (<span className="text-stone-400">{placeholder || 'Select...'}</span>)}</span>
        <svg className="h-4 w-4 text-stone-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
      </Button>
    </div>
   );
};
const SelectItem: React.FC<SelectItemProps> = ({ children, ...props }) => ( <option {...props}>{children}</option> );
interface CardProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children: ReactNode; }
const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => ( <div className={cn('rounded-xl border border-stone-200 bg-white text-stone-900 shadow-md transition-shadow duration-200 hover:shadow-lg', className)} {...props}>{children}</div> );
const CardHeader: React.FC<CardProps> = ({ children, ...props }) => ( <div className="flex flex-col space-y-1.5 p-5" {...props}>{children}</div> );
const CardTitle: React.FC<CardProps> = ({ children, ...props }) => ( <h3 className="text-base font-semibold leading-none tracking-tight text-stone-800" {...props}>{children}</h3> );
const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => ( <div className={cn("p-5 pt-0", className)} {...props}>{children}</div> );
interface PopoverProps { children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; }
const Popover: React.FC<PopoverProps> = ({ children }) => ( <div className="relative">{children}</div> );
interface PopoverTriggerProps { children: ReactNode; onClick?: () => void; }
const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, onClick }) => ( <div onClick={onClick}>{children}</div> );
interface PopoverContentProps { children: ReactNode; className?: string; }
const PopoverContent: React.FC<PopoverContentProps> = ({ children, className = '' }) => ( <div className={cn('absolute w-auto p-4 border border-stone-200 rounded-md shadow-lg bg-white z-50 mt-1 space-y-2', className)}>{children}</div> );
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> { value: number | null | undefined; colorClass?: string; className?: string; }
const Progress: React.FC<ProgressProps> = ({ value, colorClass = 'bg-[#3D7F80]', className = '', ...props }) => ( <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-stone-200', className)} {...props}><div className={`${colorClass} h-full w-full flex-1 transition-transform duration-500 ease-out`} style={{ transform: `translateX(-${100 - (value || 0)}%)` }} /></div> );
interface SwitchProps { id?: string; checked: boolean; onCheckedChange: (checked: boolean) => void; 'aria-label'?: string; }
const SwitchMock: React.FC<SwitchProps> = ({ id, checked, onCheckedChange, 'aria-label': ariaLabel }) => {
  const bgColor = checked ? 'bg-[#3D7F80]' : 'bg-stone-300'; const togglePosition = checked ? 'translate-x-5' : 'translate-x-0';
  return ( <button type="button" role="switch" aria-checked={checked} aria-label={ariaLabel} id={id} onClick={() => onCheckedChange(!checked)} className={cn('relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3D7F80] focus:ring-offset-2 focus:ring-offset-stone-50', bgColor)}><span aria-hidden="true" className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', togglePosition)} /></button> );
};

// =============== Helper: Age Encoding ===============
const encodeAgeOrdinal = (rawAge: number): number => {
  if (rawAge >= 1 && rawAge <= 5) return 1; if (rawAge >= 6 && rawAge <= 12) return 2; if (rawAge >= 13 && rawAge <= 18) return 3; if (rawAge >= 19 && rawAge <= 39) return 4;
  if (rawAge >= 40 && rawAge <= 64) return 5; if (rawAge >= 65 && rawAge <= 80) return 6; if (rawAge >= 81) return 7; return 0;
};

// =============== Main Component ===============
const PredictiveAnalyticsPage: React.FC = () => {
  // --- State Variables ---
  const [age, setAge] = useState<string>(''); const [dateTime, setDateTime] = useState<Date>(new Date()); const [gender, setGender] = useState<string>(''); const [occupancy, setOccupancy] = useState<string>('');
  const [referralSource, setReferralSource] = useState<string>(''); const [triageCode, setTriageCode] = useState<string>(''); const [patientsAhead, setPatientsAhead] = useState<string>(''); const [patientsInED, setPatientsInED] = useState<string>('');
  const [alteredMentalStatus, setAlteredMentalStatus] = useState<boolean>(false); const [isAccident, setIsAccident] = useState<boolean>(false); const [hasFever, setHasFever] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<PredictionResult | null>(null); const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); const [error, setError] = useState<string | null>(null); const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // --- API Configuration ---
  const API_BASE_URL = 'http://localhost:8000'; const PREDICTIVE_API_URL = `${API_BASE_URL}/predictive/api/predict`;

  // --- Event Handlers ---
  const handlePredict = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsLoading(true); setError(null); setPredictions(null); setRecommendations(null);
    const parsedAge = parseInt(age, 10); const parsedTriage = parseInt(triageCode, 10); const parsedPatientsAhead = parseInt(patientsAhead, 10); const parsedPatientsInED = parseInt(patientsInED, 10);
    if (isNaN(parsedAge) || isNaN(parsedTriage) || isNaN(parsedPatientsAhead) || isNaN(parsedPatientsInED) || !gender || !referralSource || !triageCode || !occupancy) { setError('Please fill in all required fields with valid values.'); setIsLoading(false); return; }
    if (parsedAge <= 0 || parsedPatientsAhead < 0 || parsedPatientsInED < 0) { setError('Age must be positive. Patient counts cannot be negative.'); setIsLoading(false); return; }
    if (!isValid(dateTime)) { setError('Invalid Date/Time selected.'); setIsLoading(false); return; }
    const encodedAge = encodeAgeOrdinal(parsedAge); if (encodedAge === 0) { setError('Invalid age entered. Please enter an age of 1 or greater.'); setIsLoading(false); return; }
    const apiInput: ApiPredictionInput = { age: encodedAge, gender, patientsInED: parsedPatientsInED, patientsAhead: parsedPatientsAhead, dateTime: dateTime.toISOString(), triageCode: parsedTriage, referralSource, isAccident, hasFever, alteredMentalStatus, occupancy };
    try {
      const response = await fetch(PREDICTIVE_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(apiInput) });
      if (!response.ok) { let errorDetail = `API Error: ${response.status} ${response.statusText}`; try { const errorData = await response.json(); errorDetail = errorData.error || errorData.detail || errorDetail; } catch (parseError) { console.error('Could not parse error response:', parseError); } throw new Error(errorDetail); }
      const results: PredictionResult = await response.json(); setPredictions(results); generateRecommendations(results);
    } catch (err) { console.error('API call failed:', err); setError(err instanceof Error ? err.message : 'An unexpected error occurred.'); } finally { setIsLoading(false); }
  };
  const formatLikelihood = (percentage: number): LikelihoodFormat => {
    if (percentage > 75) return { text: 'Very High', color: 'text-red-700', bgColor: 'bg-red-500', Icon: AlertCircle }; if (percentage > 50) return { text: 'High', color: 'text-orange-700', bgColor: 'bg-orange-500', Icon: AlertCircle };
    if (percentage > 25) return { text: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-500', Icon: Clock }; return { text: 'Low', color: 'text-green-700', bgColor: 'bg-green-500', Icon: CheckCircle };
  };
  const generateRecommendations = (results: PredictionResult) => {
    const recs: string[] = []; const avgLikelihood = (results.wait3h + results.wait4h + results.wait5h + results.wait6h) / 4;
    if (results.wait6h > 70 || results.wait5h > 80) recs.push('High risk of extended wait (>5-6h). Consider senior staff alert.'); else if (avgLikelihood > 50) recs.push('Moderate to high likelihood of long wait. Review ED flow.');
    if (avgLikelihood > 40) recs.push('Inform patient/family about potential significant wait.'); const currentTriageCode = parseInt(triageCode, 10); if (!isNaN(currentTriageCode) && (currentTriageCode === 1 || currentTriageCode === 2)) recs.push(`High triage acuity (Code ${currentTriageCode}). Ensure prompt assessment.`);
    if (occupancy === 'critical' || occupancy === 'high') recs.push(`ED occupancy is ${occupancy}. Expedite discharges.`); if (alteredMentalStatus) recs.push('Note: Altered mental status present.'); if (hasFever) recs.push('Note: Fever present.');
    if (results.admissionLikelihood > 70) recs.push('High admission likelihood. Consider early inpatient notification.'); if (results.predictedWaitMinutes > 240) recs.push(`Predicted wait ~${Math.round(results.predictedWaitMinutes / 60)} hours. Ensure patient comfort/reassessment.`);
    if (recs.length === 0) recs.push('Predicted wait times appear manageable. Continue standard monitoring.'); setRecommendations(recs);
  };
  const handleReset = () => { setAge(''); setDateTime(new Date()); setGender(''); setOccupancy(''); setReferralSource(''); setTriageCode(''); setPatientsAhead(''); setPatientsInED(''); setAlteredMentalStatus(false); setIsAccident(false); setHasFever(false); setPredictions(null); setRecommendations(null); setError(null); setIsLoading(false); setIsCalendarOpen(false); };
  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) { setIsCalendarOpen(false); } }; if (isCalendarOpen) { document.addEventListener('mousedown', handleClickOutside); } else { document.removeEventListener('mousedown', handleClickOutside); } return () => { document.removeEventListener('mousedown', handleClickOutside); }; }, [isCalendarOpen]);
  const handleAgeChange = (e: ChangeEvent<HTMLInputElement>) => setAge(e.target.value); const handlePatientsAheadChange = (e: ChangeEvent<HTMLInputElement>) => setPatientsAhead(e.target.value); const handlePatientsInEDChange = (e: ChangeEvent<HTMLInputElement>) => setPatientsInED(e.target.value);
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => { const dateValue = e.target.value; const newDate = parse(dateValue, 'yyyy-MM-dd', dateTime || new Date()); if (isValid(newDate)) { const currentTime = dateTime || new Date(); const updatedDateTime = setMilliseconds(setSeconds(setMinutes(setHours(newDate, currentTime.getHours()), currentTime.getMinutes()), currentTime.getSeconds()), currentTime.getMilliseconds()); setDateTime(updatedDateTime); } else { console.warn('Invalid date input:', dateValue); } };
  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => { const timeValue = e.target.value; const [hoursStr, minutesStr] = timeValue.split(':'); const hours = parseInt(hoursStr, 10); const minutes = parseInt(minutesStr, 10); if (!isNaN(hours) && !isNaN(minutes)) { const currentDateTime = dateTime || new Date(); const updatedDateTime = setMinutes(setHours(currentDateTime, hours), minutes); setDateTime(updatedDateTime); } else { console.warn('Invalid time input:', timeValue); } };
  const handleGenderChange = (value: string) => setGender(value); const handleOccupancyChange = (value: string) => setOccupancy(value); const handleReferralChange = (value: string) => setReferralSource(value); const handleTriageChange = (value: string) => setTriageCode(value);
  const toggleCalendar = () => setIsCalendarOpen(!isCalendarOpen); const handleAlteredMentalChange = (checked: boolean) => setAlteredMentalStatus(checked); const handleAccidentChange = (checked: boolean) => setIsAccident(checked); const handleFeverChange = (checked: boolean) => setHasFever(checked);

  // --- JSX Rendering ---
  return (
    <div className="p-4 md:p-6 w-full bg-stone-50 text-stone-900">
      <h1 className="text-xl font-semibold mb-6 text-stone-900">
        Predictive Analytics - ED Wait Time
      </h1>

      {error && ( <div className="mb-4 p-3 border border-red-300 bg-red-100 rounded-md flex items-center text-sm text-red-700" role="alert"> <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" /> <span>{error}</span> </div> )}

      {/* Main layout: Adjusted column widths */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Column: The Form Card */}
        <div className="w-full lg:w-2/5 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Enter Patient Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Form elements inside CardContent */}
              {/* Using space-y-4 for reduced vertical gap */}
              <form onSubmit={handlePredict} className="space-y-4">
                {/* Age Input - Uses updated Input component */}
                <div> <Label htmlFor="age">Patient Age</Label> <Input id="age" type="number" placeholder="e.g., 52" value={age} onChange={handleAgeChange} required /> </div>
                {/* Date & Time Picker - Uses updated Button component */}
                <div ref={popoverRef}>
                    <Label htmlFor="datetime-trigger">Date &amp; Time of Arrival</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger onClick={toggleCalendar}>
                            {/* UPDATED: Explicitly use variant="outline" */}
                            <Button
                                id="datetime-trigger"
                                variant="outline" // Use the updated outline variant
                                className='w-full text-left font-normal' // Keep layout styles
                                aria-haspopup="dialog"
                                aria-expanded={isCalendarOpen}
                            >
                                <Clock className="mr-2 h-4 w-4 text-stone-500 flex-shrink-0" />
                                <span className="flex-grow">{dateTime && isValid(dateTime) ? (<span className="text-stone-900">{format(dateTime, 'PPP HH:mm')}</span>) : (<span>Pick date &amp; time</span>)}</span>
                            </Button>
                        </PopoverTrigger>
                        {isCalendarOpen && (<PopoverContent className="w-auto p-4 bg-white border-stone-200 space-y-3"><div> <Label htmlFor="date-input" className="text-xs font-medium text-stone-600">Date</Label> <Input id="date-input" type="date" className="h-9 text-sm bg-white border-stone-300" value={dateTime && isValid(dateTime) ? format(dateTime, 'yyyy-MM-dd') : ''} onChange={handleDateChange} /> </div><div> <Label htmlFor="time-input" className="text-xs font-medium text-stone-600">Time</Label> <Input id="time-input" type="time" className="h-9 text-sm bg-white border-stone-300" value={dateTime && isValid(dateTime) ? format(dateTime, 'HH:mm') : ''} onChange={handleTimeChange} /> </div><Button size="sm" variant="outline" onClick={() => setIsCalendarOpen(false)} className="w-full h-8 text-xs border-stone-300">Done</Button></PopoverContent>)} {/* Reverted Done button border */}
                    </Popover>
                </div>
                {/* Gender Select - Uses updated Select component */}
                <div> <Label htmlFor="gender">Gender</Label> <Select id="gender" value={gender} onValueChange={handleGenderChange} placeholder="Select gender" required> <SelectItem value="male">Male</SelectItem> <SelectItem value="female">Female</SelectItem> <SelectItem value="other">Other</SelectItem> <SelectItem value="unknown">Unknown</SelectItem> </Select> </div>
                {/* Occupancy Select - Uses updated Select component */}
                <div> <Label htmlFor="occupancy">ED Occupancy Level (Context)</Label> <Select id="occupancy" value={occupancy} onValueChange={handleOccupancyChange} placeholder="Select occupancy" required> <SelectItem value="low">Low</SelectItem> <SelectItem value="medium">Medium</SelectItem> <SelectItem value="high">High</SelectItem> <SelectItem value="critical">Critical</SelectItem> </Select> </div>
                {/* Referral Source Select - Uses updated Select component */}
                <div> <Label htmlFor="referral">Source of Referral</Label> <Select id="referral" value={referralSource} onValueChange={handleReferralChange} placeholder="Select source" required> <SelectItem value="gp">GP</SelectItem> <SelectItem value="self">Self-referral</SelectItem> <SelectItem value="ambulance">Ambulance</SelectItem> <SelectItem value="clinic">Other Clinic</SelectItem> <SelectItem value="other">Other</SelectItem> </Select> </div>
                {/* Triage Code Select - Uses updated Select component */}
                <div> <Label htmlFor="triage">Triage Code</Label> <Select id="triage" value={triageCode} onValueChange={handleTriageChange} placeholder="Select triage code" required> <SelectItem value="1">1 - Immediate threat (Immediate)</SelectItem> <SelectItem value="2">2 - Imminent threat (10-mins)</SelectItem> <SelectItem value="3">3 - Potentially life-threatening (30-mins)</SelectItem> <SelectItem value="4">4 - Potentially serious (60-mins)</SelectItem> <SelectItem value="5">5 - Less urgent (120-mins)</SelectItem> </Select> </div>
                {/* Patients in ED Input - Uses updated Input component */}
                <div> <Label htmlFor="patientsInED">Patients Currently in ED</Label> <Input id="patientsInED" type="number" placeholder="e.g., 25" value={patientsInED} onChange={handlePatientsInEDChange} min="0" required /> </div>
                {/* Patients Ahead Input - Uses updated Input component */}
                <div> <Label htmlFor="patientsAhead">Patients Ahead in Queue</Label> <Input id="patientsAhead" type="number" placeholder="e.g., 5" value={patientsAhead} onChange={handlePatientsAheadChange} min="0" required /> </div>
                {/* Boolean Switches */}
                <div className="flex items-center justify-between pt-2"> <Label htmlFor="alteredMentalStatus" className="mb-0 mr-4">Altered Mental Status</Label> <SwitchMock id="alteredMentalStatus" checked={alteredMentalStatus} onCheckedChange={handleAlteredMentalChange} aria-label="Altered Mental Status" /> </div>
                <div className="flex items-center justify-between pt-2"> <Label htmlFor="isAccident" className="mb-0 mr-4">Accident Related</Label> <SwitchMock id="isAccident" checked={isAccident} onCheckedChange={handleAccidentChange} aria-label="Accident Related" /> </div>
                <div className="flex items-center justify-between pt-2"> <Label htmlFor="hasFever" className="mb-0 mr-4">Fever Present</Label> <SwitchMock id="hasFever" checked={hasFever} onCheckedChange={handleFeverChange} aria-label="Fever Present" /> </div>
                {/* Form Action Buttons */}
                <div className="flex items-center justify-start space-x-3 pt-4"> <Button type="submit" disabled={isLoading}> {isLoading ? ( <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Predicting...</> ) : ( 'Predict Wait Time' )} </Button> <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading}> <RotateCcw className="mr-2 h-4 w-4" /> Reset </Button> </div>
              </form>
            </CardContent>
          </Card>
        </div> {/* End Left Column (Form Card) */}

        {/* Right Column: Results Area */}
        <div className="flex-1 lg:pl-8">
          {/* Loading State Skeleton UI */}
          {isLoading && ( <div className="mt-6 space-y-6" aria-live="polite" aria-busy="true"> {/* Skeleton remains the same */} <div> <div className="h-5 bg-stone-300 rounded w-48 mb-4 animate-pulse"></div> <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"> <Card className="animate-pulse border-stone-200 bg-white"><CardHeader><div className="h-4 bg-stone-200 rounded w-1/2"></div></CardHeader><CardContent><div className="h-8 bg-stone-200 rounded w-1/4"></div></CardContent></Card> <Card className="animate-pulse border-stone-200 bg-white"><CardHeader><div className="h-4 bg-stone-200 rounded w-1/2"></div></CardHeader><CardContent><div className="h-8 bg-stone-200 rounded w-1/3"></div></CardContent></Card> </div> <div className="h-5 bg-stone-300 rounded w-40 mb-4 animate-pulse"></div> <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"> {[...Array(4)].map((_, i) => ( <Card key={`skel-breach-${i}`} className="animate-pulse border-stone-200 bg-white"><CardHeader><div className="h-4 bg-stone-200 rounded w-3/4"></div></CardHeader><CardContent><div className="h-6 bg-stone-200 rounded w-1/3 mb-2"></div><div className="h-2 bg-stone-200 rounded w-full"></div></CardContent></Card> ))} </div> </div> <div> <div className="h-5 bg-stone-300 rounded w-32 mb-4 animate-pulse"></div> <Card className="animate-pulse border-stone-200 bg-white"><CardHeader><div className="h-4 bg-stone-200 rounded w-1/4"></div></CardHeader><CardContent className="space-y-2"><div className="h-3 bg-stone-200 rounded w-full"></div><div className="h-3 bg-stone-200 rounded w-5/6"></div><div className="h-3 bg-stone-200 rounded w-3/4"></div></CardContent></Card> </div> </div> )}

          {/* Display Prediction Results */}
          {!isLoading && predictions && ( <div className="mt-6 lg:mt-0 space-y-8" aria-live="polite"> <div> <h2 className="text-lg font-semibold text-stone-700 mb-4">Prediction Results</h2> <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"> <Card><CardHeader><CardTitle className="flex items-center justify-between"><span>Admission Likelihood</span><LogIn className="w-5 h-5 text-[#2D4F6C] flex-shrink-0" /></CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-stone-800">{predictions.admissionLikelihood.toFixed(1)}%</p></CardContent></Card> <Card><CardHeader><CardTitle className="flex items-center justify-between"><span>Predicted Wait Time</span><Hourglass className="w-5 h-5 text-[#68A9A9] flex-shrink-0" /></CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-stone-800">~ {predictions.predictedWaitMinutes} <span className="text-lg font-medium text-stone-500">mins</span></p></CardContent></Card> </div> </div> <div> <h3 className="text-md font-semibold text-stone-700 mb-3 mt-6">Breach Likelihood</h3> <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {[ { hours: 3, likelihood: predictions.wait3h }, { hours: 4, likelihood: predictions.wait4h }, { hours: 5, likelihood: predictions.wait5h }, { hours: 6, likelihood: predictions.wait6h }, ].map((pred) => { const { text, color, bgColor, Icon } = formatLikelihood(pred.likelihood); return ( <Card key={pred.hours}><CardHeader><CardTitle className="flex items-center justify-between"><span>&gt; {pred.hours} Hours Wait</span><Icon className={`w-5 h-5 ${color} flex-shrink-0`} /></CardTitle></CardHeader><CardContent className="space-y-2"><div className="flex justify-between items-baseline mb-1"><span className={`text-xl font-semibold ${color}`}>{text}</span><span className={`text-base font-medium text-stone-500`}>{pred.likelihood.toFixed(1)}%</span></div><Progress value={pred.likelihood} colorClass={bgColor} /></CardContent></Card> ); })} </div> </div> {recommendations && recommendations.length > 0 && ( <Card className="bg-white border-stone-200"><CardHeader><CardTitle className="flex items-center text-stone-800"><Lightbulb className="w-5 h-5 mr-2 text-[#3D7F80]" />Recommendations</CardTitle></CardHeader><CardContent><ul className="list-disc space-y-1.5 pl-5 text-sm text-stone-600">{recommendations.map((rec, index) => (<li key={index}>{rec}</li>))}</ul></CardContent></Card> )} </div> )}

          {/* Enhanced Initial State / No Results Placeholder */}
          {!isLoading && !predictions && !error && (
             <Card className="mt-6 lg:mt-0">
                 <CardHeader>
                     <CardTitle className="text-center">Prediction Results Area</CardTitle>
                 </CardHeader>
                 <CardContent className="text-center text-stone-500 space-y-6 px-5 pb-5">
                     <ClipboardList className="mx-auto h-16 w-16 text-stone-300" strokeWidth={1} />
                     <p className="text-sm">
                       Fill in the patient details on the left and click 'Predict Wait Time'
                       to see the results displayed here.
                     </p>
                     {/* Disabled Example Results - Added padding & teal border */}
                     <div className="space-y-4 opacity-60 px-6 pb-4 pt-2 border-t border-stone-100">
                         <h3 className="text-sm font-semibold text-stone-600 mt-4">Example Output Format:</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                             {/* Disabled Admission Card - Teal Border */}
                             <Card className="bg-stone-50 border border-[#3D7F80] shadow-none">
                                 <CardHeader><CardTitle className="text-sm text-stone-600 flex items-center justify-between"><span>Admission Likelihood</span><LogIn className="w-4 h-4 text-stone-400 flex-shrink-0" /></CardTitle></CardHeader>
                                 <CardContent><p className="text-2xl font-semibold text-stone-400">-- %</p></CardContent>
                             </Card>
                             {/* Disabled Wait Time Card - Teal Border */}
                             <Card className="bg-stone-50 border border-[#3D7F80] shadow-none">
                                 <CardHeader><CardTitle className="text-sm text-stone-600 flex items-center justify-between"><span>Predicted Wait Time</span><Hourglass className="w-4 h-4 text-stone-400 flex-shrink-0" /></CardTitle></CardHeader>
                                 <CardContent><p className="text-2xl font-semibold text-stone-400">~ -- <span className="text-base font-medium text-stone-400">mins</span></p></CardContent>
                             </Card>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {/* Disabled Breach Card Example - Teal Border */}
                              <Card className="bg-stone-50 border border-[#3D7F80] shadow-none">
                                 <CardHeader><CardTitle className="text-sm text-stone-600 flex items-center justify-between"><span>&gt; 4 Hours Wait</span><Clock className="w-4 h-4 text-stone-400 flex-shrink-0" /></CardTitle></CardHeader>
                                 <CardContent className="space-y-2">
                                     <div className="flex justify-between items-baseline mb-1"><span className="text-lg font-semibold text-stone-400">--</span><span className="text-sm font-medium text-stone-400">-- %</span></div>
                                     <Progress value={0} colorClass="bg-stone-300" />
                                 </CardContent>
                             </Card>
                              {/* Disabled Breach Card Example - Teal Border */}
                              <Card className="bg-stone-50 border border-[#3D7F80] shadow-none">
                                 <CardHeader><CardTitle className="text-sm text-stone-600 flex items-center justify-between"><span>&gt; 6 Hours Wait</span><Clock className="w-4 h-4 text-stone-400 flex-shrink-0" /></CardTitle></CardHeader>
                                 <CardContent className="space-y-2">
                                     <div className="flex justify-between items-baseline mb-1"><span className="text-lg font-semibold text-stone-400">--</span><span className="text-sm font-medium text-stone-400">-- %</span></div>
                                     <Progress value={0} colorClass="bg-stone-300" />
                                 </CardContent>
                             </Card>
                         </div>
                     </div>
                 </CardContent>
             </Card>
          )}
        </div> {/* End Right Column (Results) */}

      </div> {/* End Main Layout */}
    </div> // End Main Container
  );
};

export default PredictiveAnalyticsPage;

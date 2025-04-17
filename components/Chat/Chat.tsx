// /pages/predictive-insights.tsx
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
  ChevronDown,
} from 'lucide-react';

import PageHeader from '@/components/PageHeader';          // ⭐ canonical header

import {
  format,
  isValid,
  parse,
  setHours,
  setMinutes,
} from 'date-fns';

/* -------------------------------------------------------------------------- */
/*  Config & Types                                                            */
/* -------------------------------------------------------------------------- */

const PREDICTIVE_API_URL =
  'https://fastapiplatformclean-10.onrender.com/predictive/api/predict';

interface PredictionResult {
  wait3h: number; wait4h: number; wait5h: number; wait6h: number;
  admissionLikelihood: number; predictedWaitMinutes: number;
}

interface LikelihoodFormat {
  text: string; color: string; bgColor: string; Icon: React.ElementType;
}

interface ApiPredictionInput {
  age: number; gender: string; patientsInED: number; patientsAhead: number;
  dateTime: string; triageCode: number; referralSource: string;
  isAccident: boolean; hasFever: boolean; alteredMentalStatus: boolean;
  occupancy: string;
}

/* -------------------------------------------------------------------------- */
/*  Utility & UI helpers (cn, Button, Input, Label, Select, Card …)           */
/*  … (unchanged – omitted here for brevity)                                  */
/* -------------------------------------------------------------------------- */
/*   ⚠️  keep all your existing helper code — nothing inside was modified.    */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

const PredictiveAnalyticsPage: FC = () => {
  /* ----- state & handlers (existing hooks preserved) ----- */
  // 👉 Added error state so it is defined where we use it later
  const [error, setError] = useState<string | null>(null);

  // … all your other useState hooks, helpers, API call, etc. should remain here …

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="px-4 md:px-8 lg:px-12 pb-16 pt-12 min-h-screen w-full bg-gradient-to-b from-white via-teal-50 to-white text-gray-900">

      {/* ✅ canonical header – same spacing as other pages */}
      <PageHeader
        title="Predictive Insights"
        subtitle="Estimate ED wait times and admission likelihood based on patient details."
      />

      {/* ---------- Error banner ---------- */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 border border-red-300 bg-red-100 rounded-lg flex items-start text-sm text-red-800 shadow-sm max-w-4xl mx-auto"
        >
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-600" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            &times;
          </button>
        </div>
      )}

      {/* ---------- Main content ---------- */}
      {/* (form column, results column, skeletons, empty state) */}
      {/* … everything inside remains exactly as in your original code … */}

      {/* ---------- Disclaimer ---------- */}
      <p className="text-center text-xs text-gray-500 max-w-lg mx-auto leading-relaxed pt-12 pb-4">
        <strong>Disclaimer:</strong> Whilst these predictions are derived from
        meticulously validated machine‑learning models trained on real patient
        data, they should not replace clinical judgement; use with caution.
      </p>
    </div>
  );
};

export default PredictiveAnalyticsPage;

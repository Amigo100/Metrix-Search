import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Bot, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AISummaryProps {
  searchQuery: string;
  summary: string;
  loading: boolean;
}

export function AISummary({ searchQuery, summary, loading }: AISummaryProps) {
  // Show default explanation if no search query
  if (!searchQuery.trim()) {
    return (
      <Card className="p-6 mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">How Metrix Works</h3>
          <Badge variant="outline" className="bg-primary-100 text-primary-700 border-primary-300">
            AI Powered
          </Badge>
        </div>

        <div className="prose prose-sm max-w-none mb-4">
          <p className="text-gray-700 leading-relaxed">
            Metrix combines the power of AI with comprehensive clinical guideline databases to provide you with both
            <strong> natural language explanations</strong> and <strong>indexed clinical results</strong>. When you search
            for a clinical topic, you'll receive an AI-generated summary of the key management principles followed by
            relevant guidelines from trusted sources like AHA/ACC, WHO, NICE, and leading medical institutions.
            This dual approach ensures greater speed and accuracy in accessing critical clinical information.
          </p>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Getting Started:</strong> Try searching for conditions like "sepsis", "myocardial infarction",
            or "cellulitis" to see how Metrix provides comprehensive clinical guidance.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200">
        <div className="animate-pulse">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-5 h-5 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card className="p-6 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200">
        <div className="flex items-center space-x-2 mb-4">
          <Bot className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Summary: Clinical Guidelines for "{searchQuery}"</h3>
          <Badge variant="outline" className="bg-primary-100 text-primary-700 border-primary-300">
            AI Generated
          </Badge>
        </div>

        <div className="prose prose-sm max-w-none mb-4">
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            <strong>Important Disclaimer:</strong> This AI-generated summary is for informational purposes only and may contain errors.
            Always verify information against the original guidelines below and consult with qualified healthcare professionals for clinical decisions.
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  );
}

import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface AISummaryProps {
  query: string;
  summary: string;
  loading: boolean;
}

export function AISummary({ query, summary, loading }: AISummaryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [howCollapsed, setHowCollapsed] = useState(true);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
  };
  // Show default explanation if no search query
  if (!query.trim()) {
    if (howCollapsed) {
      return (
        <div className="mb-6 text-center">
          <Button variant="outline" onClick={() => setHowCollapsed(false)}>
            How it works
          </Button>
        </div>
      );
    }

    return (
      <Card className="p-6 mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              How Metrix Works
            </h3>
            <Badge
              variant="outline"
              className="bg-teal-100 text-teal-700 border-teal-300"
            >
              AI Powered
            </Badge>
          </div>
          <button
            onClick={() => setHowCollapsed(true)}
            title="Hide section"
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        <div className="prose prose-sm max-w-none mb-4">
          <p className="text-gray-700 leading-relaxed">
            Metrix combines the power of AI with comprehensive clinical
            guideline databases to provide you with both
            <strong> natural language explanations</strong> and{' '}
            <strong>indexed clinical results</strong>. When you search for a
            clinical topic, you'll receive an AI-generated summary of the key
            management principles followed by relevant guidelines from trusted
            sources like AHA/ACC, WHO, NICE, and leading medical institutions.
            This dual approach ensures greater speed and accuracy in accessing
            critical clinical information.
          </p>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Getting Started:</strong> Try searching for conditions like
            "sepsis", "myocardial infarction", or "cellulitis" to see how Metrix
            provides comprehensive clinical guidance.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
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
      <Card className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Summary: Clinical Guidelines for "{query}"
            </h3>
            <Badge
              variant="outline"
              className="bg-teal-100 text-teal-700 border-teal-300"
            >
              AI Generated
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copySummary}
              title="Copy summary"
              className="text-gray-600 hover:text-gray-900"
            >
              <ClipboardCopy className="w-4 h-4" />
            </button>
            <button
              onClick={toggleCollapsed}
              title={collapsed ? 'Show summary' : 'Hide summary'}
              className="text-gray-600 hover:text-gray-900"
            >
              {collapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeMathjax]}
              className="prose prose-sm max-w-none mb-4 text-gray-700 leading-relaxed"
            >
              {summary}
            </ReactMarkdown>

            <Alert className="bg-yellow-50 border-yellow-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                <strong>Important Disclaimer:</strong> This AI-generated summary
                is for informational purposes only and may contain errors.
                Always verify information against the original guidelines below
                and consult with qualified healthcare professionals for clinical
                decisions.
              </AlertDescription>
            </Alert>
          </>
        )}
      </Card>
    </div>
  );
}

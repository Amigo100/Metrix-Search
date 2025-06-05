import { FileText, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';

interface DocumentCardProps {
  title: string;
  summary: string;
  publishDate?: string;
  specialty?: string;
  type?: string;
  relevanceScore?: number;
  url?: string;
}

const DocumentCard = ({
  title,
  summary,
  publishDate,
  specialty,
  type,
  relevanceScore,
  url,
}: DocumentCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-teal-600" />
              {type && (
                <Badge variant="secondary" className="text-xs">
                  {type}
                </Badge>
              )}
              {specialty && (
                <Badge variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 leading-tight hover:text-teal-600 cursor-pointer">
              {title}
            </h3>
          </div>
          {relevanceScore !== undefined && (
            <div className="text-right text-sm text-gray-500">
              <div className="font-medium text-green-600">
                {Math.round(relevanceScore * 100)}% match
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">{summary}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {publishDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {publishDate}
              </div>
            )}
          </div>
          {url && (
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Full
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;

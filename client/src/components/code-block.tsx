import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showCopy?: boolean;
  className?: string;
}

export default function CodeBlock({ 
  code, 
  language = "javascript", 
  title, 
  showCopy = true,
  className = ""
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      javascript: "JavaScript",
      python: "Python",
      bash: "Bash",
      json: "JSON",
      html: "HTML",
      markdown: "Markdown",
      java: "Java",
      curl: "cURL"
    };
    return labels[lang] || lang;
  };

  return (
    <div className={`group relative ${className}`}>
      <Card className="bg-gray-900 border-gray-700">
        {title && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-400">
                {title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
                  {getLanguageLabel(language)}
                </span>
                {showCopy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className={title ? "pt-0" : "pt-6"}>
          <div className="relative">
            {!title && showCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
            <pre className="text-green-400 text-sm overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

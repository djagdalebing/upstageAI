import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUpload from "./file-upload";
import { 
  FileText, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Calendar,
  Users,
  Shield,
  TrendingUp,
  Download,
  Eye,
  Home,
  Building,
  Car,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContractAnalysis {
  documentText: string;
  contractType: {
    category: string;
    subcategory: string;
    description: string;
  };
  parties: {
    name: string;
    role: string;
    contact?: string;
  }[];
  financialTerms: {
    totalValue: string;
    currency: string;
    paymentSchedule: string;
    penalties: string;
    deposits: string;
  };
  importantDates: {
    effectiveDate: string;
    expirationDate: string;
    renewalDate: string;
    noticePeriod: string;
    keyMilestones: string[];
  };
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    riskFactors: {
      category: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }[];
    recommendations: string[];
    redFlags: string[];
  };
  keyTerms: {
    terminationClause: string;
    liabilityLimits: string;
    intellectualProperty: string;
    confidentiality: string;
    disputeResolution: string;
    governingLaw: string;
  };
  obligations: {
    party: string;
    obligations: string[];
    deliverables: string[];
    deadlines: string[];
  }[];
  summary: string;
}

export default function ContractAnalyzer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'parsing' | 'analyzing' | 'complete'>('upload');
  const { toast } = useToast();

  const extractTextFromHTML = (html: string): string => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      return textContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    } catch (error) {
      console.error('Error extracting text from HTML:', error);
      return '';
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setCurrentStep('parsing');
    setAnalysis(null);

    try {
      console.log('Starting document parse for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('document', file);

      // Directly call Upstage Document Parse API
      const upstageApiKey = "up_DYMaQNy182Y6aGaRJNQxXnvTcQ5di"; // WARNING: Not secure for production
      if (!upstageApiKey) {
        console.error('UPSTAGE_API_KEY is not set');
        throw new Error('Upstage API key is not configured');
      }

      const parseResponse = await fetch('https://api.upstage.ai/v1/document-parse', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstageApiKey}`,
        },
        body: formData,
      });

      console.log('Upstage API Response Status:', parseResponse.status, parseResponse.statusText);
      const responseText = await parseResponse.text();
      console.log('Raw API Response:', responseText);

      // Show raw response in toast for debugging
      toast({
        title: "API Response Debug",
        description: `Raw response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`,
        variant: "default",
        duration: 10000,
      });

      if (!parseResponse.ok) {
        console.error('Upstage API Error Response:', responseText);
        throw new Error(`Upstage API failed with status ${parseResponse.status}: ${responseText.substring(0, 200)}`);
      }

      let parseResult;
      try {
        parseResult = JSON.parse(responseText);
        console.log('Upstage API Result:', parseResult);
      } catch (err) {
        console.error('Failed to parse JSON from response. Raw response was:', responseText);
        toast({
          title: "JSON Parse Error",
          description: `Failed to parse API response. Raw response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`,
          variant: "destructive",
          duration: 10000,
        });
        throw new Error('Invalid JSON in API response');
      }

      let documentText = '';
      if (parseResult.elements && Array.isArray(parseResult.elements)) {
        documentText = parseResult.elements
          .map((element: any) => element.content?.text || '')
          .join('\n');
        console.log('Extracted text from elements array, length:', documentText.length);
      }

      if (!documentText.trim() && parseResult.content?.text) {
        documentText = parseResult.content.text;
        console.log('Extracted text from content.text, length:', documentText.length);
      }

      if (!documentText.trim() && parseResult.content?.html) {
        documentText = extractTextFromHTML(parseResult.content.html);
        console.log('Extracted text from content.html, length:', documentText.length);
      }

      if (!documentText.trim() && parseResult.html) {
        documentText = extractTextFromHTML(parseResult.html);
        console.log('Extracted text from top-level html, length:', documentText.length);
      }

      console.log('Final extracted document text length:', documentText.length);
      console.log('First 500 characters of extracted text:', documentText.substring(0, 500));

      if (!documentText.trim()) {
        console.error('No text content found after all extraction strategies. Parse result details:', {
          parseResult,
          elementsArray: parseResult.elements,
          contentObject: parseResult.content,
          documentTextLength: documentText.length
        });
        throw new Error('No text content found in document. The document may be empty or in an unsupported format.');
      }

      setCurrentStep('analyzing');

      const analysisPrompt = `
You are an expert legal contract analyst with extensive experience in contract law, risk assessment, and business negotiations. Analyze the following contract document comprehensively and provide detailed insights.

// COMPLETE CONTRACT DOCUMENT:
${documentText}

// Please provide a comprehensive analysis in this exact JSON structure. Be thorough and specific in your analysis:

{
  "contractType": {
    "category": "Real Estate|Employment|Service Agreement|Lease|Purchase|Partnership|NDA|License|Other",
    "subcategory": "Specific type (e.g., Residential Lease, Software License, etc.)",
    "description": "Brief description of what this contract governs"
  },
  "parties": [
    {
      "name": "Full legal name of party",
      "role": "Landlord|Tenant|Buyer|Seller|Employer|Employee|Client|Service Provider|Licensor|Licensee|Other",
      "contact": "Contact information if available"
    }
  ],
  "financialTerms": {
    "totalValue": "Total contract value with currency",
    "currency": "USD|EUR|GBP|Other or Not Specified",
    "paymentSchedule": "Detailed payment schedule and frequency",
    "penalties": "Late fees, penalties, or liquidated damages",
    "deposits": "Security deposits, earnest money, or advance payments"
  },
  "importantDates": {
    "effectiveDate": "Contract start date",
    "expirationDate": "Contract end date or duration",
    "renewalDate": "Renewal or extension dates",
    "noticePeriod": "Required notice period for termination",
    "keyMilestones": ["Important deadlines", "delivery dates", "review periods"]
  },
  "riskAssessment": {
    "overallRisk": "low|medium|high|critical",
    "riskScore": 1-100,
    "riskFactors": [
      {
        "category": "Financial|Legal|Operational|Compliance|Performance",
        "description": "Specific risk description",
        "severity": "low|medium|high"
      }
    ],
    "recommendations": ["Specific actionable recommendations"],
    "redFlags": ["Critical issues requiring immediate attention"]
  },
  "keyTerms": {
    "terminationClause": "How the contract can be terminated",
    "liabilityLimits": "Liability limitations and caps",
    "intellectualProperty": "IP ownership and usage rights",
    "confidentiality": "Confidentiality and non-disclosure terms",
    "disputeResolution": "How disputes will be resolved",
    "governingLaw": "Which jurisdiction's laws apply"
  },
  "obligations": [
    {
      "party": "Party name",
      "obligations": ["Specific obligations and responsibilities"],
      "deliverables": ["What must be delivered"],
      "deadlines": ["When deliverables are due"]
    }
  ],
  "summary": "Comprehensive 3-4 sentence executive summary covering purpose, key terms, and overall assessment"
}

// ANALYSIS REQUIREMENTS:
// 1. Identify the exact type of contract (lease, employment, service, purchase, etc.)
// 2. Extract all party names and their roles clearly
// 3. Find all monetary amounts, payment terms, and financial obligations
// 4. Identify all important dates, deadlines, and time periods
// 5. Assess risks comprehensively across financial, legal, and operational dimensions
// 6. Provide specific, actionable recommendations
// 7. Flag any unusual, unfavorable, or potentially problematic clauses
// 8. Be specific with amounts, dates, and terms - avoid generic responses

// Focus on practical business implications and provide insights that would help in decision-making.
`;

      const analysisResponse = await fetch('/api/solar-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert legal contract analyst with 20+ years of experience. Always respond with valid JSON only, no additional text. Be thorough and specific in your analysis.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          reasoningEffort: 'high',
          stream: false,
        }),
      });

      if (!analysisResponse.ok) {
        console.error('Solar Chat API Error Response:', await analysisResponse.text());
        throw new Error(`Failed to analyze contract: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();
      const analysisContent = analysisResult.choices[0].message.content;

      console.log('Raw analysis response:', analysisContent);

      let parsedAnalysis;
      try {
        const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : analysisContent;
        parsedAnalysis = JSON.parse(jsonString);
      } catch (e) {
        console.error('JSON parsing failed for analysis response:', e);
        toast({
          title: "Analysis JSON Parse Error",
          description: `Failed to parse analysis response. Raw response: ${analysisContent.substring(0, 200)}${analysisContent.length > 200 ? '...' : ''}`,
          variant: "destructive",
          duration: 10000,
        });
        parsedAnalysis = {
          contractType: {
            category: 'Other',
            subcategory: 'Requires manual classification',
            description: 'Contract type requires detailed manual review'
          },
          parties: [
            {
              name: 'Party identification required',
              role: 'Other',
              contact: 'Not specified'
            }
          ],
          financialTerms: {
            totalValue: 'Requires manual extraction',
            currency: 'Not specified',
            paymentSchedule: 'Payment terms require manual review',
            penalties: 'Penalty terms require manual review',
            deposits: 'Deposit terms require manual review'
          },
          importantDates: {
            effectiveDate: 'Not clearly specified',
            expirationDate: 'Not clearly specified',
            renewalDate: 'Not specified',
            noticePeriod: 'Not specified',
            keyMilestones: ['Manual review required for important dates']
          },
          riskAssessment: {
            overallRisk: 'medium',
            riskScore: 50,
            riskFactors: [
              {
                category: 'Legal',
                description: 'Document requires comprehensive manual legal review',
                severity: 'medium'
              }
            ],
            recommendations: ['Engage legal counsel for detailed contract review', 'Clarify ambiguous terms before signing'],
            redFlags: ['Complex document structure requires expert analysis']
          },
          keyTerms: {
            terminationClause: 'Termination terms require manual extraction',
            liabilityLimits: 'Liability terms require manual review',
            intellectualProperty: 'IP terms require manual review',
            confidentiality: 'Confidentiality terms require manual review',
            disputeResolution: 'Dispute resolution terms require manual review',
            governingLaw: 'Governing law requires manual identification'
          },
          obligations: [
            {
              party: 'All Parties',
              obligations: ['Detailed obligations require manual extraction'],
              deliverables: ['Deliverables require manual identification'],
              deadlines: ['Deadlines require manual extraction']
            }
          ],
          summary: 'Contract analysis completed with automated extraction. The document contains complex legal language that requires detailed manual review by qualified legal counsel for comprehensive understanding of all terms and implications.'
        };
      }

      setAnalysis({
        documentText,
        ...parsedAnalysis
      });

      setCurrentStep('complete');
      
      toast({
        title: "Contract Analysis Complete!",
        description: "Your contract has been comprehensively analyzed with AI-powered insights.",
      });

    } catch (error) {
      console.error('Contract analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getContractIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'real estate':
      case 'lease': return <Home className="h-5 w-5" />;
      case 'employment': return <Briefcase className="h-5 w-5" />;
      case 'service agreement': return <Building className="h-5 w-5" />;
      case 'purchase': return <Car className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI-Powered Contract Analyzer
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Upload any legal contract and get comprehensive AI analysis including contract type identification, 
          party details, financial terms, risk assessment, and actionable insights.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {[
            { step: 'upload', label: 'Upload Contract', icon: FileText },
            { step: 'parsing', label: 'Parse Document', icon: FileText },
            { step: 'analyzing', label: 'AI Analysis', icon: Brain },
            { step: 'complete', label: 'Results', icon: CheckCircle }
          ].map(({ step, label, icon: Icon }, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep === step 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : index < ['upload', 'parsing', 'analyzing', 'complete'].indexOf(currentStep)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-gray-100 text-gray-400'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === step ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {label}
              </span>
              {index < 3 && <div className="w-8 h-px bg-gray-300 ml-4" />}
            </div>
          ))}
        </div>
      </div>

      {currentStep === 'upload' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-6 w-6 text-blue-600" />
              Upload Contract Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept=".pdf,.docx,.doc,.txt"
              maxSize={50}
              onFileSelect={handleFileUpload}
              placeholder="Drop your contract here or click to upload"
              description="Supports PDF, DOCX, DOC, TXT files (up to 50MB)"
            />
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Comprehensive Analysis Includes:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Contract type identification (lease, employment, service, etc.)</li>
                <li>• Complete party information and roles</li>
                <li>• Financial terms, payment schedules, and monetary obligations</li>
                <li>• Important dates, deadlines, and milestones</li>
                <li>• Comprehensive risk assessment with severity scoring</li>
                <li>• Key legal terms and clauses analysis</li>
                <li>• Party obligations and deliverables breakdown</li>
                <li>• Executive summary and actionable recommendations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {(currentStep === 'parsing' || currentStep === 'analyzing') && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">
              {currentStep === 'parsing' ? 'Parsing Document...' : 'Analyzing Contract...'}
            </h3>
            <p className="text-gray-600">
              {currentStep === 'parsing' 
                ? 'Extracting text and structure from your document'
                : 'Performing comprehensive AI-powered legal analysis'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {currentStep === 'complete' && analysis && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getContractIcon(analysis.contractType.category)}
                  <span className="ml-2">Contract Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {analysis.contractType.category}
                  </Badge>
                  <div className="font-medium">{analysis.contractType.subcategory}</div>
                  <div className="text-sm text-gray-600">{analysis.contractType.description}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className={`${getRiskColor(analysis.riskAssessment.overallRisk)} flex items-center gap-2 text-lg px-3 py-1`}>
                    {getRiskIcon(analysis.riskAssessment.overallRisk)}
                    {analysis.riskAssessment.overallRisk.toUpperCase()} RISK
                  </Badge>
                  <div className="text-2xl font-bold">
                    {analysis.riskAssessment.riskScore}/100
                  </div>
                  <div className="text-sm text-gray-600">Risk Score</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">{analysis.financialTerms.totalValue}</div>
                  <div className="text-sm text-gray-600">Total Contract Value</div>
                  <div className="text-sm">
                    <span className="font-medium">Currency: </span>
                    {analysis.financialTerms.currency}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-green-600" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="parties" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="parties">Parties</TabsTrigger>
                  <TabsTrigger value="dates">Dates</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                  <TabsTrigger value="terms">Key Terms</TabsTrigger>
                  <TabsTrigger value="obligations">Obligations</TabsTrigger>
                </TabsList>

                <TabsContent value="parties" className="space-y-4">
                  <h3 className="text-lg font-semibold">Contract Parties</h3>
                  <div className="grid gap-4">
                    {analysis.parties.map((party, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <div className="font-semibold">{party.name}</div>
                          <Badge variant="outline">{party.role}</Badge>
                        </div>
                        {party.contact && (
                          <div className="text-sm text-gray-600">Contact: {party.contact}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="dates" className="space-y-4">
                  <h3 className="text-lg font-semibold">Important Dates</h3>
                  <div className="grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <div className="font-medium">Effective Date</div>
                        </div>
                        <div className="text-sm text-gray-600">{analysis.importantDates.effectiveDate}</div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-red-600" />
                          <div className="font-medium">Expiration Date</div>
                        </div>
                        <div className="text-sm text-gray-600">{analysis.importantDates.expirationDate}</div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <div className="font-medium">Renewal Date</div>
                        </div>
                        <div className="text-sm text-gray-600">{analysis.importantDates.renewalDate}</div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <div className="font-medium">Notice Period</div>
                        </div>
                        <div className="text-sm text-gray-600">{analysis.importantDates.noticePeriod}</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="font-medium mb-2">Key Milestones</div>
                      <ul className="space-y-1">
                        {analysis.importantDates.keyMilestones.map((milestone, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{milestone}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="risks" className="space-y-4">
                  <h3 className="text-lg font-semibold">Risk Analysis</h3>
                  {analysis.riskAssessment.redFlags.length > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Red Flags</div>
                        <ul className="space-y-1">
                          {analysis.riskAssessment.redFlags.map((flag, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm">{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-4">
                    {analysis.riskAssessment.riskFactors.map((factor, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getRiskIcon(factor.severity)}
                          <div className="font-medium">{factor.category}</div>
                          <Badge className={getRiskColor(factor.severity)}>
                            {factor.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">{factor.description}</div>
                      </div>
                    ))}
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">Recommendations</div>
                    <ul className="space-y-1">
                      {analysis.riskAssessment.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="terms" className="space-y-4">
                  <h3 className="text-lg font-semibold">Key Terms</h3>
                  <div className="grid gap-4">
                    {Object.entries(analysis.keyTerms).map(([key, value], index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="font-medium capitalize mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-600">{value}</div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="obligations" className="space-y-4">
                  <h3 className="text-lg font-semibold">Obligations & Deliverables</h3>
                  {analysis.obligations.map((obligation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div className="font-medium">{obligation.party}</div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <div className="font-medium mb-2">Obligations</div>
                          <ul className="space-y-1">
                            {obligation.obligations.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-medium mb-2">Deliverables</div>
                          <ul className="space-y-1">
                            {obligation.deliverables.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-medium mb-2">Deadlines</div>
                          <ul className="space-y-1">
                            {obligation.deadlines.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-6 w-6 text-blue-600" />
                Original Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg max-h-[500px] overflow-auto">
                  {analysis.documentText}
                </pre>
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Original
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

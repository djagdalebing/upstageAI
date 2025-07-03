import { apiRequest } from "./queryClient";

export interface DocumentParseRequest {
  document: File;
  model?: string;
  base64Encoding?: string[];
}

export interface DocumentParseResponse {
  elements: Array<{
    category: string;
    content: {
      html: string;
      markdown: string;
      text: string;
    };
    id: number;
    page: number;
    coordinates?: Array<{
      x: number;
      y: number;
    }>;
    base64_encoding?: string;
  }>;
}

export interface InformationExtractRequest {
  document: File;
  schema: object;
  model?: string;
}

export interface InformationExtractResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SolarLLMRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  model?: string;
  reasoning_effort?: 'low' | 'medium' | 'high';
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface SolarLLMResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class UpstageAPI {
  private baseUrl = 'https://api.upstage.ai/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private fileToBase64(file: File | Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check if we're in Node.js environment (Buffer available)
      if (typeof Buffer !== 'undefined' && file instanceof Buffer) {
        resolve(file.toString('base64'));
        return;
      }

      // Check if FileReader is available (browser environment)
      if (typeof FileReader === 'undefined') {
        reject(new Error('FileReader is not available in this environment'));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file as File);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  }

  async parseDocument(request: DocumentParseRequest): Promise<DocumentParseResponse> {
    const formData = new FormData();
    formData.append('document', request.document);
    formData.append('model', request.model || 'document-parse');
    
    if (request.base64Encoding) {
      formData.append('base64_encoding', JSON.stringify(request.base64Encoding));
    }

    return this.makeRequest<DocumentParseResponse>('/document-digitization', {
      method: 'POST',
      body: formData,
    });
  }

  async extractInformation(request: InformationExtractRequest): Promise<InformationExtractResponse> {
    const base64Data = await this.fileToBase64(request.document);
    
    const body = {
      model: request.model || 'information-extract',
      messages: [{
        role: 'user' as const,
        content: [{
          type: 'image_url' as const,
          image_url: {
            url: `data:application/octet-stream;base64,${base64Data}`
          }
        }]
      }],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extraction_schema',
          schema: request.schema
        }
      }
    };

    return this.makeRequest<InformationExtractResponse>('/information-extraction/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async chatWithSolarLLM(request: SolarLLMRequest): Promise<SolarLLMResponse> {
    const body = {
      model: request.model || 'solar-pro2-preview',
      messages: request.messages,
      reasoning_effort: request.reasoning_effort || 'medium',
      stream: request.stream || false,
      temperature: request.temperature || 0.1,
      max_tokens: request.max_tokens || 4000,
    };

    return this.makeRequest<SolarLLMResponse>('/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async generateSchema(documents: File[]): Promise<object> {
    const messages = [];
    
    for (const doc of documents) {
      const base64Data = await this.fileToBase64(doc);
      messages.push({
        role: 'user' as const,
        content: [{
          type: 'image_url' as const,
          image_url: {
            url: `data:application/octet-stream;base64,${base64Data}`
          }
        }]
      });
    }

    const response = await this.makeRequest<InformationExtractResponse>('/information-extraction/schema-generation/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'information-extract',
        messages: messages
      }),
    });

    return JSON.parse(response.choices[0].message.content);
  }
}

// Create a singleton instance that will be configured with API key from environment
export const upstageAPI = new UpstageAPI(
  import.meta.env.VITE_UPSTAGE_API_KEY || "your_upstage_api_key"
);
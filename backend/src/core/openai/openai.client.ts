import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../logger/logger';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class OpenAIClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = env.openai.apiKey || '';
    if (!this.apiKey) {
      logger.warn('⚠️  OPENAI_API_KEY not configured. AI features will be disabled.');
    }

    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey || ''}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds
    });
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate completion using OpenAI Chat API
   */
  async chatCompletion(
    messages: OpenAIMessage[],
    options: OpenAICompletionOptions = {}
  ): Promise<OpenAIResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key is not configured');
    }

    const {
      model = 'gpt-4o-mini',
      temperature = 0.2,
      maxTokens = 4000,
      responseFormat,
    } = options;

    try {
      const requestBody: any = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      // Ne pas inclure response_format si non défini ou si on veut du texte libre
      if (responseFormat) {
        requestBody.response_format = responseFormat;
      }

      const response = await this.client.post(
        '/chat/completions',
        requestBody,
        {
          timeout: 60000,
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        content,
        usage: response.data.usage,
      };
    } catch (error: any) {
      logger.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error(
        `OpenAI API error: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Retry wrapper for chat completion with exponential backoff
   */
  async chatCompletionWithRetry(
    messages: OpenAIMessage[],
    options: OpenAICompletionOptions = {},
    maxRetries = 2
  ): Promise<OpenAIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.chatCompletion(messages, options);
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn(`OpenAI request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('OpenAI request failed after retries');
  }
}

export default new OpenAIClient();


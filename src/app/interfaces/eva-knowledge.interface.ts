/**
 * Interfaces TypeScript pour le système de base de connaissances EVA
 */

export interface KnowledgeBase {
  version: string;
  updatedAt: string;
  defaultLanguage: string;
  contexts: Context[];
  knowledgeBlocks: KnowledgeBlock[];
  intents: Intent[];
  workflows: Workflow[];
  actions: Action[];
  systemData: SystemData;
  fallbackPolicy: FallbackPolicy;
}

export interface Context {
  id: string;
  label: string;
  description: string;
  systemHints: string[];
}

export interface KnowledgeBlock {
  id: string;
  intentId: string;
  priority: number;
  tags: string[];
  questionTriggers: string[];
  facts: string[];
  keyPoints: string[];
  examples: Example[];
  followUpSuggestions: string[];
}

export interface Example {
  label: string;
  content: string;
}

export interface Intent {
  id: string;
  label: string;
  category: string;
  routingHints: string[];
}

export interface FallbackPolicy {
  minConfidenceToUseKB: number;
  styleGuide: string[];
  fallbackHints: string[];
}

export interface ConversationContext {
  contextId: string;
  userMessage: string;
  conversationHistory: ChatMessage[];
  detectedIntent?: string;
  confidence?: number;
}

export interface ChatMessage {
  type: 'eva' | 'user';
  text: string;
  timestamp: Date;
  metadata?: {
    intentId?: string;
    knowledgeBlockIds?: string[];
    confidence?: number;
  };
}

export interface GPTResponse {
  message: string;
  confidence: number;
  suggestedFollowUps?: string[];
  usedKnowledgeBlocks?: string[];
  detectedIntent?: string;
  entities?: ExtractedEntity[];
  shouldTriggerWorkflow?: boolean;
  workflowId?: string;
  workflowComplete?: boolean; // Indique que le workflow est terminé et prêt pour confirmation
  shouldRedirect?: boolean;
  redirectReason?: string;
}

export interface ExtractedEntity {
  type: 'domain' | 'budget' | 'format' | 'urgency' | 'company' | 'role' | 'location' | 'other';
  value: string;
  confidence: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerIntentIds: string[];
  triggerContextIds?: string[];
  fields: WorkflowField[];
  confirmationMessage: string;
  actionId: string;
}

export interface WorkflowField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'number' | 'date' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  questionVariations?: string[];
  extractionHints?: string[];
}

export interface Action {
  id: string;
  type: 'sendMail' | 'redirect' | 'schedule' | 'notify';
  name: string;
  description: string;
  config: {
    templateId?: string;
    redirectUrl?: string;
    targetEmail?: string;
    subject?: string;
  };
}

export interface SystemData {
  contact: {
    phone: string;
    email: string;
    contactUrl: string;
    address?: string;
  };
  social?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface ConversationMemory {
  sessionId: string;
  contextId: string;
  conversationHistory: ChatMessage[];
  detectedIntents: Array<{
    intentId: string;
    confidence: number;
    timestamp: Date;
  }>;
  usedKnowledgeBlocks: string[];
  activeWorkflow?: {
    workflowId: string;
    currentFieldIndex: number;
    collectedData: { [key: string]: any };
    startedAt: Date;
  };
  extractedEntities: ExtractedEntity[];
  userDecisions: Array<{
    type: 'yes' | 'no' | 'choice' | 'confirmation';
    value: any;
    timestamp: Date;
  }>;
  lastUpdated: Date;
}


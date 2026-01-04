import evaAgentService, { EvaChatInput, EvaChatOutput } from './eva-agent.service';

class EvaChatService {
  async chat(input: EvaChatInput): Promise<EvaChatOutput> {
    return evaAgentService.chat(input);
  }
}

export default new EvaChatService();



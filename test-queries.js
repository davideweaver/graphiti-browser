/**
 * Test multiple queries with timing
 */

import { ToolLoopAgent, tool, zodSchema } from 'ai';
import { ModelFactory } from '@appkit/agents/model';
import { CodeMode } from '@appkit/agents/codemode';
import { z } from 'zod';

const LLAMACPP_URL = process.env.VITE_LLAMACPP_URL || 'http://localhost:9004';
const GROUP_ID = process.env.VITE_GROUP_ID || 'dave-weaver';
const GRAPHITI_URL = 'http://localhost:8000';

// Mock Graphiti service
const mockGraphitiService = {
  async search(query, groupId, maxFacts = 10) {
    const response = await fetch(`${GRAPHITI_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, group_id: groupId, max_facts: maxFacts }),
    });
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    return await response.json();
  },
};

// Initialize
ModelFactory.initialize({
  models: {
    llamacpp: {
      type: 'llamacpp',
      endpoint: `${LLAMACPP_URL}/v1`,
    },
  },
  defaultModel: 'llamacpp',
});

const llmModel = ModelFactory.getModel('llamacpp');
const codeGenModel = ModelFactory.getModel('llamacpp');

const codemode = new CodeMode({
  tools: [
    {
      name: 'graphiti_search',
      description: 'Search the user\'s personal knowledge graph for facts. Returns {facts: Array<{uuid, fact, valid_at}>, count: number}',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxFacts: { type: 'number', description: 'Maximum number of facts to return (default: 10)' },
        },
        required: ['query'],
      },
      execute: async (args) => {
        const results = await mockGraphitiService.search(args.query, GROUP_ID, args.maxFacts || 10);
        return {
          facts: results.facts?.map((f) => ({
            uuid: f.uuid,
            fact: f.fact,
            valid_at: f.valid_at,
          })) || [],
          count: results.facts?.length || 0,
        };
      },
    },
  ],
  timeout: 30000,
  codeGeneratorModel: codeGenModel,
});

const toolDef = codemode.getCodeModeTool();

const agentTool = tool({
  description: toolDef.description,
  inputSchema: zodSchema(
    z.object({
      functionDescription: z
        .string()
        .describe('Natural language description of what you want to accomplish with the available tools'),
    })
  ),
  execute: async (params) => {
    return await toolDef.execute(params);
  },
});

const instructions = `You are a helpful AI assistant with access to the user's Graphiti memory.

You have ONE tool: codemode

When the user asks about their memory, use the codemode tool with a natural language description.

Available Graphiti functions:
- graphiti_search: Search knowledge graph for facts

Guidelines:
- Use codemode tool to search memory for user context
- Be conversational (don't mention "tool calling")
- Answer from general knowledge if no relevant memory`;

const agent = new ToolLoopAgent({
  model: llmModel,
  instructions,
  tools: { codemode: agentTool },
  toolChoice: 'auto',
  maxOutputTokens: 1500,
  temperature: 0.7,
});

// Test queries
const queries = [
  'tell me about my graphiti-server project',
  'what is portainer used for?',
  'what programming languages do i use?',
  'tell me about servicetitan',
  'what did i work on recently?',
];

console.log('🧪 Testing Multiple Queries with Timing\n');
console.log('='.repeat(70));

for (const query of queries) {
  console.log(`\n📝 Query: "${query}"`);
  console.log('-'.repeat(70));

  const startTime = Date.now();

  try {
    const result = await agent.generate({
      messages: [{ role: 'user', content: query }],
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`⏱️  Time: ${elapsed}s`);
    console.log(`📊 Steps: ${result.steps?.length || 0}`);
    console.log(`🏁 Finish: ${result.finishReason}`);
    console.log(`\n💬 Response:\n${result.text}\n`);

    // Show code from first tool call if available
    if (result.steps && result.steps.length > 0) {
      const firstStep = result.steps[0];
      if (firstStep.toolResults && firstStep.toolResults.length > 0) {
        const toolResult = firstStep.toolResults[0];
        if (toolResult.result) {
          try {
            const parsed = JSON.parse(toolResult.result);
            if (parsed.value?.code) {
              console.log(`📝 Generated Code:\n${parsed.value.code}\n`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ Error after ${elapsed}s: ${error.message}\n`);
  }

  console.log('='.repeat(70));
}

console.log('\n✅ All queries completed!');

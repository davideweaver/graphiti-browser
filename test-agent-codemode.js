/**
 * Standalone test script for ToolLoopAgent + CodeMode + Graphiti memory tools
 * Tests the full agent loop with code generation
 *
 * Run with: node test-agent-codemode.js
 */

import { ToolLoopAgent, tool, zodSchema } from 'ai';
import { ModelFactory } from '@appkit/agents/model';
import { CodeMode } from '@appkit/agents/codemode';
import { z } from 'zod';

// Configuration
const LLAMACPP_URL = process.env.VITE_LLAMACPP_URL || 'http://localhost:9004';
const GROUP_ID = process.env.VITE_GROUP_ID || 'dave-weaver';
const GRAPHITI_URL = 'http://localhost:8000';

console.log('🧪 Testing ToolLoopAgent + CodeMode + Graphiti Memory Tools\n');
console.log('Configuration:');
console.log(`  - Llamacpp URL: ${LLAMACPP_URL}/v1`);
console.log(`  - Group ID: ${GROUP_ID}`);
console.log(`  - Graphiti URL: ${GRAPHITI_URL}`);
console.log('');

// Mock Graphiti service (simplified version)
const mockGraphitiService = {
  async search(query, groupId, maxFacts = 10) {
    console.log(`  📡 Calling graphiti_search(query="${query}", groupId="${groupId}", maxFacts=${maxFacts})`);
    try {
      const response = await fetch(`${GRAPHITI_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, group_id: groupId, max_facts: maxFacts }),
      });

      if (!response.ok) {
        throw new Error(`Graphiti search failed: ${response.status}`);
      }

      const data = await response.json();
      console.log(`  ✅ Found ${data.facts?.length || 0} facts`);
      return data;
    } catch (error) {
      console.error(`  ❌ Search error:`, error.message);
      return { facts: [], count: 0 };
    }
  },

  async listEntities(groupId, limit = 20) {
    console.log(`  📡 Calling graphiti_list_entities(groupId="${groupId}", limit=${limit})`);
    try {
      const response = await fetch(`${GRAPHITI_URL}/entities?group_id=${groupId}&limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Graphiti list entities failed: ${response.status}`);
      }

      const data = await response.json();
      console.log(`  ✅ Found ${data.entities?.length || 0} entities`);
      return data;
    } catch (error) {
      console.error(`  ❌ List entities error:`, error.message);
      return { entities: [], total: 0 };
    }
  },

  async getEntity(uuid, groupId) {
    console.log(`  📡 Calling graphiti_get_entity(uuid="${uuid}", groupId="${groupId}")`);
    try {
      const response = await fetch(`${GRAPHITI_URL}/entities/${uuid}?group_id=${groupId}`);

      if (!response.ok) {
        throw new Error(`Graphiti get entity failed: ${response.status}`);
      }

      const entity = await response.json();
      console.log(`  ✅ Retrieved entity: ${entity.name}`);

      // Get relationships
      const relResponse = await fetch(`${GRAPHITI_URL}/entities/${uuid}/relationships?group_id=${groupId}`);
      const relationships = relResponse.ok ? await relResponse.json() : [];

      return { entity, relationships };
    } catch (error) {
      console.error(`  ❌ Get entity error:`, error.message);
      return { entity: null, relationships: [] };
    }
  },
};

// Initialize ModelFactory
console.log('='.repeat(60));
console.log('STEP 1: Initialize ModelFactory');
console.log('='.repeat(60));

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

console.log('✅ Models initialized');
console.log('');

// Initialize CodeMode with Graphiti tools
console.log('='.repeat(60));
console.log('STEP 2: Initialize CodeMode with Graphiti tools');
console.log('='.repeat(60));

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
    {
      name: 'graphiti_list_entities',
      description: 'Browse/list entities in the knowledge graph. Returns {entities: Array<{uuid, name, labels, summary}>, total: number}',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of entities to return (default: 20)' },
        },
        required: [],
      },
      execute: async (args) => {
        const results = await mockGraphitiService.listEntities(GROUP_ID, args.limit || 20);
        return {
          entities: results.entities?.map((e) => ({
            uuid: e.uuid,
            name: e.name,
            labels: e.labels,
            summary: e.summary,
          })) || [],
          total: results.total || 0,
        };
      },
    },
    {
      name: 'graphiti_get_entity',
      description: 'Get entity details and relationships by UUID. Returns {entity: {...}, relationships: [...]}',
      parameters: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Entity UUID to retrieve' },
        },
        required: ['uuid'],
      },
      execute: async (args) => {
        return await mockGraphitiService.getEntity(args.uuid, GROUP_ID);
      },
    },
  ],
  timeout: 30000,
  codeGeneratorModel: codeGenModel,
});

console.log('✅ CodeMode initialized with 3 Graphiti tools');
console.log('');

// Get codemode tool for ToolLoopAgent
console.log('='.repeat(60));
console.log('STEP 3: Create ToolLoopAgent tool wrapper');
console.log('='.repeat(60));

const toolDef = codemode.getCodeModeTool();
console.log('Tool definition:', {
  name: toolDef.name,
  hasDescription: !!toolDef.description,
  hasParameters: !!toolDef.parameters,
  hasExecute: typeof toolDef.execute === 'function',
});

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
    console.log('\n🔨 TOOL EXECUTION STARTED');
    console.log('   Function Description:', params.functionDescription);
    console.log('');

    try {
      const result = await toolDef.execute(params);
      console.log('\n✅ TOOL EXECUTION COMPLETED');
      console.log('   Success:', result.success);
      if (result.code) {
        console.log('   Generated Code:');
        console.log('   ' + result.code.split('\n').join('\n   '));
      }
      if (result.result) {
        console.log('   Execution Result:', JSON.stringify(result.result, null, 2));
      }
      if (result.error) {
        console.log('   Error:', result.error);
      }
      console.log('');
      return result;
    } catch (error) {
      console.error('\n❌ TOOL EXECUTION FAILED');
      console.error('   Error:', error.message);
      console.error('');
      throw error;
    }
  },
});

console.log('✅ Tool wrapper created');
console.log('');

// Create ToolLoopAgent
console.log('='.repeat(60));
console.log('STEP 4: Create ToolLoopAgent');
console.log('='.repeat(60));

const instructions = `You are a helpful AI assistant with access to the user's Graphiti memory.

You have ONE tool: codemode

When the user asks about their memory, use the codemode tool with a natural language description.

Available Graphiti functions:
- graphiti_search: Search knowledge graph for facts
- graphiti_list_entities: Browse entities in the graph
- graphiti_get_entity: Get entity details and relationships

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
  // maxSteps: 5,  // Use default (should be 10-20)
});

console.log('✅ ToolLoopAgent created');
console.log('   Max steps: default');
console.log('');

// Test the agent
console.log('='.repeat(60));
console.log('STEP 5: Run Agent with Test Query');
console.log('='.repeat(60));

// Test multiple queries to ensure consistency
const testQueries = [
  'tell me about my graphiti-server project',
  'what projects do i have?',
  'who is dave weaver?',
];

const selectedQuery = testQueries[0];  // Back to graphiti-server query
console.log(`User: "${selectedQuery}"\n`);

// Try non-streaming first to see if that works
try {
  console.log('Attempting non-streaming generate...\n');

  const result = await agent.generate({
    messages: [{ role: 'user', content: selectedQuery }],
  });

  console.log('\n✅ Generate completed!');
  console.log('Finish reason:', result.finishReason);
  console.log('Steps:', result.steps?.length || 0);
  console.log('\nResponse:');
  console.log(result.text || '(No text)');

  if (result.steps) {
    console.log('\n\nStep Details:');
    result.steps.forEach((step, i) => {
      console.log(`\nStep ${i + 1}:`);
      console.log('  Finish reason:', step.finishReason);
      console.log('  Tool calls:', step.toolCalls?.length || 0);
      console.log('  Tool results:', step.toolResults?.length || 0);
      if (step.toolCalls) {
        step.toolCalls.forEach(tc => {
          console.log(`    - Tool: ${tc.toolName}, Args:`, tc.args);
        });
      }
      if (step.toolResults) {
        step.toolResults.forEach(tr => {
          const resultStr = tr.result ? JSON.stringify(tr.result) : '(no result)';
          console.log(`    - Result for ${tr.toolName}:`, resultStr.substring(0, 200));
        });
      }
    });
  }

} catch (error) {
  console.error('\n❌ Agent generate failed:', error.message);
  console.error('Stack:', error.stack);

  // Try streaming as fallback
  console.log('\n\nTrying streaming instead...\n');
  try {
    const { fullStream } = await agent.stream({
      messages: [{ role: 'user', content: selectedQuery }],
    });

    let stepCount = 0;
    let finalText = '';

    for await (const event of fullStream) {
      switch (event.type) {
        case 'start-step':
          stepCount++;
          console.log(`\n📍 STEP ${stepCount} STARTED`);
          break;

        case 'text-delta':
          finalText += event.delta;
          process.stdout.write(event.delta);
          break;

        case 'tool-input-start':
          console.log(`\n\n🔧 Tool called: ${event.toolName}`);
          break;

        case 'tool-result':
          console.log(`\n✅ Tool result received for: ${event.toolName}`);
          break;

        case 'finish-step':
          console.log(`\n🏁 Step ${stepCount} finished: ${event.finishReason}`);
          break;

        case 'finish':
          console.log(`\n\n🎉 AGENT FINISHED: ${event.finishReason}`);
          break;

        case 'error':
          console.error(`\n❌ ERROR:`, event.error);
          break;
      }
    }

    console.log('\n\nFinal text:', finalText || '(No text)');
  } catch (streamError) {
    console.error('Streaming also failed:', streamError.message);
  }
}

console.log('='.repeat(60));
console.log('TEST COMPLETE');
console.log('='.repeat(60));

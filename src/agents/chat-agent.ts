import { ToolLoopAgent, tool, zodSchema } from 'ai';
import { ModelFactory } from '@appkit/agents/model';
import { graphitiService } from '@/api/graphitiService';
import { z } from 'zod';
import type { LanguageModelV3 } from '@ai-sdk/provider';

export interface ChatAgentConfig {
  groupId: string;
  provider: 'llamacpp' | 'openrouter';
  llamacppUrl?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
}

export function createChatAgent(config: ChatAgentConfig) {
  const {
    groupId,
    provider,
    llamacppUrl = 'http://localhost:9004',
    openrouterApiKey,
    openrouterModel = 'openai/gpt-4o-mini',
  } = config;

  // Initialize ModelFactory with both providers
  if (!ModelFactory.isInitialized()) {
    const models: any = {};

    // Always configure llamacpp
    models.llamacpp = {
      type: 'llamacpp',
      endpoint: `${llamacppUrl}/v1`,
    };

    // Configure OpenRouter if API key provided
    if (openrouterApiKey) {
      models.openrouter = {
        type: 'openrouter',
        model: openrouterModel,
        apiKey: openrouterApiKey,
      };
    }

    ModelFactory.initialize({
      models,
      defaultModel: provider,
    });
  }

  const llmModel = ModelFactory.getModel(provider);

  console.log(`🔧 Creating agent with provider: ${provider}`);

  // Define Graphiti tools directly (browser-compatible, no CodeMode)
  const graphitiSearchTool = tool({
    description: 'Search the user\'s personal knowledge graph for facts. Returns relevant facts about the query.',
    inputSchema: zodSchema(
      z.object({
        query: z.string().describe('The search query to find relevant facts'),
        maxFacts: z.number().optional().describe('Maximum number of facts to return (default: 10)'),
      })
    ),
    execute: async ({ query, maxFacts = 10 }) => {
      console.log(`🔍 Searching Graphiti: "${query}" (max: ${maxFacts})`);
      try {
        const results = await graphitiService.search(query, groupId, maxFacts);
        const facts = results.facts.map((f) => ({
          uuid: f.uuid,
          fact: f.fact,
          valid_at: f.valid_at,
        }));
        console.log(`✅ Found ${facts.length} facts`);
        return {
          facts,
          count: facts.length,
        };
      } catch (error) {
        console.error('❌ Search error:', error);
        return { facts: [], count: 0, error: String(error) };
      }
    },
  });

  const graphitiListEntitiesTool = tool({
    description: 'Browse/list entities in the knowledge graph. Returns a list of entities with names, labels, and summaries.',
    inputSchema: zodSchema(
      z.object({
        limit: z.number().optional().describe('Maximum number of entities to return (default: 20)'),
        nameFilter: z.string().optional().describe('Filter entities by name substring'),
        label: z.string().optional().describe('Filter entities by label/type'),
      })
    ),
    execute: async ({ limit = 20, nameFilter, label }) => {
      console.log(`📋 Listing entities (limit: ${limit}, filter: ${nameFilter || 'none'}, label: ${label || 'none'})`);
      try {
        const results = await graphitiService.listEntities(
          groupId,
          limit,
          undefined,
          'created_at',
          'desc',
          nameFilter,
          label
        );
        const entities = results.entities.map((e) => ({
          uuid: e.uuid,
          name: e.name,
          labels: e.labels,
          summary: e.summary,
        }));
        console.log(`✅ Found ${entities.length} entities`);
        return {
          entities,
          total: results.total,
        };
      } catch (error) {
        console.error('❌ List entities error:', error);
        return { entities: [], total: 0, error: String(error) };
      }
    },
  });

  const graphitiGetEntityTool = tool({
    description: 'Get detailed information about a specific entity by UUID, including its relationships.',
    inputSchema: zodSchema(
      z.object({
        uuid: z.string().describe('The UUID of the entity to retrieve'),
      })
    ),
    execute: async ({ uuid }) => {
      console.log(`🔍 Getting entity: ${uuid}`);
      try {
        const entity = await graphitiService.getEntity(uuid, groupId);
        const relationships = await graphitiService.getEntityRelationships(uuid, groupId);
        console.log(`✅ Retrieved entity: ${entity.name}`);
        return { entity, relationships };
      } catch (error) {
        console.error('❌ Get entity error:', error);
        return { entity: null, relationships: [], error: String(error) };
      }
    },
  });

  // System instructions
  const instructions = `You are a helpful AI assistant with access to the user's Graphiti memory.

You have THREE tools to search and browse the user's personal knowledge graph:

1. **graphiti_search** - Search for facts by query
   - Use this when the user asks about specific topics, projects, people, or information
   - Returns facts with confidence scores

2. **graphiti_list_entities** - Browse entities in the graph
   - Use this to explore what entities exist
   - Can filter by name or type/label

3. **graphiti_get_entity** - Get details about a specific entity
   - Use this after finding an entity UUID to get full details
   - Returns entity info and all its relationships

Guidelines:
- ALWAYS search memory first when the user asks about personal information, projects, or people
- Be conversational and natural (don't mention "tool calling")
- If no relevant memory is found, acknowledge it and offer to help from general knowledge
- When you find relevant facts, cite them naturally in your response`;

  // Register all three tools
  const tools = {
    graphiti_search: graphitiSearchTool,
    graphiti_list_entities: graphitiListEntitiesTool,
    graphiti_get_entity: graphitiGetEntityTool,
  };

  console.log('✅ Registered 3 Graphiti tools');

  return new ToolLoopAgent({
    model: llmModel as LanguageModelV3,
    instructions,
    tools,
    toolChoice: 'auto',
    maxOutputTokens: 1500,
    temperature: 0.7,
  });
}

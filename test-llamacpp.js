/**
 * Standalone test script for llamacpp tool calling
 * Run with: node test-llamacpp.js
 */

import { ModelFactory } from '@appkit/agents/model';

// Configuration
const LLAMACPP_URL = process.env.VITE_LLAMACPP_URL || 'http://localhost:9004';

console.log('🧪 Testing llamacpp tool calling capability\n');
console.log('Configuration:');
console.log(`  - Llamacpp URL: ${LLAMACPP_URL}/v1`);
console.log('');

// Initialize ModelFactory
ModelFactory.initialize({
  models: {
    test: {
      type: 'llamacpp',
      endpoint: `${LLAMACPP_URL}/v1`,
    },
  },
  defaultModel: 'test',
});

const model = ModelFactory.getModel('test');

// Test 1: Simple text generation (no tools)
console.log('='.repeat(60));
console.log('TEST 1: Simple text generation (baseline)');
console.log('='.repeat(60));

try {
  const response = await model.doGenerate({
    prompt: [
      {
        role: 'user',
        content: [{ type: 'text', text: 'Say "Hello World" and nothing else.' }],
      },
    ],
  });

  console.log('✅ Simple generation works!');
  console.log('Response:', response.content[0]?.text || JSON.stringify(response.content));
  console.log('');
} catch (error) {
  console.error('❌ Simple generation failed:', error.message);
  console.log('');
}

// Test 2: Tool calling with simple function
console.log('='.repeat(60));
console.log('TEST 2: Tool calling with simple function');
console.log('='.repeat(60));

const simpleTool = {
  type: 'function',
  name: 'get_weather',
  description: 'Get the weather for a location',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city name',
      },
    },
    required: ['location'],
  },
};

console.log('Tool definition:');
console.log(JSON.stringify(simpleTool, null, 2));
console.log('');

try {
  console.log('Calling model with tool...');
  const response = await model.doGenerate({
    prompt: [
      {
        role: 'user',
        content: [{ type: 'text', text: 'What is the weather in Tokyo? Use the get_weather function.' }],
      },
    ],
    tools: [simpleTool],
    toolChoice: { type: 'auto' },
  });

  console.log('✅ Tool calling completed!');
  console.log('Finish reason:', response.finishReason);
  console.log('');

  console.log('Response content:');
  for (const item of response.content) {
    if (item.type === 'text') {
      console.log('  [Text]:', item.text);
    } else if (item.type === 'tool-call') {
      console.log('  [Tool Call]:');
      console.log('    - Tool:', item.toolName);
      console.log('    - ID:', item.toolCallId);
      console.log('    - Input:', item.input);
    }
  }
  console.log('');

  // Check if tool was called
  const toolCalls = response.content.filter((c) => c.type === 'tool-call');
  if (toolCalls.length === 0) {
    console.log('⚠️  WARNING: No tool calls found in response!');
    console.log('The model did not call the function.');
  } else {
    console.log('✅ Tool was called successfully!');
  }
  console.log('');
} catch (error) {
  console.error('❌ Tool calling failed:', error.message);
  console.error('Stack:', error.stack);
  console.log('');
}

// Test 3: Streaming tool calling
console.log('='.repeat(60));
console.log('TEST 3: Streaming tool calling');
console.log('='.repeat(60));

try {
  console.log('Starting stream...');
  const result = await model.doStream({
    prompt: [
      {
        role: 'user',
        content: [{ type: 'text', text: 'What is the weather in Paris? Use the get_weather function.' }],
      },
    ],
    tools: [simpleTool],
    toolChoice: { type: 'auto' },
  });

  console.log('✅ Stream started!');
  console.log('');

  let textContent = '';
  let toolCalls = [];
  const events = [];

  for await (const chunk of result.stream) {
    events.push({ type: chunk.type, data: chunk });

    if (chunk.type === 'text-delta') {
      textContent += chunk.delta;
      process.stdout.write(chunk.delta);
    } else if (chunk.type === 'tool-input-start') {
      console.log('\n  [Tool Input Start]:', chunk.toolName);
    } else if (chunk.type === 'tool-input-delta') {
      console.log('  [Tool Input Delta]:', chunk.delta);
    } else if (chunk.type === 'tool-input-end') {
      console.log('  [Tool Input End]');
    } else if (chunk.type === 'finish') {
      console.log('\n  [Finish]:', chunk.finishReason);
    }
  }

  console.log('');
  console.log('Stream events received:', events.length);
  console.log('Event types:', [...new Set(events.map((e) => e.type))].join(', '));
  console.log('');

  const toolInputEvents = events.filter((e) => e.type.startsWith('tool-input'));
  if (toolInputEvents.length === 0) {
    console.log('⚠️  WARNING: No tool input events in stream!');
  } else {
    console.log('✅ Tool input events found:', toolInputEvents.length);
    console.log('');
    console.log('Tool input deltas:');
    toolInputEvents
      .filter((e) => e.type === 'tool-input-delta')
      .forEach((e, i) => {
        console.log(`  Delta ${i + 1}:`, JSON.stringify(e.data.delta));
      });
  }
  console.log('');
} catch (error) {
  console.error('❌ Streaming failed:', error.message);
  console.error('Stack:', error.stack);
  console.log('');
}

// Summary
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log('If you see "No tool calls found" or "No tool input events",');
console.log('your llamacpp model does not properly support tool calling.');
console.log('');
console.log('Solutions:');
console.log('1. Use OpenRouter for main LLM (tool calling)');
console.log('2. Load a tool-calling capable model in llamacpp:');
console.log('   - Llama 3.1 8B or larger');
console.log('   - Hermes 2 Pro');
console.log('   - Qwen2.5');
console.log('3. Check if your llamacpp server needs special flags for tool calling');
console.log('='.repeat(60));

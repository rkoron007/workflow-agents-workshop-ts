import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveClient, resolveModelSpec } from '@workshop/agent'
import type { CompleteArgs } from '@workshop/agent'

test('resolveModelSpec maps tiers and infers providers', () => {
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.OPENAI_API_KEY
  assert.equal(resolveModelSpec('medium').provider, 'anthropic')
  assert.equal(resolveModelSpec().model, resolveModelSpec('medium').model) // default = medium
  assert.equal(resolveModelSpec('gpt-4o').provider, 'openai')
  assert.equal(resolveModelSpec('claude-sonnet-4-6').provider, 'anthropic')
})

test('resolveModelSpec tier selection supports both providers', () => {
  const prevAnthropic = process.env.ANTHROPIC_API_KEY
  const prevOpenAI = process.env.OPENAI_API_KEY
  try {
    delete process.env.ANTHROPIC_API_KEY
    process.env.OPENAI_API_KEY = 'test-openai'
    assert.equal(resolveModelSpec('medium').provider, 'openai')
    assert.equal(resolveModelSpec('medium').model, 'gpt-4o')

    process.env.ANTHROPIC_API_KEY = 'test-anthropic'
    assert.equal(resolveModelSpec('medium').provider, 'anthropic')
    assert.equal(resolveModelSpec('medium').model, 'claude-sonnet-4-6')

    assert.equal(resolveModelSpec('medium', 'openai').provider, 'openai')
    assert.equal(resolveModelSpec('medium', 'openai').model, 'gpt-4o')
  } finally {
    if (prevAnthropic === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = prevAnthropic
    if (prevOpenAI === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = prevOpenAI
  }
})

function args(system: string): CompleteArgs {
  return {
    model: { provider: 'mock', model: 'mock' },
    system,
    tools: [],
    messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
    signal: new AbortController().signal,
  }
}

test('mock client returns a JSON verdict for the judge', async () => {
  const client = resolveClient({ provider: 'mock', model: 'mock' })
  const res = await client.complete(args('# Judge\nYou decide.'))
  const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  const parsed = JSON.parse(text)
  assert.equal(parsed.verdict, 'approve')
})

test('mock client returns a finding for a reviewer', async () => {
  const client = resolveClient({ provider: 'mock', model: 'mock' })
  const res = await client.complete(args('# Security reviewer'))
  const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  assert.match(text, /severity/)
})

/**
 * Model tier mapping. One place to update when new models ship.
 *
 *   medium → resolved via MODEL_TIERS
 *   gpt-4o → raw passthrough, provider inferred
 */
import { inferProvider, isTier } from './helpers.js'
import type { ModelSpec } from './types.js'

export type ModelTier = 'small' | 'medium' | 'large'

export const MODEL_TIERS: Record<ModelTier, Record<'anthropic' | 'openai', ModelSpec>> = {
  small: {
    anthropic: { provider: 'anthropic', model: 'claude-haiku-4-5' },
    openai: { provider: 'openai', model: 'gpt-4o-mini' },
  },
  medium: {
    anthropic: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    openai: { provider: 'openai', model: 'gpt-4o' },
  },
  large: {
    anthropic: { provider: 'anthropic', model: 'claude-opus-4-6' },
    openai: { provider: 'openai', model: 'o3' },
  },
}

export function resolveModelSpec(model?: string, provider?: string): ModelSpec {
  const modelName = model ?? 'medium'
  if (isTier(modelName)) {
    const chosenProvider = selectTierProvider(provider)
    return { ...MODEL_TIERS[modelName][chosenProvider] }
  }
  return {
    provider: (provider as ModelSpec['provider']) ?? inferProvider(modelName),
    model: modelName,
  }
}

function selectTierProvider(provider?: string): 'anthropic' | 'openai' {
  if (provider === 'anthropic' || provider === 'openai') return provider
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'anthropic'
}

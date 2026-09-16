import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { getDb } from './client'
import type { LlmProvider, TravelMode, UserSettingsPublic } from '../../shared/types'

export type StoredKeys = Partial<Record<LlmProvider, string>>

function secretKey(): Buffer {
  const raw = process.env.APP_SECRET || process.env.SESSION_SECRET || 'tripplanner-dev-secret-change-me'
  return createHash('sha256').update(raw).digest()
}

export function encryptKeys(keys: StoredKeys): string {
  const payload = JSON.stringify(keys)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv)
  const enc = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decryptKeys(blob: string): StoredKeys {
  if (!blob) return {}
  try {
    const [ivHex, tagHex, dataHex] = blob.split(':')
    if (!ivHex || !tagHex || !dataHex) return {}
    const decipher = createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const out = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8')
    return JSON.parse(out) as StoredKeys
  } catch {
    return {}
  }
}

const PROVIDERS: LlmProvider[] = ['openai', 'anthropic', 'gemini', 'groq', 'openrouter']

function asProvider(v: string | null | undefined): LlmProvider {
  return PROVIDERS.includes(v as LlmProvider) ? (v as LlmProvider) : 'openai'
}

function asMode(v: string | null | undefined): TravelMode {
  return v === 'bike' || v === 'bus' || v === 'train' || v === 'car' ? v : 'car'
}

export async function getUserSettings(userId: string): Promise<{
  public: UserSettingsPublic
  keys: StoredKeys
}> {
  const db = getDb()
  const rows = await db<{
    preferred_provider: string
    preferred_model: string
    preferred_mode: string
    home_city: string | null
    encrypted_keys: string
  }[]>`
    SELECT preferred_provider, preferred_model, preferred_mode, home_city, encrypted_keys
    FROM user_settings
    WHERE user_id = ${userId}
    LIMIT 1
  `
  if (!rows[0]) {
    return {
      public: {
        preferredProvider: 'openai',
        preferredModel: 'gpt-4o-mini',
        preferredMode: 'car',
        configuredProviders: [],
        homeCity: null,
      },
      keys: {},
    }
  }
  const keys = decryptKeys(rows[0].encrypted_keys)
  return {
    public: {
      preferredProvider: asProvider(rows[0].preferred_provider),
      preferredModel: rows[0].preferred_model || 'gpt-4o-mini',
      preferredMode: asMode(rows[0].preferred_mode),
      configuredProviders: PROVIDERS.filter((p) => Boolean(keys[p]?.trim())),
      homeCity: rows[0].home_city,
    },
    keys,
  }
}

export async function upsertUserSettings(
  userId: string,
  input: {
    preferredProvider?: LlmProvider
    preferredModel?: string
    preferredMode?: TravelMode
    homeCity?: string | null
    keys?: StoredKeys
  },
): Promise<UserSettingsPublic> {
  const current = await getUserSettings(userId)
  const nextKeys: StoredKeys = { ...current.keys }
  if (input.keys) {
    for (const provider of PROVIDERS) {
      const value = input.keys[provider]
      if (value === undefined) continue
      const trimmed = value.trim()
      if (!trimmed) {
        delete nextKeys[provider]
      } else if (!trimmed.includes('••••')) {
        nextKeys[provider] = trimmed
      }
    }
  }

  const preferredProvider = input.preferredProvider ?? current.public.preferredProvider
  const preferredModel = input.preferredModel ?? current.public.preferredModel
  const preferredMode = input.preferredMode ?? current.public.preferredMode
  const homeCity =
    input.homeCity === undefined ? current.public.homeCity ?? null : input.homeCity
  const encrypted = encryptKeys(nextKeys)

  const db = getDb()
  await db`
    INSERT INTO user_settings (
      user_id, preferred_provider, preferred_model, preferred_mode, home_city, encrypted_keys, updated_at
    )
    VALUES (
      ${userId}, ${preferredProvider}, ${preferredModel}, ${preferredMode}, ${homeCity}, ${encrypted}, now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      preferred_provider = EXCLUDED.preferred_provider,
      preferred_model = EXCLUDED.preferred_model,
      preferred_mode = EXCLUDED.preferred_mode,
      home_city = EXCLUDED.home_city,
      encrypted_keys = EXCLUDED.encrypted_keys,
      updated_at = now()
  `

  return {
    preferredProvider,
    preferredModel,
    preferredMode,
    configuredProviders: PROVIDERS.filter((p) => Boolean(nextKeys[p]?.trim())),
    homeCity,
  }
}

import { app } from 'electron'
import { realpathSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

// -----------------------------------------------------------------
// Input schemas for every IPC handler.
//
// Rules:
//  - Phone numbers are digits-only, 7-15 chars (E.164 range).
//  - Text is capped at 65 536 chars.
//  - Attachment paths must resolve inside the user-data attachment dir.
//  - Group/chat IDs are limited to a WhatsApp-shaped pattern.
// -----------------------------------------------------------------

const PhoneNumber = z.string()
  .trim()
  .transform(s => s.replace(/\D/g, ''))
  .refine(s => s.length >= 7 && s.length <= 15, { message: 'number must be 7-15 digits' })

const MessageText = z.string().max(65_536)

// WhatsApp IDs look like `123456789@c.us` (individual) or `...@g.us` (group).
const WaId = z.string()
  .trim()
  .regex(/^[0-9A-Za-z._-]{5,64}@(c|g|broadcast)\.us$/, 'invalid WhatsApp id')

const GroupIdLoose = z.union([WaId, z.string().regex(/^\d{10,20}(-\d+)?$/, 'invalid group id')])

const InviteCode = z.string()
  .trim()
  .max(256)
  .transform(s => s.replace(/^https?:\/\/chat\.whatsapp\.com\//i, '').trim())
  .refine(s => /^[A-Za-z0-9_-]{10,32}$/.test(s), { message: 'invalid invite code' })

function attachmentsDir() {
  return path.join(app.getPath('userData'), 'attachments')
}

function isInsideSandbox(p: string): boolean {
  try {
    const base = realpathSync(attachmentsDir())
    const real = realpathSync(p)
    const rel = path.relative(base, real)
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
  } catch {
    return false
  }
}

const AttachmentPath = z.string()
  .max(4096)
  .refine(isInsideSandbox, {
    message: `attachment must live under ${attachmentsDir()}`,
  })

export const Schemas = {
  SendMessage: z.tuple([
    PhoneNumber,
    MessageText,
    AttachmentPath.optional(),
  ]),

  SendPoll: z.tuple([
    PhoneNumber,
    z.string().min(1).max(255),                  // question
    z.array(z.string().min(1).max(100)).min(2).max(12), // options
    z.boolean(),                                  // allowMultiple
  ]),

  GroupId: z.tuple([GroupIdLoose]),
  JoinGroup: z.tuple([InviteCode]),
  CheckNumber: z.tuple([PhoneNumber]),

  CreateGroup: z.tuple([
    z.string().min(1).max(100),
    z.array(PhoneNumber).min(1).max(256),
  ]),

  GroupParticipants: z.tuple([
    GroupIdLoose,
    z.array(PhoneNumber).min(1).max(256),
  ]),

  AutoResponderRules: z.tuple([
    z.array(z.object({
      id: z.string().max(64).optional(),
      keyword: z.string().min(1).max(255),
      matchType: z.enum(['exact', 'contains']),
      replyText: z.string().min(1).max(4096),
    })).max(128),
  ]),

  Campaign: z.tuple([
    z.object({
      id: z.string().min(1).max(64),
      name: z.string().min(1).max(128),
      status: z.enum(['Completed', 'Running', 'Paused', 'Failed']),
      sent: z.number().int().min(0).max(10_000_000),
      total: z.number().int().min(0).max(10_000_000),
      date: z.string().max(64),
    }),
  ]),

  IncrementSent: z.tuple([z.number().int().min(0).max(10_000)]),

  CampaignId: z.tuple([z.string().min(1).max(64)]),

  LicenseKey: z.tuple([
    z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9_\-]+$/, 'invalid license key'),
  ]),
}

export function ensureAttachmentDir() {
  const dir = attachmentsDir()
  try {
    const fs = require('node:fs') as typeof import('node:fs')
    fs.mkdirSync(dir, { recursive: true })
  } catch { /* ignore */ }
  return dir
}

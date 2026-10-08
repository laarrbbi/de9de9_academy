import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SHELF_KEYS } from './data/shelves';

/**
 * Lessons: ../content/lessons/<locale>/<track>/<lesson>.md (shared with the app)
 *
 * The entry id is the path without extension, e.g. "fr/plomberie/deboucher-un-evier".
 * The same lesson in the other language has the same <track>/<lesson> path,
 * and the root tests/content.test.mjs checks the two stay in step.
 */
const lessons = defineCollection({
  loader: glob({ pattern: '{fr,ar}/*/*.md', base: '../content/lessons' }),
  schema: z
    .object({
      title: z.string().min(1),
      summary: z.string().min(1),
      order: z.number().int().positive(),
      minutes: z.number().int().positive(),
      level: z.enum(['beginner', 'intermediate']),
      /** How much can go wrong. Anything above "low" must state its safety rule. */
      risk: z.enum(['low', 'medium', 'high']),
      safety: z.string().optional(),
      tools: z
        .array(z.object({ name: z.string().min(1), shelf: z.enum(SHELF_KEYS).optional() }))
        .min(1),
      /** Signs that the job is no longer a DIY job. */
      callAPro: z.array(z.string().min(1)).default([]),
      quiz: z
        .array(
          z.object({
            question: z.string().min(1),
            options: z.array(z.string().min(1)).min(2).max(4),
            answer: z.number().int().min(0),
            explanation: z.string().min(1),
          }),
        )
        .min(1)
        .max(5),
    })
    .superRefine((lesson, ctx) => {
      if (lesson.risk !== 'low' && lesson.safety === undefined) {
        ctx.addIssue({ code: 'custom', path: ['safety'], message: `A "${lesson.risk}" risk lesson needs a safety rule.` });
      }
      if (lesson.risk !== 'low' && lesson.callAPro.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['callAPro'], message: `A "${lesson.risk}" risk lesson must say when to call a pro.` });
      }
      lesson.quiz.forEach((q, i) => {
        if (q.answer >= q.options.length) {
          ctx.addIssue({ code: 'custom', path: ['quiz', i, 'answer'], message: 'Answer index is out of range.' });
        }
      });
    }),
});

export const collections = { lessons };

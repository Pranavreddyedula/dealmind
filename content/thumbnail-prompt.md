# DealMind — Thumbnail Generation Prompt

## Image-Generation Prompt (copy verbatim into Midjourney / SDXL / similar)

```
A premium SaaS product thumbnail, 16:9 aspect ratio, photoreal clean modern aesthetic.

Split-screen composition divided by a thin vertical emerald line down the center.

LEFT HALF — labeled mood: "WITHOUT MEMORY". A modern glass-walled sales meeting room, a sales rep in business-casual seated across from a customer at a sleek wooden conference table. The rep looks slightly lost, glancing at a blank laptop screen, expression uncertain. Cool, muted, desaturated slate-grey color grade. An empty thought bubble above the rep's head with a faded, blurry question mark. The scene feels generic and forgetful. Soft flat overhead lighting.

RIGHT HALF — labeled mood: "WITH HINDSIGHT MEMORY". The exact same sales meeting room and same two people, same camera angle, but now warm and confident. The rep is engaged, leaning slightly forward, laptop screen glowing softly with organized briefing cards. Three small floating emerald memory chips hover subtly above the laptop, each containing a tiny legible pictogram: a dollar sign (price objection), a small Vs.-style versus icon (competitor), and a plug/link icon (CRM integration). Confident, focused expressions. The thought bubble above the rep's head is replaced by a crisp emerald glow ring.

COLOR PALETTE: primary emerald green (#10B981) and deep teal accents; supporting slate greys (#0F172A, #1E293B, #475569); clean off-white highlights (#F8FAFC). Strictly avoid pure blue and indigo as primary colors — no purple-blue gradients anywhere. Emerald should dominate the right half; slate grey should dominate the left half.

LIGHTING: soft studio key light from upper left, gentle rim light on the right half to emphasize the emerald glow. Subtle bokeh on the background glass wall. No harsh shadows.

COMPOSITION: symmetrical split, subjects centered in each half, generous negative space at top and bottom for thumbnail-safe framing. High detail on faces and hands, clean modern product-design polish, Apple-keynote level of finish.

TEXT: minimal to none. A single small monospace label "vs" floating on the dividing emerald line is acceptable. No other text, no logos, no watermarks.

MOOD: the left half reads "uncertain, cold, forgetful"; the right half reads "confident, warm, informed". The contrast should be instantly readable at 1280x720.

--ar 16:9 --style raw --v 6
```

## Rationale

- **Split-screen** is the single most reliable device for communicating a before/after story at thumbnail scale, and DealMind's entire pitch *is* before/after (memory off vs memory on).
- **Emerald + slate** is the DealMind brand palette and avoids the over-used blue/indigo "AI gradient" that every generic LLM thumbnail uses — the color itself differentiates the product visually from the sea of ChatGPT-style purple/blue thumbnails.
- The **three floating memory chips** (price / competitor / CRM integration) make the Rahul demo concrete without words — a viewer who has read the title will instantly decode them; a viewer who hasn't will still register "this agent remembers specific facts."
- The **same room, same people, different mood** framing makes the *only variable* (memory) unmistakable — which is the literal thesis of the product.
- Minimal text keeps the thumbnail legible at small sizes and on mobile, where most YouTube impressions are decided.

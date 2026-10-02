# Portrait assets

Prepared using the built-in imagegen tool from the user's supplied portrait. These are AI-adapted campaign assets, not store photography. The original output files remain in the generator folder. Project copies are encoded as WebP without altering their composition.

- `public/hero-portrait.webp`: 1586 × 992, 62,654 bytes.
- `public/hero-clean.webp`: clean background plate, 1586 × 992, 92,032 bytes.
- `src/FrameArtwork.tsx`: SVG mask of the original glasses pixels, with a matching vector material pass for clarity. The earlier generated cutout is no longer used or shipped.

## Hero prompt

Edit the attached portrait for a premium eyewear website hero. Preserve exactly this woman's identity, face, hair, black blouse, pose, and especially the exact black cat-eye eyeglasses she wears, including their angle, shape, thickness and reflections. Preserve the original realistic photographic appearance. Create a wide 1600x1000 composition by extending the existing plain white / light grey studio wall to the left. Place the original woman on the right half, with her complete head visible and upper torso continuing to the bottom edge. Leave the left 45 percent clean pale grey negative space for website typography. Do not add text, logos, products, a store, new accessories, or different glasses. This is an identity-preserving outpaint, not a new portrait. Keep the lighting and natural skin detail of the original.

## Earlier frame prompt (superseded result)

Create a precise transparent cutout of the black eyeglasses in the provided WOMAN portrait. Preserve the original tilt rising to the right, smaller left lens, larger right lens, asymmetry and photographed perspective. The lens front rises approximately 12 degrees from left to right. ONLY thin glossy black cat-eye frame rims, black bridge and short right temple. CRITICAL: the two lens holes must be COMPLETELY EMPTY TRANSPARENT ALPHA, no white surface, no grey glass, no eyes, no face. Background fully transparent alpha too. Frame silhouette should exactly match the photographed frame from x895 y230 to x1265 y387 in this 1586x992 portrait. Minimal padding tight product crop, do not straighten or symmetrize. This is an extraction not a product redesign.

## Earlier frame prompt (unused result)

Extract ONLY the exact black eyeglasses worn by the woman in this photograph as a transparent-background product cutout. Match the exact photographed cat-eye frame shape, perspective, tilted angle, black acetate edges, bridge, temple arm at right, and original highlights. Remove all woman, skin, eyes, eyebrows, hair, blouse and background. Lens interiors must be transparent, with only very subtle glass reflection. Do not redesign, straighten, add a second temple, or change the viewpoint. Center the frame with minimal transparent padding. No text, no shadow. Output transparent PNG.

## Clean plate prompt

Precisely edit this image ONLY to remove the woman's eyeglasses. Reconstruct the small skin/eye/eyebrow/hair areas immediately hidden by the glasses naturally. Keep her identity, expression, head angle, face proportions, eye positions, hair, clothing, lighting, white background and entire composition pixel-aligned and unchanged. Do not crop, zoom, move, or beautify her. Preserve exactly the input canvas aspect ratio and framing. Output the same photograph with no glasses, as a clean background plate for an animation. No other edits.

The current extraction uses actual hero pixels clipped with a shared SVG outline. The same outline defines the later vector material enhancement, so the frame gains clarity without changing shape. The clean plate is visible only within a feathered eyewear repair mask. The animated frame is a photographic/vector plane with CSS perspective, not a volumetric 3D model.

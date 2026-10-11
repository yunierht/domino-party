# Generated avatar provenance

Created 2026-10-09 for Domino Codex Online using the built-in image_gen tool, with transparent_background=true on all calls. No CLI or pixel postprocessing. Six fictional adults; names are character labels.

References visually inspected for composition: ../computer-opponent-andy-seated-v1.png and ../computer-opponent-yoi-seated-v2.png. References were not passed as edit targets for initial generation. One independent generation and one background-extraction edit per final asset. Original outputs retained in the tool's generated-images folder. Final PNGs copied byte-for-byte into this folder.

## Initial prompt

Use case: photorealistic-natural. Asset type: a single transparent PNG seated opponent avatar for the existing domino game, not a collage. Create a fictional adult person. Composition: centered straight-on chest-and-arms portrait, as seen by another player seated across a table, same close framing as the inspected seated game avatars. Entire top of hair, both shoulders, both elbows, full forearms and both complete hands are inside the frame, with modest transparent padding. They face the camera directly, head upright, relaxed warm expression and small natural smile. Forearms extend forward and rest horizontally at the bottom of the portrait, hands relaxed beside each other, as though on an invisible tabletop. Torso ends naturally behind the arms. Natural believable anatomy, five fingers per hand. Photorealistic skin texture and fabric, soft warm-neutral studio light with gentle shadows on the subject only. Use the same camera height, distance, 3:2 landscape framing and subject scale for this avatar collection. Genuine transparent background alpha, including negative spaces around the body. No tabletop, no chair, no props, no domino tiles, no background, no floor, no cast shadow outside the person, no frame, no writing, no logo, no watermark. Subject:

Append one subject per call:

- **mateo**: Mateo, a Black man with dark brown skin, age 38, short neatly cropped black hair, clean-shaven, wearing a plain blue casual button-up shirt with sleeves rolled to his forearms.
- **kenji**: Kenji, a man with East Asian facial features, age 36, medium-light skin, short neat black hair, clean-shaven, wearing a plain charcoal-gray casual button-up shirt with sleeves rolled to his forearms.
- **oliver**: Oliver, a man with fair skin, age 40, short chestnut brown hair, light stubble, wearing a plain forest-green knit sweater with the sleeves gently pushed back.
- **amara**: Amara, a Black woman with deep brown skin, age 35, natural curly black hair framing her face, wearing a plain burgundy blouse with sleeves to the forearms.
- **lina**: Lina, a woman with East Asian facial features, age 34, medium-light skin, straight shoulder-length black hair, wearing a plain muted-blue blouse with sleeves to the forearms.
- **sofia**: Sofia, a woman with olive skin, age 39, shoulder-length wavy brown hair, wearing a plain ivory blouse with sleeves to the forearms.

## Extraction edit prompt

Use case: background-extraction. Edit this exact image only to create a clean cutout PNG. Preserve the person exactly: same identity, face, hair, clothing, pose, arms and hands, colors, scale, original1536x1024 framing. Remove ALL diffuse colored halo, ALL studio glow, ALL brown/gray area below the arms, and ALL background outside the silhouette. The only visible pixels must belong to the person's hair, skin or clothes. Everything outside the silhouette must be entirely transparent alpha zero; clean natural antialiased edges, no feathered glow or shadow. Transparent space below and between hands/arms; do not add a tabletop or any prop. Keep the person fully opaque. Do not redraw the subject or change their expression.

## Files and source outputs

- mateo-seated-v1.png — final exec-6c1e62de-80a5-4b60-a55f-5e695de43c7b.png; initial exec-0491a080-4185-4443-baa7-035e42eb5d68.png.
- kenji-seated-v1.png — final exec-46b97bf4-651c-47aa-ab1d-cbc2c785c2ac.png; initial exec-7cdf4575-7afc-4716-81a4-32f7ea95dd27.png.
- oliver-seated-v1.png — final exec-510bc94b-adff-4642-8b00-fc6da6df187e.png; initial exec-e6f103b3-1fa2-4263-bb46-f4562c3b83cd.png.
- amara-seated-v1.png — final exec-a33e24bb-8ee8-4cd5-af44-3f3cfdd2d2d4.png; initial exec-be2a0bd4-a4bf-4f82-a843-e840505b2090.png.
- lina-seated-v1.png — final exec-e389c937-5ca7-4f73-8d77-e7809e9c56e0.png; initial exec-cd807557-9d14-4db6-a87d-b0ee34001994.png.
- sofia-seated-v1.png — final exec-bc94117f-da53-40f0-8069-5046ef6c2807.png; initial exec-f394d749-5d79-4bfb-a5fc-56c822b29412.png.

## Validation

Each final is 1536×1024 RGBA. The tool preview can display background RGB from fully transparent pixels: direct alpha sampling confirms background samples have alpha zero. Original alpha was preserved, including subject values up to 254. No scaling, cropping, alpha rewriting, or optimization performed. Visual table integration is a separate browser check.

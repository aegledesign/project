# Design Studio Plan

## Goal

Improve only the Aegle product customization tool and bring it closer to a professional CustomInk-style design studio. Preserve the existing application architecture and avoid rewriting unrelated parts of the platform.

## Scope

1. Add a product mockup canvas with separate front and back design areas.
2. Add a logo and image upload control.
3. Add a text tool.
4. Add a font selector.
5. Add a text color selector.
6. Support object dragging, resizing, and rotation.
7. Add a layer panel.
8. Allow deletion of the selected object.
9. Allow duplication of the selected object.
10. Center the selected object horizontally or vertically.
11. Save the complete design as JSON.
12. Generate and download a preview PNG.
13. Attach the saved design JSON and preview to the cart item.
14. Warn when selected artwork extends outside the printable area.
15. Apply a simple unit-price increase for additional print locations.

## Technical Direction

- Use the existing Fabric.js dependency.
- Maintain an independent serialized Fabric canvas for each selected mockup and print area.
- Store product, variant, mockup, print-area, and pricing metadata with the serialized design.
- Keep edits limited to the design studio, cart display, and browser-safe pricing helpers required by client components.
- Preserve the existing product catalog, checkout, API, and admin architecture.

## Product Visual Model

```text
Product
├── Product Variant / Color
│   └── Product Mockup
│       ├── Front image
│       ├── Back image
│       └── Print Areas
│           ├── Front chest
│           ├── Full front
│           └── Back
│
└── Design saved with selected variant, mockup, and print area
```

- A product owns its available color variants.
- A mockup belongs to a product and can be assigned to a color variant.
- Each mockup represents one view such as `FRONT`, `BACK`, `LEFT`, `RIGHT`, or `DETAIL`.
- Each mockup owns one or more normalized printable areas.
- Saved designs reference `productId`, `colorKey`, `mockupId`, and `printAreaId`.
- Cart items retain `mockupId`, `printAreaId`, serialized design JSON, and the generated preview.

## Acceptance Checks

- Users can add text and uploaded artwork to either product side.
- Canvas objects can be selected, dragged, resized, rotated, duplicated, deleted, and centered.
- Layer selection remains synchronized with canvas selection.
- Printable-area warnings update after object transformations.
- A second active print location increases the displayed unit price.
- JSON and PNG files can be generated from the studio.
- Cart items contain the design JSON and display the generated preview.
- `npm run typecheck` passes.
- `npm run build` passes.

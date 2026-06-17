# Product Images — Drop Folder

Drop your product images here. They get applied to the matching product on the next run of `npm run images:apply`.

## How matching works

Each image filename starts with a **product SKU**. The SKU determines which product receives the image.

### Single image per product
```
BRD-VEL-001.jpg
WED-SHR-001.png
FRM-LWN-001.webp
```

### Multiple images per product (gallery)
Use `-1`, `-2`, `-3` suffixes. The one with `-1` (or no suffix) becomes the **primary** image. Others appear in the gallery in suffix order.
```
BRD-VEL-001-1.jpg   ← primary
BRD-VEL-001-2.jpg
BRD-VEL-001-3.jpg
```

Mixing is fine — `BRD-VEL-001.jpg` alone is the primary; add `BRD-VEL-001-2.jpg` for a 2nd gallery image.

## Allowed file types

`.jpg` · `.jpeg` · `.png` · `.webp`

Max file size: 5 MB each (recommended < 500 KB for fast loads).

## Recommended dimensions

- **Aspect ratio:** 3:4 (portrait) — best for fashion product cards
- **Size:** 900 × 1200 px or larger (auto-downscaled by browser)
- **Format:** WebP for smallest size; JPG for compatibility

## Current product SKUs (all 16 women's dresses)

### Bridal (4)
- `BRD-VEL-001` — Embroidered Bridal Suit (Maroon Velvet)
- `BRD-LEH-002` — Bridal Lehenga (Gold Tissue)
- `BRD-WAL-001` — Walima Dress (Ivory & Pearl)
- `WED-SHR-001` — Wedding Sharara Set (Emerald Green)

### Formal (4)
- `FRM-LWN-001` — Formal Lawn 3-Piece (Champagne Cream)
- `FRM-CRP-001` — Formal Crepe Suit (Midnight Black)
- `FRM-SLK-001` — Formal Silk Trouser Suit (Teal)
- `SAR-CHF-001` — Designer Chiffon Saree (Royal Blue)

### Embroidered (4)
- `EID-FRK-001` — Eid Embroidered Frock (Blush Pink)
- `EID-MHD-001` — Mehndi Outfit (Sunshine Yellow)
- `EMB-MAX-001` — Embroidered Maxi (Mustard Velvet)
- `EMB-NET-001` — Net Embroidered Frock (Ferozi Blue)

### Casual (4)
- `CAS-KRT-001` — Casual Cotton Kurti (Navy Block Print)
- `CAS-LWN-002` — Casual Lawn Suit (Crisp White)
- `CAS-CTN-001` — Cotton Trouser Set (Beige)
- `CAS-KRT-002` — Printed Kurta (Charcoal Black)

## Apply images to products

After dropping files here:

```powershell
cd backend
npm run images:apply
```

The script will:
1. Read every file in `seed-images/products/`
2. Group files by SKU
3. Copy each file to `backend/uploads/products/` with a unique name
4. Update the matching product's `images` array (primary + gallery)
5. Print a summary of which products got images

Re-run anytime — it's idempotent. Replaces a product's images each run.

## Skipped files

- Files not matching any current product SKU are reported and ignored.
- Files outside the SKU-prefix naming convention (e.g. `random.jpg`) are skipped.

## What if I don't drop any images?

Products without an image render a branded **RIWAYA** placeholder automatically via the frontend's `<ProductImage>` component. No broken-image icons.

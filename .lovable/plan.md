

## Fix "Asset" to "Vendor/Leverandor" Terminology

The terminology has been updated in most places, but several spots still use the old "asset/eiendeler" wording instead of "vendor/leverandor". Here is every place that needs fixing:

### 1. Onboarding Step Labels (locales)

**nb.json** -- the onboarding step still says "Legg til eiendeler":
- `chat.onboarding.steps.assets`: "Legg til eiendeler" -> "Legg til leverandorer"
- `chat.onboarding.steps.assetsDesc`: "Registrer systemer, leverandorer og annen infrastruktur" -> "Registrer leverandorer, systemer og tjenester"

**en.json**:
- `chat.onboarding.steps.assets`: "Add Assets" -> "Add Vendors"
- `chat.onboarding.steps.assetsDesc`: "Register systems, vendors and other infrastructure" -> "Register vendors, systems and services"

### 2. Chat Suggestion Text (locales)

**nb.json**:
- `chat.onboarding.suggestions.default.addAssets`: "Legg til eiendeler fra eksterne kilder" -> "Legg til leverandorer fra eksterne kilder"
- `chat.onboarding.suggestions.default.missingDocs`: "Hvilke eiendeler mangler dokumentasjon?" -> "Hvilke leverandorer mangler dokumentasjon?"

**en.json**:
- `chat.onboarding.suggestions.default.addAssets`: "Add assets from external sources" -> "Add vendors from external sources"
- `chat.onboarding.suggestions.default.missingDocs`: "Which assets are missing documentation?" -> "Which vendors are missing documentation?"

### 3. Onboarding Widget Chat Messages (locales)

**en.json**:
- `onboardingWidget.messages.assets`: "I want to register systems and assets" -> "I want to register vendors"

**nb.json** (equivalent key if present):
- Same update to use "leverandorer"

### 4. AddAssetDialog -- Hardcoded English Titles

The `getTitle()` function in `AddAssetDialog.tsx` (line 1789) has hardcoded English strings like "Add Asset", "Select Asset Type", etc. These need to:
- Use `t()` translation keys instead of hardcoded strings
- Use "vendor/leverandor" terminology in the translation values

New translation keys to add and wire up:
- `assets.dialog.addTitle`: "Add Vendor" / "Legg til leverandor"
- `assets.dialog.selectType`: "Select Vendor Type" / "Velg leverandortype"
- `assets.dialog.aiSuggestions`: "AI Suggestions" (keep generic)
- `assets.dialog.uploadTitle`: "Upload from file" / "Last opp fra fil"
- `assets.dialog.connectTitle`: "Connect to data source" / "Koble til datakilde"
- etc. for each case in the switch

### 5. Work Areas Subtitle (nb.json)

- `myWorkAreas.subtitle`: "Oversikt over eiendeler, prosesser og brukere..." -> "Oversikt over leverandorer, prosesser og brukere..."

### Files Modified

| File | Change |
|------|--------|
| `src/locales/nb.json` | Update ~6 strings from eiendeler to leverandorer |
| `src/locales/en.json` | Update ~6 strings from assets to vendors |
| `src/components/dialogs/AddAssetDialog.tsx` | Replace hardcoded getTitle() strings with t() calls using new translation keys |


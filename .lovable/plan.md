

## Move Dashboard View Switcher to Sidebar

Currently the RoleSwitcher dropdown sits in the dashboard header next to "Legg til modul". The plan is to move it into the sidebar's company section (under "HULT IT AS"), making it accessible from any page.

### Changes

**1. Sidebar.tsx -- Add RoleSwitcher to company submenu**
- Import the `RoleSwitcher` component
- Place it inside the company section, directly below the company name/avatar area (visible without expanding the submenu)
- Style it to match the sidebar's design language (full-width, sidebar colors)
- The RoleSwitcher will need to communicate view changes -- we'll store the active view in localStorage or lift state via a simple context/callback

**2. Index.tsx -- Remove RoleSwitcher from dashboard header**
- Remove the `RoleSwitcher` from the header's `flex items-center gap-4` container (line 267)
- Keep the `activeView` state but read it from the sidebar's selection instead
- The dashboard description text will still update based on `activeView`

**3. State sharing approach**
- Create a lightweight event: the `RoleSwitcher` already calls `setPrimaryRole()` from `useUserRole`, which persists the role
- In `Index.tsx`, read `primaryRole` from `useUserRole()` reactively and use it as `activeView` instead of local state
- This removes the need for an `onViewChange` callback and makes the view selection work globally

### Technical Details

| File | Change |
|------|--------|
| `src/components/Sidebar.tsx` | Import & render `RoleSwitcher` in company section, below the company name. Pass `showAllOption={true}`. Style with `className="w-full"` |
| `src/pages/Index.tsx` | Remove `RoleSwitcher` import & usage from header. Replace `activeView` local state with reactive `primaryRole` from `useUserRole()`. Remove `setActiveView` |
| `src/components/dashboard/RoleSwitcher.tsx` | Minor: remove `onViewChange` prop usage (optional cleanup), ensure it works standalone via `useUserRole` |

### Sidebar Layout (Company Section)

```text
+---------------------------+
| [HU]  HULT IT AS          |
|        Selskap        [v] |
+---------------------------+
| [icon] Compliance-visning |  <-- RoleSwitcher (new location)
+---------------------------+
|   (expandable submenu)    |
|   Selskapsinnstillinger   |
|   Abonnementer            |
|   ...                     |
+---------------------------+
```

### Bonus: Localization fix
- The company submenu items ("Selskapsinnstillinger", "Abonnementer", "Logg ut", etc.) are also hardcoded Norwegian -- these will be localized with `t()` calls as part of this change.


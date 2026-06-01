# Patch Audit (Mobile)

This file documents all `patch-package` entries under `apps/mobile/patches`.

## Status Summary

- Total patches: `7`
- Goal: reduce long-term maintenance risk by removing avoidable patches first.

## Patch Inventory

| Patch | Purpose | Risk | Keep? | Notes |
|---|---|---:|---:|---|
| `@expo+cli+54.0.1.patch` | `randomUUID` with `disableEntropyCache` in Expo Go manifest | Medium | Yes (temp) | Tooling/runtime stability workaround. Re-test after Expo CLI upgrade. |
| `@expo+metro-runtime+6.1.2.patch` | Force-hide Metro error overlay/toast (`return null`) | High | Removed | Removed successfully; restores normal dev error visibility. |
| `@react-native-community+netinfo+11.4.1.patch` | Avoid hard-throw when native module missing | Medium | Removed | Removed successfully in current repo state. |
| `expo-router+6.0.11.patch` | Large native-tabs CSS visual override | Medium | Removed | Removed successfully in current repo state. |
| `expo-speech-recognition+3.0.1.patch` | Use optional native module guard | Medium | Yes (temp) | Prevents crash on unsupported env. |
| `expo-store-review+9.0.8.patch` | Extend web typings + native guard | Medium | Yes (temp) | Cleaned patch; keeps iOS pre-prompt/review-state APIs and web/native guard changes. |
| `metro-runtime+0.83.1.patch` | Add HMR websocket keepalive ping | Medium | Yes (temp) | Dev reliability patch; verify if newer Metro already includes this. |
| `react-native+0.81.4.patch` | Re-introduce `Slider` export via community package | High | Removed | Removed successfully; no in-repo `Slider` usage found. |
| `react-native-keyboard-controller+1.20.7.patch` | `pointerEvents` adjustments | Medium | Yes (temp) | UI/input conflict workaround. |
| `react-native-purchases+9.6.1.patch` | Custom Expo Go detection (`AnythingLauncherModule`) | Medium | Yes (temp) | Business-critical IAP flow guard. |
| `react-native-purchases-ui+9.6.1.patch` | Same as above for UI package | Medium | Yes (temp) | Pair with purchases patch; keep aligned. |
| `react-native-web-refresh-control+1.1.2.patch` | Replace `findNodeHandle` usage for web scroll detection | Low | Removed | Removed successfully in current repo state. |
| `sonner-native+0.21.0.patch` | Web-specific pointer events style fix | Low | Removed | Removed successfully in current repo state. |

## First Removal Candidates (Low-Risk First)

1. Monitor web tab visual style and, if needed, keep app-level CSS override.
2. Re-test `expo-store-review` patch after next Expo SDK bump and remove if upstream includes these APIs.

## High-Impact Candidate (Prepare Carefully)

- `react-native+0.81.4.patch`  
  Migration path:
  - Replace all `import { Slider } from "react-native"` with `@react-native-community/slider`.
  - Run app-wide search before removal.

## Cleanup Action Items

1. Keep validating removed patches on dependency upgrades and CI environments.
2. For each kept patch, add:
   - upstream issue/PR link
   - remove target version
   - owner and review date
3. Add CI guard:
   - fail if patch count increases without README update.

## Suggested Review Cadence

- Review all patches every 2 weeks.
- Mandatory review after Expo/RN/Router version bump.

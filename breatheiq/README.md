# BreatheIQ

**Breathe easier between stations.** A demo dashboard for the IoT-10 train-cabin air-quality prototype
(Track 01 · Air). Arduino Mega + DHT11 + MQ-2 + MQ-135 + PMS7003 → Random Forest on a PC → exhaust fan and ozone relays.

Everything runs in the browser. There is no backend and no network call. Data is simulated unless you plug in the real Arduino.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview   # production build, offline-safe, for demo day
```

## Pages

| # | Page | What it shows |
|---|------|---------------|
| 01 | Live | AQI gauge (CPCB, not clamped at 500), 7 sensor tiles, PM + temperature charts, 16×2 LCD emulator, serial console in the exact `final.py` format, the four ML heads, relays |
| 02 | Fleet | 12-coach rake coloured by AQI, demo route with haze/tunnel/yard zones, coach drawer, coach × time heat strip |
| 03 | Exposure | Per-group dose vs WHO / NAAQS, time-to-limit, plain-language advice, worst-air ranking, journey receipt |
| 04 | ML Lab | Model card, per-head metrics and confusion matrices, feature relevance, trees, what-if sliders, dataset explorer + CSV, retrain, 10-min replay |
| 05 | Controls | Auto / manual, ozone safety interlock + event log, decision-boundary editor, alert rules |
| 06 | System | Animated hardware pipeline, sensor health, ThingSpeak mirror, Connect real Arduino, standards checklist |
| 07 | Playbook | Bad Day Mode: before/after, auto-action timeline, platform announcement, passenger advisory, incident report export |

Every widget carries a `SENSOR` chip (the real prototype measures it) or a `SIM` chip (simulated extension).
The header always shows **DEMO DATA · SIMULATED**.

## Keyboard

| Key | Action |
|-----|--------|
| `1`–`7` | Scenario: normal · platform rush · heat wave · smoke/gas · haze belt · tunnel dust · everything at once |
| `P` or `⌘K` / `Ctrl+K` | Presenter panel (speed, freeze, reset, hold at peak, cheat sheet) |
| `Space` | Freeze / resume |
| `B` | Toggle Bad Day Mode |
| `G` | 60-second guided tour |
| `Esc` | Close panel / tour |

Scenarios 5 and 7 push AQI past 500 ("off the chart"); Bad Day Mode then arms itself.

## Structure

```
src/
  config.ts            product name + tagline (rename here)
  sim/
    core.ts            pure world model: stepWorld(world, inputs) → world (one 2-s tick)
    engine.ts          zustand store + timer (speed ×1/2/5/10, pause, persistence)
    model.ts           the four RF heads, synthetic dataset, metrics, CSV
    aqi.ts             CPCB AQI sub-indices, bands, guideline limits
    scenarios.ts       the 7 scenarios and their ramp/hold/decay envelopes
    route.ts           demo stations, zones, train position
    exposure.ts        passenger groups, dose budgets, advice
  data/sources.ts      DataSource interface: MockSource, WebSerialSource, ThingSpeakSource (stub)
  components/          layout (top bar, presenter, tour, alarm), live widgets, UI primitives
  pages/               one file per page
```

The UI only reads the store. `stepWorld` is pure, so the ML Lab replay runs the same simulator offline.

## Plug in the real hardware

1. Flash `ardunio code/sketch_jun21a/sketch_jun21a.ino` to the Mega as it is.
2. Close `final.py` (only one program can own the COM port).
3. Open the dashboard in **Chrome or Edge** → System → **Connect real Arduino** → pick the port.
4. `WebSerialSource` reads lines at 115200 baud, parses `a{temp}b{gas}c{co2}d{pm}e` and feeds the store.
   Temperature, gas, CO₂ and PM1.0 then come from the hardware. Humidity, PM2.5, PM10, occupancy and ozone stay simulated (`SIM`).

Next firmware step: add PM2.5 and PM10 to the serial frame (today only `data.pm10_standard`, i.e. PM1.0, is sent).

`ThingSpeakSource` shows how a channel feed would plug in (`/channels/{id}/feeds/last.json`). It is not connected in the demo.

## Honesty notes

- The ML heads are re-implemented as threshold functions with forest-like confidence, trained on ~200 synthetic rows with the same schema as `TK172529.xlsx`. Metrics are computed by actually running the heads on a held-out split.
- Ozone generators are hazardous in occupied spaces (CARB, US EPA). The interlock only allows ozone in an empty cabin under 0.07 ppm.

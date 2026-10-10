# BreatheIQ

**Breathe easier between stations.** BreatheIQ monitors the air inside train coaches, classifies it with a Random-Forest model, switches on ventilation and purification automatically, and warns the passengers most at risk when air quality collapses.

> Track 01 · Air — *Pollution, exposure, and the days the AQI goes off the chart.*

---

## The problem

Indian Railways carries over 20 million passengers a day. Coaches are cramped, turnover at every station is high, and ventilation is weak — especially in sleeper and general coaches. Air inside a coach can turn bad within minutes:

- **Doors open at crowded platforms** let in diesel exhaust, dust and heat.
- **Routes cross pollution hotspots** — stubble-burning belts in winter, industrial stretches, tunnels full of brake dust.
- **Packed coaches** push up CO₂, temperature and humidity.
- **Nobody on board knows.** There is no measurement, no warning, and no plan for the days the AQI goes off the chart.

The people who suffer most are the ones least able to cope: children, the elderly, people with asthma or COPD, pregnant passengers, and rail staff who spend whole shifts walking through every coach.

## The solution

BreatheIQ answers the track with three verbs:

| | What BreatheIQ does |
|---|---|
| **Track** | Sensors in the coach measure temperature, humidity, combustible gas/smoke, CO₂/air-quality gases and particulate matter (PM1.0, PM2.5, PM10). AQI is computed on India's CPCB scale — and deliberately **not capped at 500**. |
| **Warn the most exposed** | Exposure is tracked per passenger group (dose = PM2.5 × minutes × breathing factor) against the WHO and India NAAQS daily limits, with plain-language advice and time-to-limit for each group. |
| **Change what happens on bad days** | A Random-Forest model decides, relays act: the exhaust fan for heat, ozone purifiers for gas, CO₂ and dust. When AQI passes 500, **Bad Day Mode** runs a playbook: ventilation boost, passenger advisories, a platform announcement draft, and a suggestion to move sensitive passengers to the cleanest coach. |

### Safety first: the ozone interlock

Ozone generators purify air but are harmful to people (CARB and the US EPA both warn against them in occupied spaces). BreatheIQ turns this weakness into a feature: ozone may only run when the **cabin is unoccupied** *and* estimated ozone stays **under 0.07 ppm (EPA 8-hour limit)**. When the model asks for ozone in an occupied coach, the interlock blocks it and falls back to fan + filtration — and logs why.

---

## How it works

```
 DHT11 ─┐
 MQ-2  ─┤                 UART 115200                       
 MQ-135─┼─► Arduino Mega ─────────────► PC: final.py ──► ThingSpeak
 PMS7003┘   2560          a{T}b{G}c{C}d{PM}e   │  (4 × Random Forest)
              ▲                                │
              └──── t{X}u{Y}v{Z}x{W}y ◄─────────┘
              │
              ├─► Relays (active-low): exhaust fan · ozone gen 1 · ozone gen 2
              ├─► 16×2 LCD
              └─► Serial1 ─► NodeMCU ESP8266 (Wi-Fi)

 BreatheIQ dashboard ◄── Web Serial (USB, 115200)  or  built-in simulation engine
```

1. The **Arduino Mega** reads all sensors every loop and sends one frame over USB serial, e.g. `a26.60b1c1d3e` (temperature, gas, CO₂, PM).
2. **`final.py`** parses the frame, uploads it to **ThingSpeak**, and runs four **Random-Forest** classifiers (scikit-learn) — one per hazard.
3. Predictions go back to the Arduino as `t0u0v0x0y`. The Arduino shows the verdict on the **LCD** and switches the **relays**.
4. The **BreatheIQ dashboard** shows everything live: the gauge, sensors, the model's decisions, the relays, the fleet, exposure and the Bad Day playbook.

### The model

| Head | Input | Label | 1 means | Actuator |
|---|---|---|---|---|
| X | Temperature | `label_Temperature` | Temperature abnormal | Exhaust fan |
| Y | Gas (MQ-2) | `label_Gas` | Gases detected | Ozone generator 2 |
| Z | CO2 (MQ-135) | `label_CO2` | Air quality abnormal | Ozone generator 1 |
| W | Pms (PMS7003) | `label_Pms` | Dust particles detected | LCD alert (dashboard: ozone, via interlock) |

Each head is a `RandomForestClassifier` (100 trees) trained on `python code/TK172529.xlsx` with an 80/20 split (`random_state=42`). The LCD shows the first abnormal head in priority order: Temperature → Gas → CO₂ → Dust → "All are normal".

Full wiring, pin map, protocol and parts list: **[HARDWARE.md](HARDWARE.md)**.

---

## Repository layout

```
.
├── README.md               ← you are here
├── HARDWARE.md             ← IoT build: parts, wiring, pins, serial protocol
├── ardunio code/
│   └── sketch_jun21a/sketch_jun21a.ino   Arduino Mega firmware
├── python code/
│   ├── final.py            serial bridge + 4 Random-Forest heads + ThingSpeak upload
│   ├── requirements.txt
│   └── TK172529.xlsx       training data
└── breatheiq/              web dashboard (React + TypeScript + Vite)
    ├── src/sim/            AQI maths, model heads, simulation engine
    ├── src/data/           data sources: simulation, Web Serial, ThingSpeak
    ├── src/pages/          Live · Fleet · Exposure · ML Lab · Controls · System · Playbook
    └── docs/DEMO_SCRIPT.md 90-second presentation script
```

---

## Run it yourself

### 1. Dashboard (no hardware needed)

Requirements: **Node.js 20+** and npm.

```bash
git clone https://github.com/Hazz-Y/breatheiq.git
cd breatheiq/breatheiq
npm install
npm run dev
```

Open **http://localhost:5173**. Without hardware attached, the dashboard runs its built-in simulation engine, which generates realistic cabin conditions and seven scenarios.

Production build (works fully offline):

```bash
npm run build
npm run preview          # http://localhost:4173
```

**Keyboard shortcuts**

| Key | Action |
|---|---|
| `1`–`7` | Scenario: normal · platform rush · heat wave · smoke/gas · stubble-burning haze · tunnel dust · everything at once |
| `P` / `Ctrl+K` | Presenter panel (speed ×1–×10, freeze, reset) |
| `Space` | Pause / resume |
| `B` | Toggle Bad Day Mode |
| `G` | Guided 60-second tour |

### 2. Hardware + ML script

1. Wire the components as described in **[HARDWARE.md](HARDWARE.md)**.
2. In the Arduino IDE, install the libraries **DHT sensor library** (Adafruit) and **Adafruit Unified Sensor**; `LiquidCrystal` and `SoftwareSerial` ship with the IDE.
3. Select **Board: Arduino Mega or Mega 2560**, open `ardunio code/sketch_jun21a/sketch_jun21a.ino` and upload.
4. Set up Python (3.9+):

   ```bash
   cd "python code"
   python -m venv .venv
   .venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   ```

5. Create a ThingSpeak channel with fields 1–3 (Temperature, Gas, PM) and set its **write** API key:

   ```powershell
   $env:THINGSPEAK_API_KEY = "your-write-key"      # macOS/Linux: export THINGSPEAK_API_KEY=...
   ```

6. Set the COM port in `final.py` (`serial.Serial('COM5', ...)`) to your Arduino's port, then run:

   ```bash
   python final.py
   ```

   You should see `Serial connection opened successfully!`, then a block per frame with the readings, `Data Successfully Uploaded!` and the four predictions.

### 3. Dashboard on live hardware

Close `final.py` first (only one program can hold the serial port). Open the dashboard in **Chrome or Edge** → **System** → **Connect real Arduino** → choose the port. Temperature, gas, CO₂ and PM then come straight from the Arduino; values the firmware doesn't send yet (humidity over serial, PM2.5, PM10, occupancy) are marked `SIM` in the UI.

---

## Built with

| Layer | Technology |
|---|---|
| Sensing | DHT11, MQ-2, MQ-135, Plantower PMS7003 |
| Controller | Arduino Mega 2560, 16×2 HD44780 LCD, 3-channel relay board |
| Connectivity | USB UART 115200 baud, NodeMCU ESP8266, ThingSpeak |
| ML | Python, scikit-learn `RandomForestClassifier`, pandas, pyserial |
| Dashboard | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Framer Motion, Zustand, Web Serial API |

## Standards referenced

- **CPCB National Air Quality Index** (India) — AQI from PM2.5 and PM10 sub-indices
- **WHO Air Quality Guidelines 2021** — PM2.5 15 µg/m³, PM10 45 µg/m³ (24-h)
- **India NAAQS 2009** — PM2.5 60 µg/m³, PM10 100 µg/m³ (24-h)
- **US EPA ozone** — 0.07 ppm, 8-hour average (interlock limit)
- **GB/T 18801-2015** — air purifier performance
- **ASHRAE 41.1 / ISO 7726** — temperature measurement

## Roadmap

- Forward PM2.5 and PM10 in the serial frame (today the firmware sends PM1.0 only).
- Occupancy sensing in the coach, so the ozone interlock runs on a real signal.
- Cloud pipeline on AWS: IoT Core for device data, Lambda for the model, and Amazon Bedrock for multilingual announcements and an operator assistant.
- Coach-wide rollout: one sensor node per coach feeding the Fleet view.

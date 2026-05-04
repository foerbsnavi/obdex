// Phase 2 — fügt Wikipedia-URLs zu enriched Codes hinzu, die nur Wal33D als Quelle haben.
// Mapping: Pattern (Title-Match) -> Wikipedia-URL. Erstes Match gewinnt.
// Wikipedia-Link wird zusätzlich zur Wal33D-Source eingefügt (nicht ersetzt).

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

// Mapping geordnet nach Spezifität — spezifischer zuerst
const mappings = [
  // O2 / Lambda
  { re: /\bO2 Sensor|HO2S|Lambda|Oxygen Sensor/i, url: "https://en.wikipedia.org/wiki/Oxygen_sensor" },
  // Catalyst (incl. heated)
  { re: /Catalyst|Catalytic|after.?cat\b|post.?cat\b/i, url: "https://en.wikipedia.org/wiki/Catalytic_converter" },
  // MAF
  { re: /Mass or Volume Air Flow|\bMAF\b/i, url: "https://en.wikipedia.org/wiki/Mass_flow_sensor" },
  // MAP
  { re: /Manifold Absolute Pressure|\bMAP\b - |^MAP\b/i, url: "https://en.wikipedia.org/wiki/MAP_sensor" },
  // Cam profile / VVT
  { re: /Camshaft Profile Actuator|Slow Response.*Cam|Variable Valve|Cam Phaser/i, url: "https://en.wikipedia.org/wiki/Variable_valve_timing" },
  // Cam position sensor
  { re: /Camshaft Position/i, url: "https://en.wikipedia.org/wiki/Camshaft_position_sensor" },
  // Crank position / engine position
  { re: /Crankshaft Position|Engine Position System/i, url: "https://en.wikipedia.org/wiki/Crankshaft_position_sensor" },
  // Wastegate (vor Turbocharger, weil "Wastegate" spezifischer)
  { re: /Wastegate/i, url: "https://en.wikipedia.org/wiki/Wastegate" },
  // Turbocharger / Supercharger / Boost
  { re: /Turbocharger|Supercharger|Boost (Control|Sensor|Pressure)|Turbo (Outlet|Inlet)/i, url: "https://en.wikipedia.org/wiki/Turbocharger" },
  // Charge Air Cooler / Intercooler
  { re: /Charge Air Cooler|Intercooler/i, url: "https://en.wikipedia.org/wiki/Intercooler" },
  // Common rail / Injection pump (Diesel-spezifisch)
  { re: /Common Rail|Injection Pump|High.?Pressure Fuel Pump/i, url: "https://en.wikipedia.org/wiki/Common_rail" },
  // Generelle Kraftstoff-Komponenten (auch GDI-Benziner) → Fuel injection
  { re: /Fuel Rail|Fuel Pressure|Fuel Volume Regulator|Fuel Shutoff|Fuel Cooler|Fuel Heater|Cold Start Injector|Fuel Injector|Air Assisted Injector|Fuel Pump (Module|Secondary)/i, url: "https://en.wikipedia.org/wiki/Fuel_injection" },
  // Glow plug
  { re: /Glow Plug/i, url: "https://en.wikipedia.org/wiki/Glow_plug" },
  // Throttle / Pedal
  { re: /Throttle|Pedal Position|Throttle Actuator/i, url: "https://en.wikipedia.org/wiki/Throttle_position_sensor" },
  // DPF / Particulate
  { re: /Diesel Particulate|DPF|Particulate Matter/i, url: "https://en.wikipedia.org/wiki/Diesel_particulate_filter" },
  // Reductant / SCR / AdBlue
  { re: /Reductant|\bSCR\b|AdBlue|Urea/i, url: "https://en.wikipedia.org/wiki/Selective_catalytic_reduction" },
  // EGR
  { re: /Exhaust Gas Recirculation|\bEGR\b/i, url: "https://en.wikipedia.org/wiki/Exhaust_gas_recirculation" },
  // Hybrid/EV Battery / BMS
  { re: /Hybrid\/EV Battery|Battery Energy|Battery Management|Battery Charger|Battery Monitor|Battery Interface|HV Battery|DC\/DC Converter|Drive Motor|Battery Inductive/i, url: "https://en.wikipedia.org/wiki/Battery_management_system" },
  // Brake system / ABS
  { re: /Anti.?Lock Brake|\bABS\b|Brake Blending|Brake System|Park Brake|Parking Brake|EPB\b/i, url: "https://en.wikipedia.org/wiki/Anti-lock_braking_system" },
  // TPMS
  { re: /Tire Pressure|TPMS|Tyre Pressure/i, url: "https://en.wikipedia.org/wiki/Tire-pressure_monitoring_system" },
  // Power steering
  { re: /Power Steering|Steering Effort|Steering Column|Steering Angle/i, url: "https://en.wikipedia.org/wiki/Power_steering" },
  // ESC / Stability
  { re: /Vehicle Dynamics|Stability Control|\bESC\b|\bESP\b|Yaw Rate|Lateral Acceleration|Multi.?axis Acceleration/i, url: "https://en.wikipedia.org/wiki/Electronic_stability_control" },
  // Airbag / Restraints
  { re: /Airbag|Restraints|SRS|Pretensioner|Occupant Sens/i, url: "https://en.wikipedia.org/wiki/Airbag" },
  // Network / CAN — sehr breiter Pattern, kommt spät
  { re: /Vehicle Communication Bus|Control Module Communication|Lost Communication|Invalid Data Received|Bus Off/i, url: "https://en.wikipedia.org/wiki/CAN_bus" },
  // Cooling system (Coolant Temperature, Heater, Pump, Thermostat, Radiator)
  { re: /Coolant|Thermostat|Radiator/i, url: "https://en.wikipedia.org/wiki/Internal_combustion_engine_cooling" },
  // Sunroof / moveable roof
  { re: /Sun Roof|Sunroof|Moveable Roof|Folding Top/i, url: "https://en.wikipedia.org/wiki/Sunroof" },
  // Door / window / seat / mirror — Body Control area, generic OBD-II
  { re: /Door (Control|Window)|Seat Control|Mirror|Power Liftgate|Rear Gate|Window Motor/i, url: "https://en.wikipedia.org/wiki/Body_control_module" },
  // Cruise control / ADAS
  { re: /Cruise Control|Automated Driving|Driver Assistance|Adaptive Cruise|Lane Keep|Parking Assist|Image Processing|Side Object Detection|Front Distance Range/i, url: "https://en.wikipedia.org/wiki/Advanced_driver-assistance_system" },
  // Headlamp
  { re: /Headlamp|Headlight|Auto Lighting|Automatic Lighting|Headlamp Leveling/i, url: "https://en.wikipedia.org/wiki/Headlamp" },
  // HVAC
  { re: /HVAC|Air Conditioning|A\/C Compressor|Auxiliary Heater|Cabin Air/i, url: "https://en.wikipedia.org/wiki/Automotive_HVAC" },
  // Vehicle speed
  { re: /Vehicle Overspeed|Vehicle Speed/i, url: "https://en.wikipedia.org/wiki/Speedometer" },
  // Variable valve lift / cylinder deactivation (Intake/Exhaust Valve Control Solenoid)
  { re: /Intake Valve Control Solenoid|Exhaust Valve Control Solenoid|Cylinder Deactivation/i, url: "https://en.wikipedia.org/wiki/Variable_valve_lift" },
  // Cylinder injection / per-cylinder injector / contribution / injector circuit
  { re: /Cylinder \d{1,2}.*Injector|Cylinder \d{1,2}.*Contribution|Cylinder \d{1,2}.*(Restricted|Leaking|Trim)|Cylinder \d{1,2} Injection Timing|^Injector Circuit|Injection Timing Performance|Closed Loop.*Cylinder Balance/i, url: "https://en.wikipedia.org/wiki/Fuel_injection" },
  // EVAP system
  { re: /EVAP|Evaporative|Tank Vapor|Vapor Line|Charcoal Canister|Leak Detection Pump/i, url: "https://en.wikipedia.org/wiki/Onboard_refueling_vapor_recovery" },
  // Engine oil
  { re: /Engine Oil|Oil Temperature|Oil Pressure/i, url: "https://en.wikipedia.org/wiki/Motor_oil" },
  // Cylinder Head Temperature → cooling
  { re: /Cylinder Head Temperature/i, url: "https://en.wikipedia.org/wiki/Internal_combustion_engine_cooling" },
  // Heat exchanger (exhaust heat recovery)
  { re: /Heat Exchanger/i, url: "https://en.wikipedia.org/wiki/Heat_exchanger" },
  // Battery State of Charge / Battery Monitor
  { re: /State of Charge|Battery Monitor|Battery B State/i, url: "https://en.wikipedia.org/wiki/State_of_charge" },
  // Body control module
  { re: /Body Control Module/i, url: "https://en.wikipedia.org/wiki/Body_control_module" },
  // Closed-loop fuel control / Lambda regulation
  { re: /Closed Loop|Air\/Fuel Ratio Control/i, url: "https://en.wikipedia.org/wiki/Air%E2%80%93fuel_ratio" },
  // Barometric pressure
  { re: /Barometric Pressure/i, url: "https://en.wikipedia.org/wiki/Barometer" },
  // Intake Air Pressure Multi-Sensor Correlation (redundant pressure sensors)
  { re: /Intake Air Pressure Measurement/i, url: "https://en.wikipedia.org/wiki/MAP_sensor" },
  // Intake Air Temperature / Ambient Air Temperature / Charge Air Cooler Temperature → Thermistor
  { re: /Intake Air Temperature|Ambient Air Temperature|Charge Air Cooler Temperature/i, url: "https://en.wikipedia.org/wiki/Thermistor" },
  // Humidity sensor
  { re: /Humidity Sensor/i, url: "https://en.wikipedia.org/wiki/Hygrometer" },
  // Fallback for "fuel" general
  { re: /\bFuel\b/i, url: "https://en.wikipedia.org/wiki/Fuel_injection" }
];

const dir = "C:/Claude/_projekte/obdex/data/generic";
const files = readdirSync(dir).filter(f => f.endsWith("_enriched.yaml"));

let total = 0;
let added = 0;
let noMatch = 0;
const noMatchCodes = [];

for (const file of files) {
  let text = readFileSync(join(dir, file), "utf8");
  const codes = parse(text) || [];

  for (const c of codes) {
    const sources = c.sources || [];
    if (sources.length !== 1 || !sources[0].includes("Wal33D")) continue;
    total++;

    const title = (c.title?.en || "") + " " + (c.description?.en || "");
    let url = null;
    for (const m of mappings) {
      if (m.re.test(title)) { url = m.url; break; }
    }
    if (!url) {
      noMatch++;
      noMatchCodes.push(c.code);
      continue;
    }

    // In den Text einfügen: nach der "    - https://github.com/Wal33D/dtc-database"-Zeile
    // im Sources-Block dieses Codes.
    // Wir suchen den Block "- code: <code>\n" und ersetzen NUR im Sources-Bereich
    // (am Ende des Blocks).
    const blockStart = text.indexOf(`- code: ${c.code}\n`);
    if (blockStart < 0) continue;
    let blockEnd = text.indexOf("\n- code:", blockStart + 1);
    if (blockEnd < 0) blockEnd = text.length;

    const block = text.slice(blockStart, blockEnd);
    // sources block sieht so aus:
    //   sources:
    //     - https://github.com/Wal33D/dtc-database
    // Wir hängen einen weiteren - <url> dahinter.
    const newBlock = block.replace(
      /(  sources:\n    - https:\/\/github\.com\/Wal33D\/dtc-database)(\s*$)/,
      `$1\n    - ${url}$2`
    );
    if (newBlock === block) {
      // Format könnte abweichen — versuche allgemeineres Pattern
      const newBlock2 = block.replace(
        /(  sources:\n(?:    - .+\n)+)/,
        match => match.trimEnd() + `\n    - ${url}\n`
      );
      if (newBlock2 === block) {
        noMatch++;
        noMatchCodes.push(`${c.code}(format)`);
        continue;
      }
      text = text.slice(0, blockStart) + newBlock2 + text.slice(blockEnd);
    } else {
      text = text.slice(0, blockStart) + newBlock + text.slice(blockEnd);
    }
    added++;
  }

  writeFileSync(join(dir, file), text, "utf8");
}

console.log(`Total only-Wal33D codes: ${total}`);
console.log(`Wikipedia URL added:     ${added}`);
console.log(`No match / format issue: ${noMatch}`);
if (noMatch > 0) {
  console.log(`\nUnmatched (first 20): ${noMatchCodes.slice(0, 20).join(", ")}`);
}

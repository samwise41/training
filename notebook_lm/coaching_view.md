# Current Coaching Metrics View
**Generated:** 2026-03-27 02:46:01
**Source:** https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json

---

## Data Content
```json
{
  "generated_at": "2026-03-26 14:47:56",
  "metrics_summary": [
    {
      "group": "General Fitness",
      "metrics": [
        {
          "id": "vo2max",
          "title": "VO2 Max",
          "sport": "All",
          "icon": "fa-heart-pulse",
          "colorVar": "var(--color-all)",
          "unit": "ml/kg/min",
          "good_min": 45,
          "good_max": 65,
          "higher_is_better": true,
          "description": "Aerobic ceiling.",
          "improvement": "\u2022 Increase VO2 Intervals (Zone 5)",
          "formula": "Garmin Estimate",
          "filters": {
            "ignore_zero": true
          },
          "current_value": 54.54,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.2087912087912088
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.13094017094017094
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.12408163265306123
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.18854128100703443
            }
          },
          "has_data": true
        },
        {
          "id": "tss",
          "title": "Weekly Load",
          "sport": "All",
          "icon": "fa-layer-group",
          "colorVar": "var(--color-all)",
          "unit": "TSS",
          "good_min": 300,
          "good_max": 600,
          "higher_is_better": true,
          "description": "Total training stress.",
          "improvement": "\u2022 Increase Duration/Intensity",
          "formula": "Sum of Workout TSS",
          "filters": {
            "ignore_zero": true
          },
          "current_value": null,
          "status": "No Data",
          "trends": {
            "30d": {
              "direction": "Flat",
              "slope": 0
            },
            "90d": {
              "direction": "Falling",
              "slope": -3.9257142857142857
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.12084773249183953
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.1819872247851758
            }
          },
          "has_data": false
        },
        {
          "id": "anaerobic",
          "title": "Anaerobic Impact",
          "sport": "All",
          "icon": "fa-fire",
          "colorVar": "var(--color-all)",
          "unit": "Score",
          "good_min": 2.0,
          "good_max": 4.0,
          "higher_is_better": true,
          "description": "Intensity stimulus.",
          "improvement": "\u2022 All-out Sprints",
          "formula": "TE > 2.0",
          "filters": {
            "ignore_zero": true
          },
          "current_value": 1.54,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.07846154288931208
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.007136083120380659
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.004126426637269161
            },
            "1y": {
              "direction": "Rising",
              "slope": 4.892303958636015e-05
            }
          },
          "has_data": true
        },
        {
          "id": "calories",
          "title": "Weekly Burn",
          "sport": "All",
          "icon": "fa-fire-flame-curved",
          "colorVar": "var(--color-all)",
          "unit": "kcal",
          "good_min": 3500,
          "good_max": 6000,
          "higher_is_better": true,
          "description": "Active energy expenditure.",
          "improvement": "\u2022 Add Frequency",
          "formula": "Active Calories",
          "filters": {
            "ignore_zero": true
          },
          "current_value": 4668.77,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -1.2102272727272727
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.022599693810600036
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.21544779767989689
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.9957626848698943
            }
          },
          "has_data": true
        },
        {
          "id": "training_balance",
          "title": "Training Balance",
          "sport": "All",
          "icon": "fa-chart-pie",
          "colorVar": "var(--color-all)",
          "unit": "%",
          "good_min": 0,
          "good_max": 0,
          "higher_is_better": true,
          "description": "Zone distribution.",
          "improvement": "\u2022 80% Easy / 20% Hard",
          "formula": "Zone Distribution",
          "current_value": null,
          "status": "No Data",
          "trends": {
            "30d": {
              "direction": "Flat",
              "slope": 0
            },
            "90d": {
              "direction": "Flat",
              "slope": 0
            },
            "6m": {
              "direction": "Flat",
              "slope": 0
            },
            "1y": {
              "direction": "Flat",
              "slope": 0
            }
          },
          "has_data": false
        },
        {
          "id": "feeling_load",
          "title": "Feeling vs Load",
          "sport": "All",
          "icon": "fa-face-smile-beam",
          "colorVar": "var(--color-all)",
          "unit": "Ratio",
          "good_min": 0,
          "good_max": 0,
          "higher_is_better": true,
          "description": "Subjective vs Objective.",
          "improvement": "\u2022 Align RPE with TSS",
          "formula": "RPE vs TSS",
          "current_value": 3.86,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.023376623376623377
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.005055742805289085
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0050933786078098476
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.003052714398111723
            }
          },
          "has_data": true
        }
      ]
    },
    {
      "group": "Cycling Metrics",
      "metrics": [
        {
          "id": "subjective_bike",
          "title": "Perceived Efficiency",
          "sport": "Bike",
          "icon": "fa-person-biking",
          "colorVar": "var(--color-bike)",
          "unit": "W/RPE",
          "good_min": 25,
          "good_max": 50,
          "higher_is_better": true,
          "description": "Power per RPE.",
          "improvement": "\u2022 Aerobic Base Work",
          "formula": "Avg Power / RPE",
          "filters": {
            "min_duration_minutes": 20,
            "ignore_zero": true
          },
          "current_value": 58.0,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Flat",
              "slope": 0
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.8723185833973655
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.9278403905202073
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.13597619562801222
            }
          },
          "has_data": true
        },
        {
          "id": "endurance",
          "title": "Aerobic Efficiency",
          "sport": "Bike",
          "icon": "fa-heart-pulse",
          "colorVar": "var(--color-bike)",
          "unit": "EF",
          "good_min": 1.3,
          "good_max": 1.7,
          "higher_is_better": true,
          "description": "Normalized Power / Heart Rate.",
          "improvement": "\u2022 Long Z2 Rides",
          "formula": "Norm Power / Avg HR",
          "filters": {
            "min_duration_minutes": 20,
            "ignore_zero": true,
            "require_hr": true
          },
          "current_value": 1.35,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.010394016522959156
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.005023382257176176
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.004017946532059265
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0014557354898491384
            }
          },
          "has_data": true
        },
        {
          "id": "strength",
          "title": "Pedal Force",
          "sport": "Bike",
          "icon": "fa-bolt",
          "colorVar": "var(--color-bike)",
          "unit": "W/RPM",
          "good_min": 1.5,
          "good_max": 3.0,
          "higher_is_better": true,
          "description": "Torque (Power/Cadence).",
          "improvement": "\u2022 Low: Spin / High: Grind",
          "formula": "Avg Power / Cadence",
          "filters": {
            "min_duration_minutes": 10,
            "ignore_zero": true
          },
          "current_value": 2.48,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.010324987544430482
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0116231831337812
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.011521860304632352
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0033995750619105303
            }
          },
          "has_data": true
        },
        {
          "id": "drift_bike",
          "title": "Bike HR Drift",
          "sport": "Bike",
          "icon": "fa-arrow-trend-up",
          "colorVar": "var(--color-bike)",
          "unit": "%",
          "good_min": -2,
          "good_max": 5,
          "higher_is_better": false,
          "description": "Aerobic decoupling on the bike. <5% is good.",
          "improvement": "\u2022 Extend Zone 2 Duration",
          "formula": "Pw:Hr (First vs Second Half)",
          "filters": {
            "min_duration_minutes": 70,
            "ignore_zero": false
          },
          "current_value": 10.11,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -2.4578571428571427
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.23700722394220847
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.10005128205128207
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0307409948542024
            }
          },
          "has_data": true
        }
      ]
    },
    {
      "group": "Running Metrics",
      "metrics": [
        {
          "id": "subjective_run",
          "title": "Perceived Efficiency",
          "sport": "Run",
          "icon": "fa-person-running",
          "colorVar": "var(--color-run)",
          "unit": "Spd/RPE",
          "good_min": 0.6,
          "good_max": 1.0,
          "higher_is_better": true,
          "description": "Speed per RPE.",
          "improvement": "\u2022 Improve Form",
          "formula": "Avg Speed / RPE",
          "filters": {
            "min_duration_minutes": 15,
            "ignore_zero": true
          },
          "current_value": 0.82,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.03013757695367326
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.00804475303146096
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.005827804431950435
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0056755605765763184
            }
          },
          "has_data": true
        },
        {
          "id": "run",
          "title": "Running Economy",
          "sport": "Run",
          "icon": "fa-stopwatch",
          "colorVar": "var(--color-run)",
          "unit": "m/beat",
          "good_min": 1.0,
          "good_max": 1.6,
          "higher_is_better": true,
          "description": "Distance per heartbeat.",
          "improvement": "\u2022 Strides & Plyos",
          "formula": "(Speed * 60) / HR",
          "filters": {
            "min_duration_minutes": 15,
            "ignore_zero": true,
            "require_hr": true
          },
          "current_value": 1.24,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.008426000541834388
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0023194425331371357
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0027469189687428174
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0026149266634657256
            }
          },
          "has_data": true
        },
        {
          "id": "vertical_ratio",
          "title": "Vertical Ratio",
          "sport": "Run",
          "icon": "fa-ruler-vertical",
          "colorVar": "var(--color-run)",
          "unit": "%",
          "good_min": 0,
          "good_max": 8.0,
          "higher_is_better": false,
          "description": "Vertical oscillation divided by stride length. Lower is more efficient.",
          "improvement": "\u2022 Increase Cadence\n\u2022 Improve Form",
          "filters": {
            "min_duration_minutes": 10,
            "ignore_zero": true
          },
          "current_value": 7.69,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.010934077776395358
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.023516487580370407
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.018262190812504183
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.017448983500949
            }
          },
          "has_data": true
        },
        {
          "id": "gct",
          "title": "Ground Time",
          "sport": "Run",
          "icon": "fa-shoe-prints",
          "colorVar": "var(--color-run)",
          "unit": "ms",
          "good_min": 220,
          "good_max": 260,
          "higher_is_better": false,
          "description": "Time on ground.",
          "improvement": "\u2022 Quick Feet Drills",
          "formula": "Avg GCT",
          "filters": {
            "ignore_zero": true
          },
          "current_value": 250.2,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.07560465047647665
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.8866447277671939
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.6861007401689247
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.6579927010513019
            }
          },
          "has_data": true
        },
        {
          "id": "vert",
          "title": "Vert Oscillation",
          "sport": "Run",
          "icon": "fa-arrows-up-down",
          "colorVar": "var(--color-run)",
          "unit": "cm",
          "good_min": 6.0,
          "good_max": 9.0,
          "higher_is_better": false,
          "description": "Bounce height.",
          "improvement": "\u2022 Lean Forward",
          "formula": "Avg Vert",
          "filters": {
            "ignore_zero": true
          },
          "current_value": 8.01,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.022945038512512873
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.05749862787872929
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.04437672961650249
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.03829675391842539
            }
          },
          "has_data": true
        },
        {
          "id": "drift_run",
          "title": "Run HR Drift",
          "sport": "Run",
          "icon": "fa-heart-crack",
          "colorVar": "var(--color-run)",
          "unit": "%",
          "good_min": -2,
          "good_max": 5,
          "higher_is_better": false,
          "description": "Aerobic decoupling (Pa:Hr).",
          "improvement": "\u2022 Improve Durability",
          "formula": "Pa:Hr (First vs Second Half)",
          "filters": {
            "min_duration_minutes": 40,
            "ignore_zero": false
          },
          "current_value": 4.35,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.1207142857142857
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.14067857142857146
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.055492307692307674
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0485230769230769
            }
          },
          "has_data": true
        }
      ]
    },
    {
      "group": "Swimming Metrics",
      "metrics": [
        {
          "id": "subjective_swim",
          "title": "Perceived Swim Efficiency",
          "sport": "Swim",
          "icon": "fa-person-swimming",
          "colorVar": "var(--color-swim)",
          "unit": "Spd/RPE",
          "good_min": 0.15,
          "good_max": 0.3,
          "higher_is_better": true,
          "description": "Speed relative to effort.",
          "improvement": "\u2022 Drill Sets",
          "formula": "Speed / RPE",
          "filters": {
            "ignore_zero": true
          },
          "current_value": 0.25,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.02325476010640462
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.005442512378148285
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.002450966332205354
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.002450966332205354
            }
          },
          "has_data": true
        },
        {
          "id": "swim",
          "title": "Swim Economy",
          "sport": "Swim",
          "icon": "fa-water",
          "colorVar": "var(--color-swim)",
          "unit": "m/beat",
          "good_min": 0.3,
          "good_max": 0.6,
          "higher_is_better": true,
          "description": "Distance per heartbeat.",
          "improvement": "\u2022 Long Glides",
          "formula": "(Speed * 60) / HR",
          "filters": {
            "ignore_zero": true,
            "require_hr": true
          },
          "current_value": 0.44,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.02816798146203761
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.00783124056592126
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0013993737681354313
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0013993737681354313
            }
          },
          "has_data": true
        },
        {
          "id": "swims_weekly",
          "title": "Swims / Week",
          "sport": "Swim",
          "icon": "fa-person-swimming",
          "colorVar": "var(--color-swim)",
          "unit": "x",
          "good_min": 1.5,
          "good_max": 3,
          "higher_is_better": true,
          "description": "Frequency of swim sessions.",
          "improvement": "\u2022 Consistency is Key",
          "formula": "Count per Week",
          "filters": {
            "ignore_zero": false
          },
          "current_value": 1.63,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Flat",
              "slope": 0.0
            },
            "90d": {
              "direction": "Flat",
              "slope": 0.0
            },
            "6m": {
              "direction": "Flat",
              "slope": 0.0
            },
            "1y": {
              "direction": "Flat",
              "slope": 0.0
            }
          },
          "has_data": true
        }
      ]
    }
  ]
}
```

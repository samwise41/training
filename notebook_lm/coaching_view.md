# Current Coaching Metrics View
**Generated:** 2026-02-07 02:26:18
**Source:** https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json

---

## Data Content
```json
{
  "generated_at": "2026-02-06 14:07:58",
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
          "current_value": 52.86,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.14285714285714285
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.1671372106154715
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.10056285178236397
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.2469592808038075
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
          "current_value": 97.2,
          "status": "Watch",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -13.473809523809527
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.8852908042560975
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.45451822327183633
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.1434925172213884
            }
          },
          "has_data": true
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
          "current_value": 1.28,
          "status": "Watch",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.0406593400901964
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.020656989797193766
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.007447497879867056
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.00491005666481721
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
          "current_value": 609.5,
          "status": "Watch",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 4.551946607341491
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.9997724039829303
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.1765326081770908
            },
            "1y": {
              "direction": "Falling",
              "slope": -1.3997384921084335
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
          "current_value": 3.76,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.024675324675324677
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.008061224489795916
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0047430702939095775
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0026167683568272667
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
          "title": "Bike Efficiency",
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
          "current_value": 34.51,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.9203181660742537
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.6441059847824051
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.5815906323721665
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.05877084926315958
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
          "current_value": 1.27,
          "status": "Watch",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.023572134665923037
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.006324114530284281
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.00213722583517832
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0014696885008174437
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
          "current_value": 2.41,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.08224009188851138
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.025409939683849442
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.008788072480079187
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.002726891996262673
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
          "current_value": 3.44,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.7514545454545456
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.02722983870967749
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.02428711398827749
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.01522254844392249
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
          "title": "Run Efficiency",
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
          "current_value": 0.67,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.026028425321468644
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.005704659989549249
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.004201493369555885
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.004201493369555885
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
          "current_value": 1.23,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.004367985911164044
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0070916038732509136
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0026969901190775957
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0026969901190775957
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
          "current_value": 7.9,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.07714291981288365
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.026337675614790484
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.011471781213262564
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.011471781213262564
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
          "current_value": 257.76,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -3.572620572786456
            },
            "90d": {
              "direction": "Falling",
              "slope": -1.3125972996788757
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.4434155960210305
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.4434155960210305
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
          "current_value": 8.75,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.2026190803269856
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.062493497176694376
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.0202807431546063
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0202807431546063
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
          "current_value": 3.85,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.4708333333333333
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.24512987012987017
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.14966233766233764
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.14966233766233764
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
          "title": "Swim Efficiency",
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
          "current_value": 0.2,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.006839881550812126
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.001544912364307894
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0013988637446762885
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0013988637446762885
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
          "current_value": 0.33,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.004698159422346159
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.003808871689091175
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.003254217781510323
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.003254217781510323
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
        }
      ]
    }
  ]
}
```

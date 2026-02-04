# Current Coaching Metrics View
**Generated:** 2026-02-04 04:48:45
**Source:** https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json

---

## Data Content
```json
{
  "generated_at": "2026-02-04 04:02:47",
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
          "current_value": 53.0,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.05714285714285714
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.17984189723320157
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.10001094211620527
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.25850379894798364
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
          "current_value": 93.22,
          "status": "Watch",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -7.045
            },
            "90d": {
              "direction": "Falling",
              "slope": -1.0611862873211249
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.6000589765302893
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.15312734065357506
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
          "current_value": 1.16,
          "status": "Watch",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.12636363664402256
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.029288855757970425
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.00941783560995357
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.00590701544964451
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
          "current_value": 614.36,
          "status": "Watch",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 10.980295566502464
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.32966185363445644
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.8598302460897882
            },
            "1y": {
              "direction": "Falling",
              "slope": -1.2881542781143789
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
          "current_value": 3.95,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.06140350877192982
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.020896656534954407
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.010840935985036455
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0055504162812210905
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
              "slope": 1.0182030420853767
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.5815906323721665
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.060459404610251594
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
          "description": "Power / Heart Rate.",
          "improvement": "\u2022 Long Z2 Rides",
          "formula": "Avg Power / Avg HR",
          "filters": {
            "min_duration_minutes": 20,
            "ignore_zero": true,
            "require_hr": true
          },
          "current_value": 1.25,
          "status": "Watch",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.017935627057627173
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.006045115979698985
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.001824413877711855
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.00174261374412827
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
          "current_value": 2.3,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.05348332297186848
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.01941778914822252
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.007290804686949798
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.002892379750815093
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
          "current_value": 4.28,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.1867482517482518
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.06582661290322582
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
              "slope": -0.044253311703849066
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0039882992073383495
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.004194672574329464
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.004194672574329464
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
          "current_value": 1.25,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.018414413365315057
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.008082419219775094
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0030829027060353307
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0030829027060353307
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
          "current_value": 7.85,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.15892863273620605
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.03025974731940728
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.012729844739360193
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.012729844739360193
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
          "current_value": 257.46,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -5.664287021303011
            },
            "90d": {
              "direction": "Falling",
              "slope": -1.2732465869105114
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.4242483123681932
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.4242483123681932
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
          "current_value": 8.86,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.19678576334026218
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.049155831274860465
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.014840536732175951
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.014840536732175951
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
          "current_value": 3.78,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.6310714285714285
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.23384415584415588
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.16583890374331547
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.16583890374331547
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
          "current_value": 0.18,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.01033095262157302
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0011590643192642086
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0011116667128587838
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0011116667128587838
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
              "direction": "Falling",
              "slope": -0.008213954993956865
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.004927090162699478
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.003958737773221468
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.003958737773221468
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

# Current Coaching Metrics View
**Generated:** 2026-03-13 02:29:51
**Source:** https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json

---

## Data Content
```json
{
  "generated_at": "2026-03-12 14:04:10",
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
          "current_value": 53.56,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.26666666666666666
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.13241106719367585
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.09867406722170828
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.2081841432225064
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
              "slope": -0.7564782695173913
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.40658402407502076
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.1607077427140707
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
          "current_value": 1.67,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.06014705753939993
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.014002573691183502
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.005697964646300441
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.00123304389556155
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
          "current_value": 4130.7,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 6.821579532814237
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.07542908762420984
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.688489671248292
            },
            "1y": {
              "direction": "Falling",
              "slope": -1.1210340273903985
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
          "current_value": 3.83,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.08978328173374613
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.015462184873949583
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0037726908216082246
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0038901601830663617
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
          "current_value": 39.14,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 37.71041424699961
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.5198466778049887
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.8470555009700474
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.07136542039541076
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
          "current_value": 1.28,
          "status": "Warning",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.020473339916371517
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.005484193913415763
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.00252607451127472
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0014166056537509163
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
          "current_value": 2.34,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.042210703171379246
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.019910124281711284
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.010196545871943073
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.003162519330913035
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
          "current_value": 9.38,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 2.1367857142857143
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.32112745098039214
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.06190434782608692
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.05711517117732434
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
          "current_value": 0.67,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.05978095338863581
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.002853818924763856
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0028129378165600645
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0028129378165600645
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
          "current_value": 1.2,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.00583697320866357
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.00227491084818604
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.002189456488549374
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.002173335719382268
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
              "slope": -0.011666678246997651
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.04392432978030721
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.01801045663680765
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.01801045663680765
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
          "current_value": 249.65,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.5857142493838355
            },
            "90d": {
              "direction": "Falling",
              "slope": -1.7284585789617224
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.699610912466306
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.699610912466306
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
          "current_value": 8.12,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.06202379862467449
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.07683795215304841
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.03643140459730347
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.03643140459730347
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
          "current_value": 5.09,
          "status": "Warning",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.3877142857142857
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.09742857142857145
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.0348869565217391
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0348869565217391
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
          "current_value": 0.2,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.006180457153568318
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0018689285670006807
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0013824731236122387
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0013824731236122387
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
          "current_value": 0.38,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.0031330807635410376
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0040219649425949685
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.0004809581585667347
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0004809581585667347
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
          "current_value": 2.1,
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

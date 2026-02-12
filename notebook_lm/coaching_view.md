# Current Coaching Metrics View
**Generated:** 2026-02-12 02:39:05
**Source:** https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json

---

## Data Content
```json
{
  "generated_at": "2026-02-11 14:16:21",
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
          "current_value": 53.17,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.2
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.17391304347826092
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.09840525328330206
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.24486917982423012
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
          "current_value": 460.07,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 9.690000000000001
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.8852908042560975
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.4150321529543177
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
          "current_value": 1.26,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.01582417541787758
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.012577031197997822
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.009753930297250281
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.004491032686661211
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
          "current_value": 4216.17,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 7.235467980295568
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.6737692687059775
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.1955634999159931
            },
            "1y": {
              "direction": "Falling",
              "slope": -1.3479748487979963
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
              "direction": "Falling",
              "slope": -0.04155844155844155
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0114027149321267
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0055386893743058115
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.003918391839183919
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
          "current_value": 34.02,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.2880202404360278
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.2695874812344854
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.6049152141452669
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.02310992557191282
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
          "current_value": 1.29,
          "status": "Warning",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.008457908340143618
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.00510307262839535
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.002055648127874482
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0014349854507757739
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
              "slope": 0.03064424854121416
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.019978618329714377
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.009071517685304844
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0026252057977229804
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
          "current_value": 4.73,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 1.1380909090909093
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.27934017595307914
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.037813472743235675
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.007824854651162793
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
          "current_value": 0.62,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.02754158060706905
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.003231521301367952
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.003144126489225892
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.003144126489225892
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
              "direction": "Falling",
              "slope": -0.007107182406239714
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.006927289461398192
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.002809045768214533
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.002809045768214533
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
          "current_value": 7.73,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.016071438789367676
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.02937889260669538
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.013522733341563831
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.013522733341563831
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
          "current_value": 252.41,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.05000087193080357
            },
            "90d": {
              "direction": "Falling",
              "slope": -1.3001127583425238
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.4763175948154009
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.4763175948154009
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
          "current_value": 8.46,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.09928575247684154
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.06460191154518431
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.02320091148412165
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.02320091148412165
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
          "current_value": 3.34,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.4039285714285713
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.32092038396386224
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.10082072829131652
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.10082072829131652
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
          "current_value": 0.19,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.0027190478156131534
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0004102506144827669
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0009444203671089659
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0009444203671089659
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
          "current_value": 0.32,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.007648731688179882
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.0043045432763570285
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.0031925484209110516
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0031925484209110516
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
          "current_value": 7,
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

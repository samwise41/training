# Current Coaching Metrics View
**Generated:** 2026-03-01 02:43:02
**Source:** https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json

---

## Data Content
```json
{
  "generated_at": "2026-02-28 13:37:14",
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
          "current_value": 52.71,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.10714285714285714
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.13376623376623376
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.08641114982578395
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.22329545454545455
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
              "slope": -0.4981451631411292
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.5803129394319034
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.1474385801258104
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
          "current_value": 1.53,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.06964285948446818
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.006921313948295589
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.007810144886267793
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0016943344370316542
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
          "current_value": 3985.1,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -5.926382047071703
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.13260665729020168
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.6535724988227238
            },
            "1y": {
              "direction": "Falling",
              "slope": -1.3563966742547597
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
          "current_value": 3.38,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.029411764705882353
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0025510204081632673
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.0007789678675754613
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0017195880610096515
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
          "current_value": 29.3,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -8.355207123499806
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.8193941092507285
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.22177974373573373
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0903750208600932
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
          "current_value": 1.26,
          "status": "Warning",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.01398233578743247
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.003611112248005176
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0017282540812003067
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0012900504799739562
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
          "current_value": 2.36,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.025857822423988416
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.01702063496754724
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.00868135422050625
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.00274330130908781
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
          "current_value": 6.0,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.07771428571428568
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.20354411764705876
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.2077608695652174
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.002856662665066028
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
          "current_value": 0.58,
          "status": "Warning",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.016627717342506464
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.00531468162890659
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0014770116408368084
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0014770116408368084
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
              "slope": 0.0026815456687850187
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0038317117310398604
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.002336863895750279
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.002336863895750279
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
          "current_value": 7.75,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.010000058582850866
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.04542857083407317
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.01622333284688256
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.01622333284688256
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
          "current_value": 252.54,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.13928495134626115
            },
            "90d": {
              "direction": "Falling",
              "slope": -1.861298717161119
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.610362022865497
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.610362022865497
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
          "current_value": 8.29,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.016428620474679207
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.08041559094720978
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.029710029462052437
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.029710029462052437
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
          "current_value": 4.38,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.1410000000000001
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.16631868131868124
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.11422077922077921
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.11422077922077921
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
              "slope": 0.002662794980964189
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.002084926589827203
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0011763933434140032
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0011763933434140032
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
          "current_value": 0.37,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.0036992305392902452
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.001875462090209547
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.0011819046097719813
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0011819046097719813
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
          "current_value": 1.87,
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

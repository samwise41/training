# Current Coaching Metrics View
**Generated:** 2026-03-10 02:26:10
**Source:** https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json

---

## Data Content
```json
{
  "generated_at": "2026-03-09 20:42:01",
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
              "slope": 0.2
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.1383399209486166
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.09802371541501977
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.21073023628659768
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
              "direction": "Rising",
              "slope": 0.0017093970390720196
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.38144822851474774
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
          "current_value": 1.76,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.014285712369850705
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.02311688276121563
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.004361511898800913
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0006383696606452955
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
          "current_value": 3994.2,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 1.8334975369458129
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.4008130081300812
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.4708010000188601
            },
            "1y": {
              "direction": "Falling",
              "slope": -1.186287568516541
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
          "current_value": 3.79,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.05087719298245614
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.01382953181272509
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.002764281334025189
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0033170652680180627
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
          "current_value": 36.3,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 13.7
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
          "current_value": 1.25,
          "status": "Warning",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.016006149993676274
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0043620120050058935
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0019103174415223759
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.001320689717170937
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
          "current_value": 2.31,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.06262594970709262
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.02006373502786557
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.009635447004438804
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.003089973993535515
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
          "current_value": 9.06,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 1.432142857142857
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.2954656862745098
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.07966956521739126
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0457294117647059
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
          "current_value": 0.64,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.06104285830543153
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.007202937469796419
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0024767354979403347
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0024767354979403347
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
          "current_value": 1.21,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.0020053835167203444
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.003014384690876192
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.002302593501550085
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0022745284482527817
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
              "direction": "Rising",
              "slope": 0.005119045575459798
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.048260859484594465
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.017575988313270556
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.017575988313270556
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
          "current_value": 250.85,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.785714830671038
            },
            "90d": {
              "direction": "Falling",
              "slope": -1.8546019973188916
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.6810277295123655
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.6810277295123655
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
          "current_value": 8.16,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.06285715557280044
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.07837381302828772
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.03549825542010255
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.03549825542010255
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
          "current_value": 4.52,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.176
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.00523076923076919
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.08086956521739125
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.08086956521739125
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

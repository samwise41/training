# Current Coaching Metrics View
**Generated:** 2026-02-22 02:35:40
**Source:** https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json

---

## Data Content
```json
{
  "generated_at": "2026-02-22 01:32:44",
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
          "current_value": 52.67,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Flat",
              "slope": 0.0
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.1636363636363637
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.09108818011257036
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.23592032967032966
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
              "slope": -0.9197097027639419
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.46459409174253324
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.1434925172213884
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
          "current_value": 1.41,
          "status": "Off Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.08109889932713665
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0022612678110104888
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.012682843654480672
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.003059852722753066
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
          "current_value": 4020.8,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -5.161172161172164
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.24406037000973738
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.4993967558872157
            },
            "1y": {
              "direction": "Falling",
              "slope": -1.3410381491762466
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
          "current_value": 3.47,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.02696078431372549
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.006338535414165666
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.0007098164992901844
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0023074791545960654
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
          "current_value": 29.0,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -2.9906242740998836
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.8193941092507285
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.22833658260051992
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.04202417519983372
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
              "direction": "Falling",
              "slope": -0.019226461215991048
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.0038895346920961803
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0019955714452288874
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0013624613680695147
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
          "current_value": 2.43,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.04899048275848331
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.01774120668318889
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.008961000834694182
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0026935992602038663
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
          "current_value": 3.75,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.6034285714285713
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.20776470588235293
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.13767826086956525
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.03399951980792316
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
              "direction": "Falling",
              "slope": -0.007294138596982358
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.00044703148051498357
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.001975778893425501
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.001975778893425501
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
              "direction": "Falling",
              "slope": -0.016755018607812262
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.006411074413365324
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0024020732694181287
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0024020732694181287
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
              "slope": 0.011428560529436384
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.04029870714460101
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.015619052892305604
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.015619052892305604
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
          "current_value": 250.93,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.6250005449567523
            },
            "90d": {
              "direction": "Falling",
              "slope": -1.7614285357815032
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.5692276100329797
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.5692276100329797
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
          "current_value": 8.3,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Falling",
              "slope": -0.02357142312186092
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.07414286030908326
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.027988412824533463
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.027988412824533463
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
          "current_value": 3.46,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 2.6199999999999997
            },
            "90d": {
              "direction": "Falling",
              "slope": -0.23681818181818184
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.12808771929824558
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.12808771929824558
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
          "current_value": 0.21,
          "status": "On Target",
          "trends": {
            "30d": {
              "direction": "Rising",
              "slope": 0.0039315470982165665
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.001995576290307906
            },
            "6m": {
              "direction": "Rising",
              "slope": 0.0015668905666766954
            },
            "1y": {
              "direction": "Rising",
              "slope": 0.0015668905666766954
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
              "direction": "Rising",
              "slope": 0.018883136430696636
            },
            "90d": {
              "direction": "Rising",
              "slope": 0.00013847707792048844
            },
            "6m": {
              "direction": "Falling",
              "slope": -0.0006309593451036868
            },
            "1y": {
              "direction": "Falling",
              "slope": -0.0006309593451036868
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

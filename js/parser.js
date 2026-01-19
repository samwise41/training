// js/parser.js

export const Parser = {
    lastDebugInfo: {}, 

    getSection(md, title) {
        if (!md) return "";
        const lines = md.split('\n');
        let capturing = false, section = [];
        for (let line of lines) {
            const trimmed = line.trim();
            const isHeader = trimmed.startsWith('#');
            if (isHeader) {
                if (trimmed.toLowerCase().includes(title.toLowerCase())) {
                    capturing = true;
                    continue;
                }
                if (capturing && !trimmed.startsWith('###')) {
                    break;
                }
            }
            if (capturing) section.push(line);
        }
        return section.join('\n').trim();
    },

    getBiometrics(md) {
        const profileSection = this.getSection(md, "Profile") || this.getSection(md, "Biometrics");
        
        const ftp = profileSection.match(/Cycling FTP[^0-9]*(\d{1,3})/i);
        const weight = profileSection.match(/Weight[^0-9]*(\d{1,3})/i);
        const lthr = profileSection.match(/Lactate Threshold HR[^0-9]*(\d{2,3})/i);
        const runFtp = profileSection.match(/Functional Threshold Pace.*?(\d{1,2}:\d{2})/i);
        const fiveK = profileSection.match(/5K Prediction.*?(\d{1,2}:\d{2})/i);

        return {
            watts: ftp ? parseInt(ftp[1]) : 0,
            weight: weight ? parseInt(weight[1]) : 0,
            lthr: lthr ? parseInt(lthr[1]) : 0,
            runFtp: runFtp ? runFtp[1] : "--",
            fiveK: fiveK ? fiveK[1] : "--"
        };
    },

    _parseTime(str) {
        if (!str) return 0;
        const isHours = str.toLowerCase().includes('h');
        const numMatch = str.match(/([\d\.]+)/);
        if (!numMatch) return 0;
        const val = parseFloat(numMatch[1]);
        if (isNaN(val)) return 0;
        if (isHours || (val < 10 && !str.toLowerCase().includes('m'))) return Math.round(val * 60);
        return Math.round(val);
    },

    _getType(str) {
        if (!str) return 'Other';
        const lower = str.toLowerCase();
        if (lower.match(/bike|cycle|zwift|ride|spin|peloton|cycling/)) return 'Bike';
        if (lower.match(/run|jog|treadmill/)) return 'Run';
        if (lower.match(/swim|pool/)) return 'Swim';
        if (lower.match(/strength|lift|gym|core/)) return 'Strength';
        return 'Other';
    },

    _parseTableBlock(sectionText) {
        if (!sectionText) return [];
        const lines = sectionText.split('\n');
        
        // Header Indices
        let dateIdx = -1, statusIdx = -1, planWorkoutIdx = -1, planDurIdx = -1;
        let actWorkoutIdx = -1, actDurIdx = -1, notesIdx = -1;
        let rawDurIdx = -1;

        let hrIdx = -1, powerIdx = -1, speedIdx = -1, tssIdx = -1, activityIdIdx = -1, cadenceIdx = -1; 
        let teLabelIdx = -1;
        let vo2Idx = -1, gctIdx = -1, vertIdx = -1, anaerobicIdx = -1, normPowerIdx = -1, elevIdx = -1;
        
        // --- NEW: Indices ---
        let rpeIdx = -1, feelIdx = -1;
        let sportTypeIdx = -1, actTypeIdx = -1;

        let data = [];

        for (let line of lines) {
            if (line.includes('|')) {
                const lowLine = line.toLowerCase();
                if (lowLine.includes('date')) {
                    const cleanHeaders = line.split('|').map(h => h.trim().toLowerCase().replace(/\*\*/g, ''));
                    cleanHeaders.forEach((h, index) => {
                        // Standard Columns
                        if (h.includes('date')) dateIdx = index;
                        else if (h.includes('status')) statusIdx = index;
                        else if (h.includes('planned workout')) planWorkoutIdx = index;
                        else if (h.includes('planned duration')) planDurIdx = index;
                        else if (h.includes('actual duration')) actDurIdx = index;
                        else if (h === 'duration') rawDurIdx = index;
                        else if (h.includes('actual workout')) actWorkoutIdx = index;
                        else if (h.includes('notes') || h.includes('target')) notesIdx = index;
                        else if (h.includes('averagehr')) hrIdx = index;
                        else if (h.includes('avgpower')) powerIdx = index;
                        else if (h.includes('averagespeed')) speedIdx = index;
                        else if (h.includes('trainingstressscore')) tssIdx = index;
                        else if (h.includes('activityid')) activityIdIdx = index;
                        else if (h.includes('averagebikingcadence')) cadenceIdx = index;
                        else if (h.includes('trainingeffectlabel')) teLabelIdx = index;
                        
                        // Metrics
                        else if (h.includes('vo2max')) vo2Idx = index;
                        else if (h.includes('groundcontact')) gctIdx = index;
                        else if (h.includes('verticaloscillation')) vertIdx = index;
                        else if (h.includes('anaerobictraining')) anaerobicIdx = index;
                        else if (h.includes('normpower')) normPowerIdx = index;
                        else if (h.includes('elevationgain')) elevIdx = index;
                        
                        // --- NEW: Map Additional Columns ---
                        else if (h === 'rpe') rpeIdx = index;
                        else if (h === 'feeling') feelIdx = index;
                        else if (h.includes('sporttypeid')) sportTypeIdx = index;
                        else if (h.includes('activitytype')) actTypeIdx = index;
                    });
                    if (dateIdx !== -1) break; 
                }
            }
        }

        if (dateIdx === -1) return [];

        for (let line of lines) {
            if (!line.includes('|') || line.includes('---')) continue;
            const cols = line.split('|');
            if (cols.length < 3) continue; 

            const cleanText = (str) => (str || "").trim().replace(/\*\*/g, '').replace(/__/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
            const getCol = (idx) => (idx > -1 && idx < cols.length) ? cleanText(cols[idx]) : "";

            const dateStr = getCol(dateIdx);
            if (!dateStr || dateStr.toLowerCase().includes('date')) continue;

            const planStr = getCol(planWorkoutIdx);
            const statusStr = getCol(statusIdx).toLowerCase();
            const planDurStr = getCol(planDurIdx);
            const actDurStr = getCol(actDurIdx);
            const rawDurStr = getCol(rawDurIdx); 
            const actualWorkoutStr = getCol(actWorkoutIdx);
            const notesStr = getCol(notesIdx);

            // Parse Numerics
            const avgHR = parseFloat(getCol(hrIdx)) || 0;
            const avgPower = parseFloat(getCol(powerIdx)) || 0;
            const avgSpeed = parseFloat(getCol(speedIdx)) || 0;
            const tss = parseFloat(getCol(tssIdx)) || 0;
            const avgCadence = parseFloat(getCol(cadenceIdx)) || 0; 
            const activityId = getCol(activityIdIdx);
            const trainingEffectLabel = getCol(teLabelIdx);

            const vO2MaxValue = parseFloat(getCol(vo2Idx)) || 0;
            const avgGroundContactTime = parseFloat(getCol(gctIdx)) || 0;
            const avgVerticalOscillation = parseFloat(getCol(vertIdx)) || 0;
            const anaerobicTrainingEffect = parseFloat(getCol(anaerobicIdx)) || 0;
            const normPower = parseFloat(getCol(normPowerIdx)) || 0; 
            const elevationGain = parseFloat(getCol(elevIdx)) || 0; 

            // --- NEW: Extract Raw Data ---
            const rpe = getCol(rpeIdx);       
            const feeling = getCol(feelIdx);
            const sportTypeId = getCol(sportTypeIdx);
            const activityType = getCol(actTypeIdx);

            let date = null;
            const ymdMatch = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
            if (ymdMatch) {
                date = new Date(parseInt(ymdMatch[1]), parseInt(ymdMatch[2]) - 1, parseInt(ymdMatch[3]), 12, 0, 0); 
            } else {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) { date = d; date.setHours(12, 0, 0, 0); }
            }

            if (date && !isNaN(date.getTime())) {
                const type = this._getType(planStr);
                const actualType = this._getType(actualWorkoutStr);

                let actDurVal = 0;
                const rawSeconds = parseFloat(rawDurStr);
                
                if (!isNaN(rawSeconds) && rawSeconds > 0) {
                    actDurVal = Math.round(rawSeconds / 60);
                } else {
                    actDurVal = this._parseTime(actDurStr);
                }
                
                const isCompleted = statusStr.match(/completed|done|yes|x|exact|found/) || (actDurVal > 0);

                let ef = 0;
                if (avgHR > 0) {
                    if (actualType === 'Bike') ef = avgPower / avgHR;
                    else if (actualType === 'Run') ef = avgSpeed / avgHR;
                }

                data.push({
                    date: date,
                    dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    type: type,
                    actualType: actualType,
                    planName: planStr,
                    actualName: actualWorkoutStr,
                    completed: isCompleted,
                    plannedDuration: this._parseTime(planDurStr),
                    actualDuration: actDurVal,
                    notes: notesStr,
                    avgHR, avgPower, avgSpeed, tss, ef, avgCadence, activityId, trainingEffectLabel,
                    vO2MaxValue, 
                    avgGroundContactTime, 
                    avgVerticalOscillation, 
                    anaerobicTrainingEffect,
                    normPower, 
                    trainingStressScore: tss,
                    elevationGain,
                    // --- NEW: Pass data to Charts ---
                    RPE: rpe,        
                    Feeling: feeling,
                    sportTypeId,
                    activityType
                });
            }
        }
        return data;
    },

    parseTrainingLog(md) {
        let historySection = this.getSection(md, "Appendix C: Training History Log") || this.getSection(md, "Training History");
        const scheduleSection = this.getSection(md, "Weekly Schedule");
        if (!historySection && md.includes('|')) historySection = md; 
        
        const historyData = this._parseTableBlock(historySection);
        const scheduleData = this._parseTableBlock(scheduleSection);
        return [...historyData, ...scheduleData];
    },
    
    parseGearMatrix(md) {
        const results = { bike: [], run: [] };
        const lines = md.split('\n');
        let currentType = null;
        let inTable = false;
        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
                const low = trimmed.toLowerCase();
                if (low.includes('cycling') || low.includes('bike')) currentType = 'bike';
                else if (low.includes('running') || low.includes('run')) currentType = 'run';
                else currentType = null;
                inTable = false;
                continue;
            }
            if (currentType && trimmed.startsWith('|')) {
                if (trimmed.includes('---') || trimmed.toLowerCase().includes('range')) { inTable = true; continue; }
                if (inTable) {
                    const parts = trimmed.split('|').map(p => p.trim());
                    if (trimmed.startsWith('|')) parts.shift();
                    if (trimmed.endsWith('|')) parts.pop();
                    if (parts.length >= 2) {
                        const rangeStr = parts[0];
                        let min = -999, max = 999;
                        const numMatch = rangeStr.match(/\d+/g);
                        if (!numMatch) continue;
                        const lowRangeStr = rangeStr.toLowerCase();
                        if (lowRangeStr.match(/below|under|<|less/)) { min = -999; max = parseInt(numMatch[0]); } 
                        else if (lowRangeStr.match(/above|over|up|\+|more/)) { min = parseInt(numMatch[0]); max = 999; } 
                        else if (numMatch.length >= 2) { min = parseInt(numMatch[0]); max = parseInt(numMatch[1]); } 
                        else { min = parseInt(numMatch[0]); max = parseInt(numMatch[0]); }
                        results[currentType].push({ min, max, upper: parts[1] || "—", lower: parts[2] || "—", extremities: parts[3] || "—" });
                    }
                }
            } else if (inTable && trimmed !== "") inTable = false;
        }
        return results;
    }
};

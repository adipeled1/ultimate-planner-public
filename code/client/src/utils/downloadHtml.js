export function downloadHTMLReport(schedules) {
  if (!schedules || !schedules.length) return;
  const htmlContent = generateExactPythonHTML(schedules);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schedules_report.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const COLORS = [
  "#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", 
  "#A0C4FF", "#BDB2FF", "#FFC6FF", "#FFFFFC", "#D4C1EC",
  "#F49AC2", "#87CEFA"
];

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function generateExactPythonHTML(schedules) {
  const total = schedules.length;
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  const startHour = 8;
  const endHour = 22;
  const totalMinutes = (endHour - startHour) * 60;

  const style = `
      @page { size: A4; margin: 10mm; }
      
      html, body {
          width: 100%;
          margin: 0;
          padding: 0;
          background-color: #ffffff; 
      }

      body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
          padding: 10px;
      }

      .page-container { 
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 20px;
          page-break-inside: avoid; 
      }

      h2 { 
          text-align: center; 
          margin: 0 0 15px 0; 
          color: #000000 !important; 
          background-color: transparent; 
          padding: 5px;
          border: none;
          font-size: 20px; 
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
      }
      
      .calendar-container {
          position: relative;
          width: 100%;
          height: 950px; 
          background-color: #0E1117; 
          border: 1px solid #444; 
          border-radius: 4px;
          overflow: hidden;
          color: #fafafa;
      }
      .day-header {
          position: absolute;
          top: 0;
          height: 30px; 
          text-align: center;
          font-weight: 600;
          border-bottom: 1px solid #444;
          border-right: 1px solid #333;
          line-height: 30px;
          background: #262730; 
          color: #fafafa;
          font-size: 13px;
      }
      .grid-line {
          position: absolute;
          width: 100%;
          border-top: 1px dashed #444; 
          color: #888;
          font-size: 9px;
      }
      .grid-line span {
          position: absolute;
          top: -8px;
          left: 2px;
          color: #888;
      }
      .event-card {
          position: absolute;
          border-radius: 3px;
          padding: 4px;
          box-sizing: border-box;
          color: #2c3e50; 
          font-size: 11px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          line-height: 1.2;
      }
      .event-card .time { font-weight: 800; font-size: 11px; margin-bottom: 2px; }
      .event-card .title { font-weight: 700; font-size: 11px; margin-bottom: 2px; }
      .event-card .meta { font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      
      .time-col {
          position: absolute;
          left: 0;
          width: 14.28%;
          height: 100%;
          background: #262730; 
          border-right: 1px solid #444;
      }
  `;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Schedule Report</title><style>${style}</style></head><body>`;

  let printColorMap = {};
  let printColorIdx = 0;

  schedules.forEach((schedule, index) => {
      const pageBreakStyle = (index < total - 1) ? "page-break-after: always;" : "";
      
      html += `<div class="page-container" style="${pageBreakStyle}">`;
      html += `<h2>Optimal Schedule - Option ${index + 1}/${total}</h2>`;
      
      let eventsHtml = "";
      
      schedule.forEach(group => {
          const rawName = group.course_name;
          const courseNameKey = rawName.split('(')[0].trim();
          
          if (!printColorMap[courseNameKey]) {
              printColorMap[courseNameKey] = COLORS[printColorIdx % COLORS.length];
              printColorIdx++;
          }
          const bgColor = printColorMap[courseNameKey];
          
          group.slots.forEach(slot => {
              if (!days.includes(slot.day)) return;
              
              const dayIndex = days.indexOf(slot.day);
              const startOffset = slot.start - (startHour * 60);
              const topPercent = (startOffset / totalMinutes) * 100;
              
              const duration = slot.end - slot.start;
              const heightPercent = (duration / totalMinutes) * 100;
              
              const timeStr = `${formatTime(slot.start)}-${formatTime(slot.end)}`;
              
              const typeStr = group.component_type || '?';
              const context = `${group.course_name} (${typeStr})`;

              eventsHtml += `
              <div class="event-card" style="
                  left: calc(${dayIndex + 1} * 14.28%); 
                  width: 13.5%; 
                  top: ${topPercent}%; 
                  height: ${heightPercent}%; 
                  background-color: ${bgColor};">
                  <div class="time">${timeStr}</div>
                  <div class="title">${context}</div>
                  <div class="meta">${group.teacher}</div>
                  <div class="meta">${slot.location}</div>
              </div>`;
          });
      });

      let gridLinesHtml = "";
      for (let h = startHour; h <= endHour; h++) {
          const topPct = ((h - startHour) * 60 / totalMinutes) * 100;
          gridLinesHtml += `<div class="grid-line" style="top: ${topPct}%;"><span>${h}:00</span></div>`;
      }

      let headersHtml = "";
      dayLabels.forEach((label, idx) => {
          headersHtml += `<div class="day-header" style="left: calc(${idx+1} * 14.28%); width: 14.28%;">${label}</div>`;
      });

      html += `
      <div class="calendar-container">
          <div class="time-col"></div>
          <div style="position: absolute; top: 30px; bottom: 0; left: 0; right: 0;">
              ${gridLinesHtml}
              ${eventsHtml}
          </div>
          <div style="position: absolute; width: 100%; height: 30px;">
              <div class="day-header" style="left:0; width: 14.28%;">Time</div>
              ${headersHtml}
          </div>
      </div>
      </div>`; 
  });

  html += "</body></html>";
  return html;
}

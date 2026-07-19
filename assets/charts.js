(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var blue = style.getPropertyValue('--blue').trim() || '#5470c6';
  var orange = style.getPropertyValue('--orange').trim() || '#fc8452';
  var green = style.getPropertyValue('--green').trim() || '#91cc75';
  var purple = style.getPropertyValue('--purple').trim() || '#9a60b4';
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var allCharts = [];
  var currentMode = 'weekly';
  var currentKey = '26W28';
  var currentBranch = '南部全部';

  // Week date ranges (approximate: each week = 7 days from 26W01 start 2025-12-29)
  var WEEK_START = new Date(2025, 11, 29); // 26W01 starts Dec 29, 2025
  function getWeekDate(weekStr) {
    var num = parseInt(weekStr.replace('26W', ''));
    var d = new Date(WEEK_START);
    d.setDate(d.getDate() + (num - 1) * 7);
    var end = new Date(d);
    end.setDate(end.getDate() + 6);
    var fmt = function(dt) { return (dt.getMonth()+1).toString().padStart(2,'0') + '.' + dt.getDate().toString().padStart(2,'0'); };
    return fmt(d) + ' - ' + fmt(end);
  }

  var MONTH_DATES = {
    '1月': '01.01 - 01.31', '2月': '02.01 - 02.28', '3月': '03.01 - 03.31',
    '4月': '04.01 - 04.30', '5月': '05.01 - 05.31', '6月': '06.01 - 06.30',
    '7月': '07.01 - 07.05'
  };

  function getData() {
    if (currentBranch === '南部全部') {
      if (currentMode === 'weekly') {
        return DASHBOARD_ALL.data[currentKey] || DASHBOARD_ALL.data['26W27'];
      } else {
        return DASHBOARD_ALL.monthly[currentKey] || DASHBOARD_ALL.monthly['7月'];
      }
    } else {
      if (currentMode === 'weekly') {
        var bw = DASHBOARD_ALL.branchData[currentKey];
        return bw ? bw[currentBranch] : null;
      } else {
        var bm = DASHBOARD_ALL.branchMonthly[currentKey];
        return bm ? bm[currentBranch] : null;
      }
    }
  }

  function updateHeader() {
    var headerWeek = document.getElementById('header-week');
    var headerDate = document.getElementById('header-date');
    var headerYoy = document.getElementById('header-yoy-ref');
    var headerTitle = document.querySelector('.header h1');
    var headerSub = document.querySelector('.header .sub');
    if (!headerWeek) return;

    var branchLabel = currentBranch === '南部全部' ? '南部战区' : currentBranch + '分公司';
    if (headerTitle) headerTitle.textContent = branchLabel + ' AVC ' + (currentMode === 'weekly' ? '周度' : '月度') + '市场分析看板';

    if (currentMode === 'weekly') {
      headerWeek.textContent = currentKey;
      headerDate.textContent = getWeekDate(currentKey);
      var yoyWeek = currentKey.replace('26W', '25W');
      if (headerYoy) headerYoy.textContent = yoyWeek;
    } else {
      headerWeek.textContent = currentKey;
      headerDate.textContent = MONTH_DATES[currentKey] || '';
      if (headerYoy) headerYoy.textContent = '月度累计';
    }
  }

  function updateKPIs(d) {
    if (!d.totals) return;
    var t = d.totals;

    // 创维销额
    var kpiCw = document.getElementById('kpi-cw');
    if (kpiCw) kpiCw.innerHTML = t.cw.toFixed(1) + '<span class="delta down">万</span>';

    // 行业销额
    var kpiHy = document.getElementById('kpi-hy');
    if (kpiHy) kpiHy.textContent = t.hy.toFixed(1) + '万';

    // 市占率
    var kpiMs = document.getElementById('kpi-ms');
    if (kpiMs) kpiMs.textContent = (t.ms*100).toFixed(1) + '%';

    // 同期市占率 + 同比
    if (t.ms_25 !== undefined) {
      var kpiMs25 = document.getElementById('kpi-ms-25');
      if (kpiMs25) kpiMs25.textContent = (t.ms_25*100).toFixed(1) + '%';
    }
    if (t.yoy !== undefined) {
      var kpiYoy = document.getElementById('kpi-yoy');
      if (kpiYoy) {
        var yoyVal = (t.yoy*100).toFixed(1);
        kpiYoy.textContent = (t.yoy >= 0 ? '+' : '') + yoyVal + '%';
      }
    }

    // 目标达成率
    var kpiAchieve = document.getElementById('kpi-achieve');
    if (kpiAchieve && t.achieve !== undefined) {
      kpiAchieve.textContent = (t.achieve*100).toFixed(1) + '%';
      var kpiAchieveSub = document.getElementById('kpi-achieve-sub');
      if (kpiAchieveSub) {
        var targetPct = t.target !== undefined ? (t.target*100).toFixed(1) : '24.5';
        var status = t.achieve >= 1.0 ? '超额完成' : t.achieve >= 0.9 ? '接近目标' : '未达标';
        kpiAchieveSub.textContent = '目标 ' + targetPct + '% · ' + status;
      }
    }

    // vs 海信差距
    var kpiGap = document.getElementById('kpi-gap');
    if (kpiGap) {
      var gap = t.cw - t.hx;
      kpiGap.innerHTML = gap.toFixed(1) + '<span class="delta down">万</span>';
    }
    var kpiHx = document.getElementById('kpi-hx');
    if (kpiHx) kpiHx.textContent = t.hx.toFixed(1) + '万';
    var kpiTcl = document.getElementById('kpi-tcl');
    if (kpiTcl) kpiTcl.textContent = t.tcl.toFixed(1) + '万';

    // Q7H vs U7S-PRO (weekly only)
    var kpiQ7hCard = document.getElementById('kpi-q7h-card');
    var kpiQ7h = document.getElementById('kpi-q7h');
    var kpiQ7hSub = document.getElementById('kpi-q7h-sub');
    if (d.q7hData && d.q7hData.length > 0) {
      if (kpiQ7hCard) kpiQ7hCard.style.display = '';
      var q7hTotal = d.q7hData.reduce(function(s, r) { return s + r.q7h_s; }, 0);
      var u7sTotal = d.q7hData.reduce(function(s, r) { return s + r.u7s_s; }, 0);
      var q7hE = d.q7hData.reduce(function(s, r) { return s + r.q7h_e; }, 0);
      var u7sE = d.q7hData.reduce(function(s, r) { return s + r.u7s_e; }, 0);
      if (kpiQ7h) kpiQ7h.textContent = q7hTotal + ' : ' + u7sTotal;
      if (kpiQ7hSub) {
        var ratio = u7sTotal > 0 ? (q7hTotal / u7sTotal).toFixed(1) : '-';
        kpiQ7hSub.textContent = '控比 ' + ratio + 'x · 销额 ' + q7hE.toFixed(1) + '万 vs ' + u7sE.toFixed(1) + '万';
      }
    } else {
      if (kpiQ7hCard) kpiQ7hCard.style.display = 'none';
    }
  }

  function updateSectionVisibility(d) {
    // Branch detail section visibility
    var branchDetail = document.getElementById('branch-detail');
    var tocBranchDetail = document.getElementById('toc-branch-detail');
    var isBranch = currentBranch !== '南部全部';
    
    if (branchDetail) branchDetail.style.display = isBranch ? '' : 'none';
    if (tocBranchDetail) tocBranchDetail.style.display = isBranch ? '' : 'none';

    // TOC grid: 6 columns when branch, 5 when all
    var tocGrid = document.getElementById('toc-grid');
    if (tocGrid) {
      tocGrid.style.gridTemplateColumns = isBranch ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)';
    }

    // Update badge text
    var branchLabel = currentBranch === '南部全部' ? '南部战区' : currentBranch;
    var badges = document.querySelectorAll('.section-header .badge');
    badges.forEach(function(b) {
      b.textContent = currentKey + ' ' + branchLabel;
    });
  }

  function renderBranchDetail(d) {
    if (currentBranch === '南部全部') return;
    if (!d.totals) return;

    var allData = (currentMode === 'weekly' ? DASHBOARD_ALL.data : DASHBOARD_ALL.monthly)[currentKey];
    if (!allData || !allData.msData) return;

    // 1. Compute rankings
    var rankAmount = 1, rankMs = 1, rankAchieve = 1;
    var branchCw = d.totals.cw;
    var branchMs = d.totals.ms;
    var branchAchieve = d.totals.achieve;
    allData.msData.forEach(function(r) {
      if (r.branch !== currentBranch) {
        if (r.cw > branchCw) rankAmount++;
        if (r.cw_ms > branchMs) rankMs++;
        if (r.achieve > branchAchieve) rankAchieve++;
      }
    });

    // 2. Contribution
    var totalCw = allData.totals ? allData.totals.cw : 0;
    var contribution = totalCw > 0 ? (branchCw / totalCw * 100) : 0;
    var leadHx = d.totals.cw - d.totals.hx;

    // Update ranking cards
    var rkAmt = document.getElementById('br-rank-amount');
    if (rkAmt) rkAmt.textContent = '第' + rankAmount;
    var rkMs = document.getElementById('br-rank-ms');
    if (rkMs) rkMs.textContent = '第' + rankMs;
    var rkAch = document.getElementById('br-rank-achieve');
    if (rkAch) rkAch.textContent = '第' + rankAchieve;
    var brCont = document.getElementById('br-contribution');
    if (brCont) brCont.textContent = contribution.toFixed(1) + '%';
    var brLead = document.getElementById('br-lead-hx');
    if (brLead) {
      brLead.textContent = (leadHx >= 0 ? '+' : '') + leadHx.toFixed(1) + '万';
      brLead.style.color = leadHx >= 0 ? 'var(--green)' : 'var(--accent)';
    }

    // 3. Trend chart: last 5-6 weeks
    var allWeeks = DASHBOARD_ALL.allWeeks;
    var trendWeeks = [], trendAmounts = [], trendMS = [];
    var lastWeeks = allWeeks.slice(-6);
    lastWeeks.forEach(function(w) {
      var bw = DASHBOARD_ALL.branchData[w];
      if (bw && bw[currentBranch] && bw[currentBranch].totals) {
        trendWeeks.push(w);
        trendAmounts.push(bw[currentBranch].totals.cw.toFixed(1));
        trendMS.push(+(bw[currentBranch].totals.ms * 100).toFixed(1));
      }
    });
    // Update trend title
    var trendTitle = document.getElementById('br-trend-title');
    if (trendTitle) trendTitle.textContent = '近' + trendWeeks.length + '周创维销额 & 市占率趋势';

    var trendEl = document.getElementById('chart-branch-trend');
    if (trendEl && trendWeeks.length > 0) {
      var tChart = echarts.init(trendEl, null, { renderer: 'svg' });
      tChart.setOption({
        animation: false, tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['销额(万)', '市占率%'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: trendWeeks, axisLabel: { color: muted, fontSize: 10 } },
        yAxis: [{ type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
          { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { show: false } }],
        color: [accent, blue],
        series: [
          { name: '销额(万)', type: 'bar', data: trendAmounts, barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0] }, label: { show: true, position: 'top', color: ink, fontSize: 9 } },
          { name: '市占率%', type: 'line', yAxisIndex: 1, data: trendMS, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: blue }, itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 }, label: { show: true, color: blue, fontSize: 9, formatter: '{c}%' } }
        ]
      });
      allCharts.push(tChart);
    }

    // 4. Brand competition pie chart
    var pieEl = document.getElementById('chart-branch-brand-pie');
    if (pieEl && d.brandOverview) {
      var pChart = echarts.init(pieEl, null, { renderer: 'svg' });
      var pieData = d.brandOverview.map(function(r) {
        return { name: r.brand, value: r.amount };
      });
      pChart.setOption({
        animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
        legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: ink, fontSize: 10 } },
        series: [{
          type: 'pie', radius: ['50%', '75%'], center: ['40%', '50%'], data: pieData,
          label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' },
          itemStyle: { borderColor: bg2, borderWidth: 2 },
          emphasis: { label: { fontSize: 14, fontWeight: 'bold' } }
        }]
      });
      allCharts.push(pChart);
    }

    // 5. Branch CW TOP10
    var cwTop10El = document.getElementById('chart-branch-cw-top10');
    if (cwTop10El && d.top20_cw) {
      var cwChart = echarts.init(cwTop10El, null, { renderer: 'svg' });
      var items = d.top20_cw.slice(0, 10);
      var labels = items.map(function(r) { return r.model; }).reverse();
      var vals = items.map(function(r) { return r.amount; }).reverse();
      cwChart.setOption({
        animation: false, tooltip: { trigger: 'axis', appendToBody: true },
        grid: { left: '3%', right: '12%', bottom: '8%', top: '5%', containLabel: true },
        xAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
        yAxis: { type: 'category', data: labels, axisLabel: { color: ink, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
        series: [{ type: 'bar', data: vals, barWidth: '55%', itemStyle: { borderRadius: [0,4,4,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:accent},{offset:1,color:accent+'66'}]) }, label: { show: true, position: 'right', color: accent, fontSize: 10, fontWeight: 'bold' } }]
      });
      allCharts.push(cwChart);
    }

    // 6. Branch competitor TOP10 (non-创维)
    var compTop10El = document.getElementById('chart-branch-comp-top10');
    if (compTop10El && d.top20) {
      var compChart = echarts.init(compTop10El, null, { renderer: 'svg' });
      var compItems = d.top20.filter(function(r) { return r.brand !== '创维'; }).slice(0, 10);
      if (compItems.length > 0) {
        var compLabels = compItems.map(function(r) { return r.brand + ' ' + r.model; }).reverse();
        var compVals = compItems.map(function(r) { return r.amount; }).reverse();
        compChart.setOption({
          animation: false, tooltip: { trigger: 'axis', appendToBody: true },
          grid: { left: '3%', right: '12%', bottom: '8%', top: '5%', containLabel: true },
          xAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
          yAxis: { type: 'category', data: compLabels, axisLabel: { color: ink, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
          series: [{ type: 'bar', data: compVals, barWidth: '55%', itemStyle: { borderRadius: [0,4,4,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:blue},{offset:1,color:blue+'66'}]) }, label: { show: true, position: 'right', color: blue, fontSize: 10, fontWeight: 'bold' } }]
        });
      }
      allCharts.push(compChart);
    }

    // 7. Insight text
    var insightText = document.getElementById('branch-detail-insight-text');
    if (insightText) {
      var yoyStr = d.totals.yoy !== undefined ? ('同比' + (d.totals.yoy >= 0 ? '+' : '') + (d.totals.yoy*100).toFixed(1) + '%') : '';
      insightText.textContent = currentBranch + '分公司在南部战区11个分公司中，销额排名第' + rankAmount + '，市占率排名第' + rankMs + '，达成率排名第' + rankAchieve + '。' +
        '贡献南部战区创维销额' + contribution.toFixed(1) + '%。' + yoyStr + '。' +
        '分公司内' + (leadHx >= 0 ? '领先' : '落后') + '海信' + Math.abs(leadHx).toFixed(1) + '万。';
    }
  }

  function renderAll() {
    // Dispose old charts
    allCharts.forEach(function(c) { c.dispose(); });
    allCharts = [];

    var d = getData();
    if (!d) {
      // Show empty state
      updateHeader();
      var kpiCw = document.getElementById('kpi-cw');
      if (kpiCw) kpiCw.innerHTML = '-<span class="delta down">万</span>';
      var kpiMs = document.getElementById('kpi-ms');
      if (kpiMs) kpiMs.textContent = '-';
      document.getElementById('table-brand-body').innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px">该分公司在当前时间段暂无数据</td></tr>';
      document.getElementById('ms-table-body').innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px">暂无数据</td></tr>';
      return;
    }

    updateHeader();
    updateKPIs(d);
    updateSectionVisibility(d);
    renderBranchDetail(d);

    // ========== TABLES ==========
    // Brand overview table
    if (d.brandOverview) {
      var boHtml = '';
      d.brandOverview.forEach(function(r) {
        var isCW = r.brand === '创维';
        var yTag = (r.yoy_ms || 0) >= 0 ? 'tag-green' : 'tag-red';
        var yoyStr = r.yoy_ms !== undefined ? ('<span class="tag ' + yTag + '">' + (r.yoy_ms >= 0 ? '+' : '') + (r.yoy_ms*100).toFixed(1) + '%</span>') : '-';
        boHtml += '<tr' + (isCW ? ' style="background:rgba(0,153,255,0.06);font-weight:600"' : '') + '>';
        boHtml += '<td class="rank"><span class="rank-dot rd-o">' + r.rank + '</span></td>';
        boHtml += '<td><strong>' + r.brand + '</strong></td>';
        boHtml += '<td class="num">' + r.sales.toLocaleString() + '</td>';
        boHtml += '<td class="num">' + r.amount.toFixed(2) + '</td>';
        boHtml += '<td class="num">' + (r.ms_sales*100).toFixed(1) + '%</td>';
        boHtml += '<td class="num"><strong>' + (r.ms_amount*100).toFixed(1) + '%</strong></td>';
        boHtml += '<td class="num">' + yoyStr + '</td>';
        boHtml += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
      });
      document.getElementById('table-brand-body').innerHTML = boHtml;
    }

    // Brand overview chart
    var c2bEl = document.getElementById('chart-brand-overview');
    if (c2bEl && d.brandOverview) {
      var c2b = echarts.init(c2bEl, null, { renderer: 'svg' });
      var boBrands = d.brandOverview.map(function(r) { return r.brand; });
      var boAmount = d.brandOverview.map(function(r) { return r.amount; });
      var boMS = d.brandOverview.map(function(r) { return +(r.ms_amount * 100).toFixed(1); });
      c2b.setOption({
        animation: false, tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['销额(万)', '额市占率%'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: boBrands, axisLabel: { color: muted, fontSize: 10 } },
        yAxis: [{ type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
          { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { show: false } }],
        color: [accent, orange],
        series: [
          { name: '销额(万)', type: 'bar', data: boAmount, barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0] }, label: { show: true, position: 'top', color: ink, fontSize: 9 } },
          { name: '额市占率%', type: 'line', yAxisIndex: 1, data: boMS, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: orange }, itemStyle: { color: orange, borderColor: '#fff', borderWidth: 2 }, label: { show: true, color: orange, fontSize: 9, formatter: '{c}%' } }
        ]
      });
      allCharts.push(c2b);
    }

    // MS table
    if (d.msData) {
      var msHtml = '';
      d.msData.forEach(function(r, i) {
        var rd = i === 0 ? 'rd-1' : i === 1 ? 'rd-2' : i === 2 ? 'rd-3' : 'rd-o';
        var aTag = r.achieve >= 1.0 ? 'tag-green' : r.achieve >= 0.9 ? 'tag-yellow' : 'tag-red';
        var lTag = r.lead_hx >= 0 ? 'tag-green' : 'tag-red';
        var yTag = (r.yoy || 0) >= 0 ? 'tag-green' : 'tag-red';
        var yoyStr = r.yoy !== undefined ? ('<span class="tag ' + yTag + '">' + (r.yoy >= 0 ? '+' : '') + (r.yoy*100).toFixed(1) + '%</span>') : '-';
        msHtml += '<tr><td class="rank"><span class="rank-dot ' + rd + '">' + (i+1) + '</span></td>';
        msHtml += '<td><strong>' + r.branch + '</strong></td>';
        msHtml += '<td class="num">' + r.cw.toFixed(2) + '</td>';
        msHtml += '<td class="num"><strong>' + (r.cw_ms*100).toFixed(1) + '%</strong></td>';
        msHtml += '<td class="num">' + (r.target*100).toFixed(1) + '%</td>';
        msHtml += '<td class="num"><span class="tag ' + aTag + '">' + (r.achieve*100).toFixed(1) + '%</span></td>';
        msHtml += '<td class="num">' + yoyStr + '</td>';
        msHtml += '<td class="num"><span class="tag ' + lTag + '">' + (r.lead_hx >= 0 ? '+' : '') + r.lead_hx.toFixed(1) + '万</span></td></tr>';
      });
      // Totals row (only when multiple branches)
      if (d.totals && d.msData && d.msData.length > 1) {
        var tc = d.totals;
        msHtml += '<tr style="font-weight:700;background:rgba(0,153,255,0.04)"><td colspan="2">合计</td>';
        msHtml += '<td class="num">' + tc.cw.toFixed(2) + '</td>';
        msHtml += '<td class="num">' + (tc.ms*100).toFixed(1) + '%</td>';
        msHtml += '<td class="num">-</td>';
        msHtml += '<td class="num">-</td>';
        var tyTag = (tc.yoy || 0) >= 0 ? 'tag-green' : 'tag-red';
        var tyStr = tc.yoy !== undefined ? ('<span class="tag ' + tyTag + '">' + (tc.yoy >= 0 ? '+' : '') + (tc.yoy*100).toFixed(1) + '%</span>') : '-';
        msHtml += '<td class="num">' + tyStr + '</td>';
        msHtml += '<td class="num"><span class="tag tag-red">' + (tc.cw - tc.hx).toFixed(1) + '万</span></td></tr>';
      }
      document.getElementById('ms-table-body').innerHTML = msHtml;
    }

    // ========== CHARTS ==========
    // CHART 1: MS vs Achieve
    var c1El = document.getElementById('chart-ms-achieve');
    if (c1El && d.msData) {
      var c1 = echarts.init(c1El, null, { renderer: 'svg' });
      var mx = d.msData.map(function(r) { return r.branch; }), my1 = d.msData.map(function(r) { return +(r.cw_ms*100).toFixed(1); }), my2 = d.msData.map(function(r) { return +(r.achieve*100).toFixed(1); });
      c1.setOption({
        animation: false, tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['市占率%', '达成率%'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: mx, axisLabel: { rotate: 30, fontSize: 10, color: muted } },
        yAxis: { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
        color: [accent, orange],
        series: [
          { name: '市占率%', type: 'bar', data: my1, barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0] }, label: { show: true, position: 'top', color: ink, fontSize: 9 } },
          { name: '达成率%', type: 'line', data: my2, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: orange }, itemStyle: { color: orange, borderColor: '#fff', borderWidth: 2 }, label: { show: true, color: orange, fontSize: 9, formatter: '{c}%' } }
        ]
      });
      allCharts.push(c1);
    }

    // CHART 2: YoY
    var c2El = document.getElementById('chart-yoy');
    if (c2El && d.msData && d.msData[0].yoy !== undefined) {
      var c2 = echarts.init(c2El, null, { renderer: 'svg' });
      var yoyData = d.msData.map(function(r) { return { name: r.branch, value: +(r.yoy * 100).toFixed(2) }; });
      var yoyX = yoyData.map(function(r) { return r.name; }), yoyY = yoyData.map(function(r) { return r.value; });
      c2.setOption({
        animation: false, tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) { return p[0].name + '<br/>同比: ' + (p[0].value >= 0 ? '+' : '') + p[0].value + '%'; } },
        grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
        xAxis: { type: 'category', data: yoyX, axisLabel: { rotate: 35, fontSize: 10, color: muted } },
        yAxis: { type: 'value', name: '百分点(%)', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
        series: [{ type: 'bar', data: yoyY.map(function(v) { return { value: v, itemStyle: { color: v >= 0 ? green : accent, borderRadius: v >= 0 ? [4,4,0,0] : [0,0,4,4] } }; }), barWidth: '55%',
          label: { show: true, position: 'top', color: ink, fontSize: 10, formatter: function(p) { return (p.value >= 0 ? '+' : '') + p.value + '%'; } } }]
      });
      allCharts.push(c2);
    }

    // ========== ALL SECTIONS (both weekly & monthly) ==========

      // CHART 3: 98+ horizontal bar
      var c3El = document.getElementById('chart-98-bar');
      if (c3El && d.data98) {
        var c3 = echarts.init(c3El, null, { renderer: 'svg' });
        var b98 = d.data98.map(function(r) { return r.branch; }).reverse();
        var cw98 = d.data98.map(function(r) { return r.cw_s; }).reverse();
        var hx98 = d.data98.map(function(r) { return r.hx_s; }).reverse();
        var tcl98 = d.data98.map(function(r) { return r.tcl_s; }).reverse();
        c3.setOption({
          animation: false, tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(20,22,30,0.92)', borderColor: '#333', textStyle: { color: '#fff', fontSize: 12 } },
          legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: ink, fontSize: 11 }, itemWidth: 14, itemHeight: 10 },
          grid: { left: '3%', right: '10%', bottom: '12%', top: '5%', containLabel: true },
          xAxis: { type: 'value', name: '台', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLine: { lineStyle: { color: rule } } },
          yAxis: { type: 'category', data: b98, axisLabel: { color: ink, fontSize: 11, fontWeight: 'bold' }, axisLine: { show: false }, axisTick: { show: false } },
          color: [accent, blue, orange],
          series: [
            { name: '创维', type: 'bar', data: cw98, barWidth: '45%', barGap: '15%', itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:accent},{offset:1,color:accent+'66'}]) }, label: { show: true, position: 'right', color: accent, fontSize: 11, fontWeight: 'bold', formatter: '{c}台' } },
            { name: '海信', type: 'bar', data: hx98, barWidth: '45%', itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:blue},{offset:1,color:blue+'66'}]) }, label: { show: true, position: 'right', color: blue, fontSize: 10, formatter: '{c}台' } },
            { name: 'TCL', type: 'bar', data: tcl98, barWidth: '45%', itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:orange},{offset:1,color:orange+'66'}]) }, label: { show: true, position: 'right', color: orange, fontSize: 10, formatter: '{c}台' } }
          ]
        });
        allCharts.push(c3);
      }

      // 98+ table
      if (d.data98) {
        var t98Html = '';
        d.data98.forEach(function(r) {
          var ratioHx = r.hx_s > 0 ? (r.cw_s / r.hx_s).toFixed(1) : '-';
          var ratioTcl = r.tcl_s > 0 ? (r.cw_s / r.tcl_s).toFixed(1) : '-';
          t98Html += '<tr><td><strong>' + r.branch + '</strong></td>';
          t98Html += '<td class="num">' + r.cw_s + '</td><td class="num">' + r.cw_e.toFixed(2) + '</td>';
          t98Html += '<td class="num">' + r.hx_s + '</td><td class="num">' + r.hx_e.toFixed(2) + '</td>';
          t98Html += '<td class="num">' + r.tcl_s + '</td><td class="num">' + r.tcl_e.toFixed(2) + '</td>';
          t98Html += '<td class="num">' + ratioHx + '</td><td class="num">' + ratioTcl + '</td></tr>';
        });
        document.getElementById('table-98-body').innerHTML = t98Html;
      }

      // CHART 4: Heatmap
      var c4El = document.getElementById('chart-98-heat');
      if (c4El && d.heat98 && d.heat98.length > 0) {
        var c4 = echarts.init(c4El, null, { renderer: 'svg' });
        var brandsSet = new Set(), pricesSet = new Set();
        d.heat98.forEach(function(r) { brandsSet.add(r.brand); pricesSet.add(r.price_band); });
        var heatBrands = Array.from(brandsSet), heatPrices = Array.from(pricesSet).sort(function(a,b) { var o = {'<1万':1,'1-1.5万':2,'1.5-2万':3,'2-3万':4,'>3万':5}; return o[a]-o[b]; });
        var heatData = [];
        d.heat98.forEach(function(r) { heatData.push([heatPrices.indexOf(r.price_band), heatBrands.indexOf(r.brand), r.sales]); });
        c4.setOption({
          animation: false, tooltip: { trigger: 'item', appendToBody: true, backgroundColor: 'rgba(20,22,30,0.92)', borderColor: '#333', textStyle: { color: '#fff', fontSize: 12 },
            formatter: function(p) { return heatBrands[p.value[1]] + ' · ' + heatPrices[p.value[0]] + '<br/>销量: ' + p.value[2] + '台'; } },
          grid: { left: '15%', right: '8%', top: '10%', bottom: '12%' },
          xAxis: { type: 'category', data: heatPrices, axisLabel: { color: muted, fontSize: 10 }, position: 'top', axisLine: { lineStyle: { color: rule } } },
          yAxis: { type: 'category', data: heatBrands, axisLabel: { color: ink, fontSize: 10, fontWeight: 'bold' }, inverse: true, axisLine: { show: false }, axisTick: { show: false } },
          visualMap: { min: 0, max: 40, calculable: false, orient: 'horizontal', left: 'center', bottom: -8, inRange: { color: [bg2, accent2, accent] }, textStyle: { color: muted, fontSize: 10 } },
          series: [{ type: 'heatmap', data: heatData, label: { show: true, color: ink, fontSize: 10, fontWeight: 'bold' }, itemStyle: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' } }]
        });
        allCharts.push(c4);
      }

      // ===== TOP20 =====
      if (d.top20) {
        var topHtml = '';
        d.top20.forEach(function(r, i) {
          var bTag = r.brand === '创维' ? 'tag-red' : r.brand === '海信' ? 'tag-blue' : 'tag-yellow';
          var wowStr = r.wow_sales !== null ? ((r.wow_sales >= 0 ? '▲' : '▼') + Math.abs(r.wow_sales*100).toFixed(1) + '%') : '-';
          var wowColor = r.wow_sales !== null && r.wow_sales >= 0 ? 'color:var(--green)' : 'color:var(--accent)';
          topHtml += '<tr><td class="rank">' + (i+1) + '</td>';
          topHtml += '<td><span class="tag ' + bTag + '">' + r.brand + '</span></td>';
          topHtml += '<td><strong>' + r.model + '</strong></td>';
          topHtml += '<td class="num">' + r.sales + '</td>';
          topHtml += '<td class="num" style="' + wowColor + '">' + wowStr + '</td>';
          topHtml += '<td class="num">' + r.amount.toFixed(2) + '</td>';
          topHtml += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
        });
        document.getElementById('table-top20-body').innerHTML = topHtml;
      }

      // Treemap
      var cTreeEl = document.getElementById('chart-treemap');
      if (cTreeEl && d.top20) {
        var cTree = echarts.init(cTreeEl, null, { renderer: 'svg' });
        var treeData = [];
        var brandMap = {};
        d.top20.forEach(function(r) {
          if (!brandMap[r.brand]) brandMap[r.brand] = [];
          brandMap[r.brand].push({ name: r.model, value: r.amount });
        });
        for (var b in brandMap) {
          treeData.push({ name: b, children: brandMap[b] });
        }
        cTree.setOption({
          animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: function(p) { return p.name + '<br/>销额: ' + p.value.toFixed(2) + '万'; } },
          series: [{ type: 'treemap', data: treeData, roam: false, width: '100%', height: '100%',
            label: { show: true, formatter: function(p) { return p.name + '\n' + p.value.toFixed(1) + '万'; }, fontSize: 10 },
            upperLabel: { show: true, height: 24, fontSize: 12, fontWeight: 'bold' },
            itemStyle: { borderColor: '#fff', borderWidth: 1 } }]
        });
        allCharts.push(cTree);
      }

      // Brand TOP10 charts
      ['cw', 'hx', 'tcl'].forEach(function(brand, idx) {
        var el = document.getElementById('chart-' + brand + '-top10');
        if (!el || !d['top20_' + brand]) return;
        var c = echarts.init(el, null, { renderer: 'svg' });
        var items = d['top20_' + brand];
        var labels = items.map(function(r) { return r.model; }).reverse();
        var vals = items.map(function(r) { return r.amount; }).reverse();
        var colors = [accent, blue, orange];
        c.setOption({
          animation: false, tooltip: { trigger: 'axis', appendToBody: true },
          grid: { left: '3%', right: '12%', bottom: '8%', top: '5%', containLabel: true },
          xAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
          yAxis: { type: 'category', data: labels, axisLabel: { color: ink, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
          series: [{ type: 'bar', data: vals, barWidth: '55%', itemStyle: { borderRadius: [0,4,4,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:colors[idx]},{offset:1,color:colors[idx]+'66'}]) }, label: { show: true, position: 'right', color: colors[idx], fontSize: 10, fontWeight: 'bold' } }]
        });
        allCharts.push(c);
      });

      // ===== SIZE ANALYSIS =====
      // Size pies
      ['chart-size-pie', 'chart-cw-size-pie'].forEach(function(id, idx) {
        var el = document.getElementById(id);
        if (!el) return;
        var c = echarts.init(el, null, { renderer: 'svg' });
        var list = idx === 0 ? d.sizeList : d.cwSizeList;
        if (!list || list.length === 0) { allCharts.push(c); return; }
        var pieData = list.map(function(r) { return { name: r.size, value: r.amount }; });
        c.setOption({
          animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
          series: [{
            type: 'pie', radius: ['45%', '75%'], center: ['50%', '52%'], data: pieData,
            label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' },
            itemStyle: { borderColor: bg2, borderWidth: 2 }
          }]
        });
        allCharts.push(c);
      });

      // Sales vs Price combo
      var c7El = document.getElementById('chart-sales-price');
      if (c7El && d.cwSizeList) {
        var c7 = echarts.init(c7El, null, { renderer: 'svg' });
        var spLabels = d.cwSizeList.map(function(r) { return r.size; });
        c7.setOption({
          animation: false, tooltip: { trigger: 'axis', appendToBody: true },
          legend: { data: ['销量', '均价'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
          grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: spLabels, axisLabel: { color: muted, fontSize: 10 } },
          yAxis: [{ type: 'value', name: '台', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
            { type: 'value', name: '元', axisLabel: { color: muted, fontSize: 10, formatter: function(v) { return (v/1000).toFixed(0) + 'k'; } }, splitLine: { show: false } }],
          color: [accent, blue],
          series: [
            { name: '销量', type: 'bar', data: d.cwSizeList.map(function(r) { return r.sales; }), barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0] }, label: { show: true, position: 'top', color: ink, fontSize: 10 } },
            { name: '均价', type: 'line', yAxisIndex: 1, data: d.cwSizeList.map(function(r) { return r.avg_price; }), symbol: 'circle', symbolSize: 10, lineStyle: { width: 2.5, color: blue }, itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 }, label: { show: true, formatter: function(p) { return '¥' + (p.value/1000).toFixed(1) + 'k'; }, color: blue, fontSize: 10, fontWeight: 'bold' } }
          ]
        });
        allCharts.push(c7);
      }

      // Size brand share
      var c8El = document.getElementById('chart-size-brand');
      if (c8El && d.sizeSegs && d.cwShares) {
        var c8 = echarts.init(c8El, null, { renderer: 'svg' });
        var segsRev = d.sizeSegs.slice().reverse(), cwS = d.cwShares.slice().reverse(), hxS = d.hxShares.slice().reverse(), tclS = d.tclShares.slice().reverse();
        c8.setOption({
          animation: false, tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(20,22,30,0.92)', borderColor: '#333', textStyle: { color: '#fff', fontSize: 12 } },
          legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: ink, fontSize: 11 }, itemWidth: 14, itemHeight: 10 },
          grid: { left: '3%', right: '10%', bottom: '12%', top: '5%', containLabel: true },
          xAxis: { type: 'value', name: '销额份额 %', max: 50, axisLabel: { color: muted, fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLine: { lineStyle: { color: rule } } },
          yAxis: { type: 'category', data: segsRev, axisLabel: { color: ink, fontSize: 12, fontWeight: 'bold' }, axisLine: { show: false }, axisTick: { show: false } },
          color: [accent, blue, orange],
          series: [
            { name: '创维', type: 'bar', data: cwS, barWidth: '45%', barGap: '15%', itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:accent},{offset:1,color:accent+'66'}]) }, label: { show: true, position: 'right', color: accent, fontSize: 11, fontWeight: 'bold', formatter: '{c}%' } },
            { name: '海信', type: 'bar', data: hxS, barWidth: '45%', itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:blue},{offset:1,color:blue+'66'}]) }, label: { show: true, position: 'right', color: blue, fontSize: 10, formatter: '{c}%' } },
            { name: 'TCL', type: 'bar', data: tclS, barWidth: '45%', itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:orange},{offset:1,color:orange+'66'}]) }, label: { show: true, position: 'right', color: orange, fontSize: 10, formatter: '{c}%' } }
          ]
        });
        allCharts.push(c8);
      }

      // Size TOP5 tables
      if (d.sizeTop5) {
        var segs = ['80吋+', '75-77吋', '65吋', '55吋及以下'];
        var segIds = ['table-size80-body', 'table-size75-body', 'table-size65-body', 'table-size55-body'];
        segs.forEach(function(seg, si) {
          var items = d.sizeTop5[seg] || [];
          var sHtml = '';
          items.forEach(function(r, i) {
            var bTag = r.brand === '创维' ? 'tag-red' : r.brand === '海信' ? 'tag-blue' : 'tag-yellow';
            sHtml += '<tr><td class="rank">' + (i+1) + '</td>';
            sHtml += '<td><span class="tag ' + bTag + '">' + r.brand + '</span></td>';
            sHtml += '<td><strong>' + r.model + '</strong></td>';
            sHtml += '<td class="num">' + r.sales + '</td>';
            sHtml += '<td class="num">' + r.amount.toFixed(2) + '</td>';
            sHtml += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
          });
          document.getElementById(segIds[si]).innerHTML = sHtml;
        });
      }

      // Q7H vs U7S-PRO chart
      var c9El = document.getElementById('chart-q7h-bar');
      if (c9El && d.q7hData) {
        var c9 = echarts.init(c9El, null, { renderer: 'svg' });
        var qB = d.q7hData.map(function(r) { return r.branch; });
        var qData = d.q7hData.map(function(r) { return r.q7h_s; });
        var uData = d.q7hData.map(function(r) { return r.u7s_s; });
        c9.setOption({
          animation: false, tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(20,22,30,0.92)', borderColor: '#333', textStyle: { color: '#fff', fontSize: 12 } },
          legend: { data: ['Q7H(创维)', 'U7S-PRO(海信)'], bottom: 0, textStyle: { color: ink, fontSize: 11 }, itemWidth: 20 },
          grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: qB, axisLabel: { color: ink, fontSize: 11, fontWeight: 'bold' }, axisLine: { lineStyle: { color: rule } }, axisTick: { lineStyle: { color: rule } } },
          yAxis: { type: 'value', name: '销量 (台)', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLine: { lineStyle: { color: rule } } },
          color: [accent, blue],
          series: [
            { name: 'Q7H(创维)', type: 'bar', data: qData, barWidth: '40%', itemStyle: { borderRadius: [4,4,0,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:accent},{offset:1,color:accent+'66'}]) }, label: { show: true, position: 'top', color: accent, fontSize: 11, fontWeight: 'bold', formatter: '{c}台' } },
            { name: 'U7S-PRO(海信)', type: 'bar', data: uData, barWidth: '40%', itemStyle: { borderRadius: [4,4,0,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:blue},{offset:1,color:blue+'66'}]) }, label: { show: true, position: 'top', color: blue, fontSize: 11, formatter: '{c}台' } }
          ]
        });
        allCharts.push(c9);
      }

      // Q7H table
      if (d.q7hData) {
        var q7hHtml = '';
        d.q7hData.forEach(function(r) {
          var ratio = r.u7s_s > 0 ? (r.q7h_s / r.u7s_s).toFixed(1) : '-';
          q7hHtml += '<tr><td><strong>' + r.branch + '</strong></td>';
          q7hHtml += '<td class="num">' + r.q7h_s + '</td><td class="num">' + r.q7h_e.toFixed(2) + '</td>';
          q7hHtml += '<td class="num">' + r.u7s_s + '</td><td class="num">' + r.u7s_e.toFixed(2) + '</td>';
          q7hHtml += '<td class="num"><strong>' + ratio + 'x</strong></td></tr>';
        });
        document.getElementById('table-q7h-body').innerHTML = q7hHtml;
      }

    // ===== Dynamic insight cards =====
    renderInsightMS(d);
    renderInsight98(d);
    renderInsightSize(d);
    renderInsightQ7H(d);
  }

  function renderInsightMS(d) {
    var el = document.getElementById('insight-ms-overview-text');
    if (!el || !d.totals || !d.msData) return;
    var branchLabel = currentBranch === '南部全部' ? '南部战区' : currentBranch;
    var yoyStr = '';
    if (d.totals.yoy !== undefined) {
      yoyStr = '，同比' + (d.totals.yoy >= 0 ? '+' : '') + (d.totals.yoy*100).toFixed(1) + '%';
    }
    var text = '创维' + branchLabel + ' ' + currentKey + '销额' + d.totals.cw.toFixed(1) + '万，市占率' + (d.totals.ms*100).toFixed(1) + '%' + yoyStr + '。';
    text += '海信以' + d.totals.hx.toFixed(1) + '万领先，差距' + (d.totals.cw - d.totals.hx).toFixed(1) + '万。';
    if (d.totals.ms_25 !== undefined) {
      text += '同期25年市占率' + (d.totals.ms_25*100).toFixed(1) + '%。';
    }
    if (d.msData.length > 1) {
      var above = d.msData.filter(function(r) { return r.achieve >= 1; }).length;
      var below = d.msData.length - above;
      var best = d.msData[0];
      var worst = d.msData[d.msData.length - 1];
      text += ' ' + above + '个分公司达成率超100%，' + best.branch + '（' + (best.cw_ms*100).toFixed(1) + '%）表现最佳，' + worst.branch + '（' + (worst.cw_ms*100).toFixed(1) + '%）需重点关注。';
    }
    el.textContent = text;
  }

  function renderInsight98(d) {
    var el = document.getElementById('insight-98-text');
    if (!el || !d.data98) return;
    var totalCw = 0, totalHx = 0, totalTcl = 0;
    d.data98.forEach(function(r) {
      totalCw += r.cw_s; totalHx += r.hx_s; totalTcl += r.tcl_s;
    });
    var total = totalCw + totalHx + totalTcl;
    var cwBest = d.data98.slice().sort(function(a, b) { return b.cw_s - a.cw_s; })[0];
    var hxBest = d.data98.slice().sort(function(a, b) { return b.hx_s - a.hx_s; })[0];
    var text = '98吋+市场创维' + totalCw + '台，海信' + totalHx + '台，TCL' + totalTcl + '台。';
    text += '创维核心阵地在' + (cwBest ? cwBest.branch + '（' + cwBest.cw_s + '台）' : '--') + '；';
    text += '海信主力在' + (hxBest ? hxBest.branch + '（' + hxBest.hx_s + '台）' : '--') + '。';
    if (d.heat98 && d.heat98.length > 0) {
      var highEnd = d.heat98.filter(function(h) { return h.price_band === '>3万'; });
      var highTotal = highEnd.reduce(function(s, h) { return s + h.sales; }, 0);
      if (highTotal > 0) {
        text += ' >3万高端段共' + highTotal + '台，属于高价竞争区。';
      }
    }
    el.textContent = text;
  }

  function renderInsightSize(d) {
    var el = document.getElementById('insight-size-text');
    if (!el || !d.sizeList || !d.cwShares) return;
    var topSize = d.sizeList[0];
    var text = topSize.size + '是行业第一大尺寸段（销额' + topSize.amount + '万），创维份额' + d.cwShares[0] + '%。';
    var cwBestSeg = '', cwBestShare = 0;
    for (var i = 0; i < d.sizeSegs.length; i++) {
      if (d.cwShares[i] > cwBestShare) { cwBestShare = d.cwShares[i]; cwBestSeg = d.sizeSegs[i]; }
    }
    if (cwBestSeg) {
      text += ' 创维在' + cwBestSeg + '份额' + cwBestShare + '%表现最佳。';
    }
    if (d.sizeTop5 && d.tclShares) {
      var tclBestSeg = '', tclBestShare = 0;
      for (var i = 0; i < d.sizeSegs.length; i++) {
        if (d.tclShares[i] > tclBestShare) { tclBestShare = d.tclShares[i]; tclBestSeg = d.sizeSegs[i]; }
      }
      if (tclBestSeg) {
        text += ' TCL在' + tclBestSeg + '份额' + tclBestShare + '%占主导。';
      }
    }
    el.textContent = text;
  }

  function renderInsightQ7H(d) {
    var el = document.getElementById('insight-q7h-text');
    if (!el || !d.q7hData) return;
    var totalQ7H = d.q7hData.reduce(function(s, r) { return s + r.q7h_s; }, 0);
    var totalU7S = d.q7hData.reduce(function(s, r) { return s + r.u7s_s; }, 0);
    var ratio = totalU7S > 0 ? (totalQ7H / totalU7S).toFixed(1) : '∞';
    var q7hBest = d.q7hData.slice().sort(function(a, b) { return b.q7h_s - a.q7h_s; })[0];
    var u7sBest = d.q7hData.slice().sort(function(a, b) { return b.u7s_s - a.u7s_s; })[0];
    var text = 'Q7H ' + totalQ7H + '台 vs U7S-PRO ' + totalU7S + '台，控比' + ratio + 'x。';
    text += 'Q7H最大战场：' + (q7hBest ? q7hBest.branch + '（' + q7hBest.q7h_s + '台）' : '--') + '；';
    text += 'U7S-PRO主力在' + (u7sBest ? u7sBest.branch + '（' + u7sBest.u7s_s + '台）' : '--') + '。';
    var q7hZeros = d.q7hData.filter(function(r) { return r.u7s_s === 0; }).map(function(r) { return r.branch; });
    if (q7hZeros.length > 0) {
      text += ' ' + q7hZeros.join('、') + 'U7S-PRO为0，Q7H已占领。';
    }
    el.textContent = text;
  }

  // Initial render
  renderAll();

  // Week/Month selector
  var weekSelect = document.getElementById('week-selector');
  var monthSelect = document.getElementById('month-selector');
  var modeToggle = document.getElementById('mode-toggle');

  function switchMode(mode) {
    currentMode = mode;
    if (mode === 'weekly') {
      currentKey = weekSelect ? weekSelect.value : '26W27';
      if (monthSelect) monthSelect.style.display = 'none';
      if (weekSelect) weekSelect.style.display = '';
      if (modeToggle) modeToggle.textContent = '月度';
    } else {
      currentKey = monthSelect ? monthSelect.value : '7月';
      if (weekSelect) weekSelect.style.display = 'none';
      if (monthSelect) monthSelect.style.display = '';
      if (modeToggle) modeToggle.textContent = '周度';
    }
    renderAll();
  }

  if (weekSelect) {
    weekSelect.addEventListener('change', function() {
      currentKey = this.value;
      currentMode = 'weekly';
      renderAll();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener('change', function() {
      currentKey = this.value;
      currentMode = 'monthly';
      renderAll();
    });
  }

  if (modeToggle) {
    modeToggle.addEventListener('click', function() {
      var newMode = currentMode === 'weekly' ? 'monthly' : 'weekly';
      switchMode(newMode);
    });
  }

  // Branch selector
  var branchSelect = document.getElementById('branch-selector');
  if (branchSelect) {
    branchSelect.addEventListener('change', function() {
      currentBranch = this.value;
      renderAll();
    });
  }

  window.addEventListener('resize', function() {
    allCharts.forEach(function(c) { c.resize(); });
  });
})();
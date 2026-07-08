(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#e63946';
  var blue = style.getPropertyValue('--blue').trim() || '#2563eb';
  var orange = style.getPropertyValue('--orange').trim() || '#ea580c';
  var green = style.getPropertyValue('--green').trim() || '#16a34a';
  var purple = style.getPropertyValue('--purple').trim() || '#7c3aed';
  var ink = style.getPropertyValue('--ink').trim() || '#1a1a2e';
  var muted = style.getPropertyValue('--muted').trim() || '#6b7280';
  var rule = style.getPropertyValue('--rule').trim() || '#e2e8f0';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#f5f7fa';

  var allCharts = [];
  var currentBranch = '南部全部';

  var BRANCHES = ['云南', '海南', '深圳', '闽北', '佛山', '桂北', '桂南', '广州', '闽南', '滇南', '汕头'];
  var TARGETS = {'云南': 0.181, '海南': 0.279, '深圳': 0.208, '闽北': 0.262, '佛山': 0.242,
                 '桂北': 0.27, '桂南': 0.272, '广州': 0.248, '闽南': 0.261, '滇南': 0.259, '汕头': 0.21};

  // ===== HELPERS =====
  function getWeekData(week) {
    return DASHBOARD_ALL.data[week];
  }

  function getBranchWeekData(week, branch) {
    var bw = DASHBOARD_ALL.branchData[week];
    return bw ? bw[branch] : null;
  }

  function collectAllWeekData(field) {
    // Collect array of values across all 27 weeks for 南部全部
    var weeks = DASHBOARD_ALL.allWeeks;
    var result = [];
    weeks.forEach(function(w) {
      var d = getWeekData(w);
      if (d && d.totals) {
        result.push(field === 'cw' ? d.totals.cw : field === 'ms' ? +(d.totals.ms * 100).toFixed(1) : field === 'achieve' ? +(d.totals.achieve * 100).toFixed(1) : field === 'hx' ? d.totals.hx : null);
      } else {
        result.push(null);
      }
    });
    return result;
  }

  function collectBranchWeekData(branch, field) {
    var weeks = DASHBOARD_ALL.allWeeks;
    var result = [];
    weeks.forEach(function(w) {
      var d = getBranchWeekData(w, branch);
      if (d && d.totals) {
        result.push(field === 'cw' ? d.totals.cw : field === 'ms' ? +(d.totals.ms * 100).toFixed(1) : field === 'achieve' ? +(d.totals.achieve * 100).toFixed(1) : null);
      } else {
        result.push(null);
      }
    });
    return result;
  }

  function sumWeeks(getter) {
    var total = 0;
    DASHBOARD_ALL.allWeeks.forEach(function(w) {
      var v = getter(w);
      if (v !== null && v !== undefined) total += v;
    });
    return total;
  }

  function avgWeeks(getter) {
    var total = 0, count = 0;
    DASHBOARD_ALL.allWeeks.forEach(function(w) {
      var v = getter(w);
      if (v !== null && v !== undefined) { total += v; count++; }
    });
    return count > 0 ? total / count : 0;
  }

  // ===== KPI =====
  function renderKPIs() {
    var allWeeks = DASHBOARD_ALL.allWeeks;
    var latestWeek = allWeeks[allWeeks.length - 1];
    var latestData = getWeekData(latestWeek);

    // 南部全部累计
    var allCw = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.cw : 0; });
    var allHy = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hy : 0; });
    var allMs = allHy > 0 ? allCw / allHy : 0;
    var allAchieve = allMs / 0.245;
    var allHx = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hx : 0; });
    var allGap = allCw - allHx;

    document.getElementById('kpi-all-cw').textContent = allCw.toFixed(1) + '万';
    document.getElementById('kpi-all-ms').textContent = (allMs * 100).toFixed(1) + '%';
    document.getElementById('kpi-all-achieve').textContent = (allAchieve * 100).toFixed(1) + '%';
    var achieveSub = document.getElementById('kpi-all-achieve-sub');
    if (achieveSub) achieveSub.textContent = '目标24.5% · ' + (allAchieve >= 1 ? '超额完成' : '未达成');
    document.getElementById('kpi-all-gap').textContent = (allGap >= 0 ? '+' : '') + allGap.toFixed(1) + '万';
    document.getElementById('kpi-all-gap').style.color = allGap >= 0 ? green : accent;

    if (latestData && latestData.totals) {
      document.getElementById('kpi-latest-ms').textContent = (latestData.totals.ms * 100).toFixed(1) + '%';
      var yoyVal = latestData.totals.yoy;
      var yoyEl = document.getElementById('kpi-latest-yoy');
      if (yoyEl && yoyVal !== undefined) {
        yoyEl.textContent = (yoyVal >= 0 ? '+' : '') + (yoyVal * 100).toFixed(1) + '%';
        yoyEl.style.color = yoyVal >= 0 ? green : accent;
      }
    }

    // 选中分公司
    var compLabel = document.getElementById('kpi-comp-label');
    if (compLabel) compLabel.textContent = (currentBranch === '南部全部' ? '南部全部' : currentBranch) + '累计销额';

    if (currentBranch === '南部全部') {
      document.getElementById('kpi-comp-cw').textContent = allCw.toFixed(1) + '万';
      document.getElementById('kpi-comp-ms').textContent = (allMs * 100).toFixed(1) + '%';
      document.getElementById('kpi-comp-contrib').textContent = '100%';
    } else {
      var brCw = sumWeeks(function(w) { var d = getBranchWeekData(w, currentBranch); return d && d.totals ? d.totals.cw : 0; });
      var brHy = sumWeeks(function(w) { var d = getBranchWeekData(w, currentBranch); return d && d.totals ? d.totals.hy : 0; });
      var brMs = brHy > 0 ? brCw / brHy : 0;
      var contrib = allCw > 0 ? (brCw / allCw * 100) : 0;
      document.getElementById('kpi-comp-cw').textContent = brCw.toFixed(1) + '万';
      document.getElementById('kpi-comp-ms').textContent = (brMs * 100).toFixed(1) + '%';
      document.getElementById('kpi-comp-contrib').textContent = contrib.toFixed(1) + '%';
    }

    // Update trend title
    var trendTitle = document.getElementById('trend-title-branch');
    if (trendTitle) trendTitle.textContent = currentBranch === '南部全部' ? '南部全部' : currentBranch;
  }

  // ===== SECTION 1: 全年趋势 =====
  function renderTrendAmount() {
    var el = document.getElementById('chart-trend-amount');
    if (!el) return;
    var weeks = DASHBOARD_ALL.allWeeks;
    var allValues = collectAllWeekData('cw');
    var branchValues = currentBranch === '南部全部' ? null : collectBranchWeekData(currentBranch, 'cw');

    var series = [{
      name: '南部全部', type: 'line', data: allValues, symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 3, color: accent }, itemStyle: { color: accent },
      areaStyle: { color: 'rgba(230,57,70,0.08)' }
    }];
    if (branchValues) {
      series.push({
        name: currentBranch, type: 'line', data: branchValues, symbol: 'diamond', symbolSize: 7,
        lineStyle: { width: 2.5, color: blue, type: 'dashed' }, itemStyle: { color: blue }
      });
    }

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: series.map(function(s) { return s.name; }), bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: muted, fontSize: 9, rotate: 45 } },
      yAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
      series: series
    });
    allCharts.push(chart);
  }

  function renderTrendMS() {
    var el = document.getElementById('chart-trend-ms');
    if (!el) return;
    var weeks = DASHBOARD_ALL.allWeeks;
    var allValues = collectAllWeekData('ms');
    var branchValues = currentBranch === '南部全部' ? null : collectBranchWeekData(currentBranch, 'ms');

    var series = [{
      name: '南部全部市占率', type: 'line', data: allValues, symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 3, color: accent }, itemStyle: { color: accent },
      areaStyle: { color: 'rgba(230,57,70,0.06)' }, markLine: { silent: true, data: [{ yAxis: 24.5, name: '目标', label: { formatter: '目标24.5%' } }], lineStyle: { color: '#94a3b8', type: 'dashed' } }
    }];
    if (branchValues) {
      series.push({
        name: currentBranch + '市占率', type: 'line', data: branchValues, symbol: 'diamond', symbolSize: 7,
        lineStyle: { width: 2.5, color: blue, type: 'dashed' }, itemStyle: { color: blue }
      });
    }

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) { return p.map(function(i) { return i.seriesName + ': ' + i.value + '%'; }).join('<br>'); } },
      legend: { data: series.map(function(s) { return s.name; }), bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: muted, fontSize: 9, rotate: 45 } },
      yAxis: { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
      series: series
    });
    allCharts.push(chart);
  }

  function renderTrendAchieve() {
    var el = document.getElementById('chart-trend-achieve');
    if (!el) return;
    var weeks = DASHBOARD_ALL.allWeeks;
    var allValues = collectAllWeekData('achieve');
    var branchValues = currentBranch === '南部全部' ? null : collectBranchWeekData(currentBranch, 'achieve');

    var series = [{
      name: '南部全部达成率', type: 'line', data: allValues, symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 3, color: green }, itemStyle: { color: green },
      areaStyle: { color: 'rgba(22,163,74,0.06)' }, markLine: { silent: true, data: [{ yAxis: 100, name: '100%', label: { formatter: '100%' } }], lineStyle: { color: '#94a3b8', type: 'dashed' } }
    }];
    if (branchValues) {
      series.push({
        name: currentBranch + '达成率', type: 'line', data: branchValues, symbol: 'diamond', symbolSize: 7,
        lineStyle: { width: 2.5, color: orange, type: 'dashed' }, itemStyle: { color: orange }
      });
    }

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) { return p.map(function(i) { return i.seriesName + ': ' + i.value + '%'; }).join('<br>'); } },
      legend: { data: series.map(function(s) { return s.name; }), bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: muted, fontSize: 9, rotate: 45 } },
      yAxis: { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
      series: series
    });
    allCharts.push(chart);
  }

  function renderTrendInsight() {
    var allWeeks = DASHBOARD_ALL.allWeeks;
    var latest = allWeeks[allWeeks.length - 1];
    var latestD = getWeekData(latest);
    var allCw = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.cw : 0; });
    var allHy = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hy : 0; });

    var text = '2026年南部战区26W01-26W27累计创维销额' + allCw.toFixed(1) + '万，行业' + allHy.toFixed(1) + '万，平均市占率' + (allHy > 0 ? (allCw/allHy*100).toFixed(1) : '--') + '%。';
    if (latestD && latestD.totals) {
      text += '最新周' + latest + '市占率' + (latestD.totals.ms * 100).toFixed(1) + '%';
      if (latestD.totals.yoy !== undefined) {
        text += '，同比' + (latestD.totals.yoy >= 0 ? '+' : '') + (latestD.totals.yoy * 100).toFixed(1) + '%';
      }
      text += '。';
    }
    if (currentBranch !== '南部全部') {
      var brCw = sumWeeks(function(w) { var d = getBranchWeekData(w, currentBranch); return d && d.totals ? d.totals.cw : 0; });
      text += currentBranch + '分公司累计贡献南部战区' + (allCw > 0 ? (brCw/allCw*100).toFixed(1) : '--') + '%。';
    }
    var insightEl = document.getElementById('insight-trend');
    if (insightEl) insightEl.textContent = text;
  }

  // ===== SECTION 2: 分公司对比 =====
  function renderBranchCumulative() {
    var el = document.getElementById('chart-branch-cumulative');
    if (!el) return;

    var branchData = [];
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      var hy = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.hy : 0; });
      var ms = hy > 0 ? +(cw / hy * 100).toFixed(1) : 0;
      branchData.push({ branch: b, cw: +cw.toFixed(1), ms: ms });
    });
    branchData.sort(function(a, b) { return b.cw - a.cw; });

    var labels = branchData.map(function(d) { return d.branch; });
    var cwVals = branchData.map(function(d) { return d.cw; });
    var msVals = branchData.map(function(d) { return d.ms; });

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['累计销额(万)', '平均市占率%'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '10%', right: '4%', bottom: '12%', top: '8%' },
      xAxis: { type: 'category', data: labels, axisLabel: { color: ink, fontSize: 10 } },
      yAxis: [{ type: 'value', name: '万', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
        { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 9 }, splitLine: { show: false } }],
      series: [
        { name: '累计销额(万)', type: 'bar', data: cwVals, barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0], color: accent }, label: { show: true, position: 'top', color: ink, fontSize: 8 } },
        { name: '平均市占率%', type: 'line', yAxisIndex: 1, data: msVals, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: blue }, itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 }, label: { show: true, color: blue, fontSize: 8, formatter: '{c}%' } }
      ]
    });
    allCharts.push(chart);
  }

  function renderBranchCumulativeTable() {
    var tbody = document.getElementById('table-branch-cumulative-body');
    if (!tbody) return;

    var branchData = [];
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      var hy = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.hy : 0; });
      var hx = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.hx : 0; });
      var msAvg = avgWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.ms : null; });
      var achieveAvg = avgWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.achieve : null; });
      var vsHx = cw - hx;
      branchData.push({ branch: b, cw: +cw.toFixed(1), ms: msAvg ? +(msAvg * 100).toFixed(1) : 0, achieve: achieveAvg ? +(achieveAvg * 100).toFixed(1) : 0, vsHx: +vsHx.toFixed(1) });
    });
    branchData.sort(function(a, b) { return b.cw - a.cw; });

    var totalCw = branchData.reduce(function(s, d) { return s + d.cw; }, 0);

    var html = '';
    branchData.forEach(function(d, i) {
      var rankCls = i < 3 ? 'rd-' + (i + 1) : 'rd-o';
      var vsCls = d.vsHx >= 0 ? 'tag-green' : 'tag-red';
      var contrib = totalCw > 0 ? (d.cw / totalCw * 100).toFixed(1) : 0;
      html += '<tr><td class="rank"><span class="rank-dot ' + rankCls + '">' + (i+1) + '</span></td>';
      html += '<td>' + d.branch + '</td>';
      html += '<td class="num">' + d.cw + '万</td>';
      html += '<td class="num">' + d.ms + '%</td>';
      html += '<td class="num">' + d.achieve + '%</td>';
      html += '<td class="num"><span class="tag ' + vsCls + '">' + (d.vsHx >= 0 ? '+' : '') + d.vsHx + '万</span></td>';
      html += '<td class="num">' + contrib + '%</td></tr>';
    });
    tbody.innerHTML = html;
  }

  function renderBranchMSTrend() {
    var el = document.getElementById('chart-branch-ms-trend');
    if (!el) return;
    var weeks = DASHBOARD_ALL.allWeeks;
    var colors = [accent, blue, green, orange, purple, '#0d9488', '#d946ef', '#f59e0b', '#0891b2', '#4f46e5', '#be123c'];

    var series = BRANCHES.map(function(b, i) {
      var vals = collectBranchWeekData(b, 'ms');
      return { name: b, type: 'line', data: vals, symbol: 'none', lineStyle: { width: 1.5, color: colors[i % colors.length] } };
    });
    // Add 南部全部
    var allVals = collectAllWeekData('ms');
    series.unshift({ name: '南部全部', type: 'line', data: allVals, symbol: 'circle', symbolSize: 4, lineStyle: { width: 3, color: '#1a1a2e' } });

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { type: 'scroll', bottom: 0, textStyle: { color: ink, fontSize: 9 }, itemWidth: 12, itemHeight: 8 },
      grid: { left: '3%', right: '4%', bottom: '16%', top: '6%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: muted, fontSize: 8, rotate: 45 } },
      yAxis: { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
      series: series
    });
    allCharts.push(chart);
  }

  function renderBranchAchieveTrend() {
    var el = document.getElementById('chart-branch-achieve-trend');
    if (!el) return;
    var weeks = DASHBOARD_ALL.allWeeks;
    var colors = [accent, blue, green, orange, purple, '#0d9488', '#d946ef', '#f59e0b', '#0891b2', '#4f46e5', '#be123c'];

    var series = BRANCHES.map(function(b, i) {
      var vals = collectBranchWeekData(b, 'achieve');
      return { name: b, type: 'line', data: vals, symbol: 'none', lineStyle: { width: 1.5, color: colors[i % colors.length] } };
    });
    var allVals = collectAllWeekData('achieve');
    series.unshift({ name: '南部全部', type: 'line', data: allVals, symbol: 'circle', symbolSize: 4, lineStyle: { width: 3, color: '#1a1a2e' } });

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { type: 'scroll', bottom: 0, textStyle: { color: ink, fontSize: 9 }, itemWidth: 12, itemHeight: 8 },
      grid: { left: '3%', right: '4%', bottom: '16%', top: '6%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: muted, fontSize: 8, rotate: 45 } },
      yAxis: { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
      series: series
    });
    allCharts.push(chart);
  }

  function renderBranchInsight() {
    var allCw = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.cw : 0; });
    var bestBranch = '', bestCw = 0, bestMs = 0;
    var worstBranch = '', worstCw = Infinity;
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      var hy = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.hy : 0; });
      var ms = hy > 0 ? cw / hy : 0;
      if (cw > bestCw) { bestCw = cw; bestBranch = b; bestMs = ms; }
      if (cw < worstCw && cw > 0) { worstCw = cw; worstBranch = b; }
    });

    var text = '11个分公司全年累计销额排名：' + bestBranch + '以' + bestCw.toFixed(1) + '万领先，市占率' + (bestMs*100).toFixed(1) + '%。';
    text += '各分公司市占率走势见上图表，达成率目标线为100%。';
    var insightEl = document.getElementById('insight-branch');
    if (insightEl) insightEl.textContent = text;
  }

  // ===== SECTION 3: 品牌竞争 =====
  function renderBrandCumulative() {
    // Aggregate brand data across all weeks
    var brandMap = {};
    DASHBOARD_ALL.allWeeks.forEach(function(w) {
      var d = getWeekData(w);
      if (d && d.brandOverview) {
        d.brandOverview.forEach(function(br) {
          if (!brandMap[br.brand]) {
            brandMap[br.brand] = { sales: 0, amount: 0 };
          }
          brandMap[br.brand].sales += br.sales || 0;
          brandMap[br.brand].amount += br.amount || 0;
        });
      }
    });

    var brands = Object.keys(brandMap).map(function(k) {
      return { brand: k, sales: brandMap[k].sales, amount: +brandMap[k].amount.toFixed(2) };
    }).sort(function(a, b) { return b.amount - a.amount; });

    var totalAmount = brands.reduce(function(s, b) { return s + b.amount; }, 0);
    var totalSales = brands.reduce(function(s, b) { return s + b.sales; }, 0);

    // Table
    var tbody = document.getElementById('table-brand-cumulative-body');
    if (tbody) {
      var html = '';
      brands.forEach(function(b, i) {
        var rankCls = i < 3 ? 'rd-' + (i + 1) : 'rd-o';
        var msAmt = totalAmount > 0 ? (b.amount / totalAmount * 100).toFixed(1) : 0;
        var msQty = totalSales > 0 ? (b.sales / totalSales * 100).toFixed(1) : 0;
        var avgPrice = b.sales > 0 ? Math.round(b.amount * 10000 / b.sales) : 0;
        html += '<tr><td class="rank"><span class="rank-dot ' + rankCls + '">' + (i+1) + '</span></td>';
        html += '<td><b>' + b.brand + '</b></td>';
        html += '<td class="num">' + b.sales.toLocaleString() + '</td>';
        html += '<td class="num">' + b.amount.toFixed(1) + '万</td>';
        html += '<td class="num">' + msAmt + '%</td>';
        html += '<td class="num">' + msQty + '%</td>';
        html += '<td class="num">¥' + avgPrice.toLocaleString() + '</td></tr>';
      });
      tbody.innerHTML = html;
    }

    // Pie chart
    var pieEl = document.getElementById('chart-brand-cumulative-pie');
    if (pieEl && brands.length > 0) {
      var top5 = brands.slice(0, 5);
      var otherAmount = brands.slice(5).reduce(function(s, b) { return s + b.amount; }, 0);
      var pieData = top5.map(function(b) { return { name: b.brand, value: b.amount }; });
      if (otherAmount > 0) pieData.push({ name: '其他', value: +otherAmount.toFixed(2) });

      var chart = echarts.init(pieEl, null, { renderer: 'svg' });
      chart.setOption({
        animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
        legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: ink, fontSize: 10 } },
        series: [{
          type: 'pie', radius: ['45%', '72%'], center: ['38%', '50%'], data: pieData,
          label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' },
          itemStyle: { borderColor: bg2, borderWidth: 2 },
          emphasis: { label: { fontSize: 14, fontWeight: 'bold' } }
        }]
      });
      allCharts.push(chart);
    }
  }

  function renderBrandWeeklyTrend() {
    var el = document.getElementById('chart-brand-weekly-trend');
    if (!el) return;
    var weeks = DASHBOARD_ALL.allWeeks;
    var targetBrands = ['创维', '海信', 'TCL', '三星', '索尼'];
    var colors = [accent, orange, blue, '#94a3b8', '#0d9488'];

    var series = targetBrands.map(function(brand, i) {
      var vals = weeks.map(function(w) {
        var d = getWeekData(w);
        if (d && d.brandOverview) {
          var found = d.brandOverview.filter(function(br) { return br.brand === brand; })[0];
          return found ? found.amount : null;
        }
        return null;
      });
      return { name: brand, type: 'line', data: vals, symbol: 'none', lineStyle: { width: 2, color: colors[i] }, itemStyle: { color: colors[i] } };
    });

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: targetBrands, bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '6%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: muted, fontSize: 8, rotate: 45 } },
      yAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
      series: series
    });
    allCharts.push(chart);
  }

  function renderBrandMSTrend() {
    var el = document.getElementById('chart-brand-ms-trend');
    if (!el) return;
    var weeks = DASHBOARD_ALL.allWeeks;
    var targetBrands = ['创维', '海信', 'TCL', '三星', '索尼'];
    var colors = [accent, orange, blue, '#94a3b8', '#0d9488'];

    var series = targetBrands.map(function(brand, i) {
      var vals = weeks.map(function(w) {
        var d = getWeekData(w);
        if (d && d.brandOverview) {
          var total = d.brandOverview.reduce(function(s, br) { return s + br.amount; }, 0);
          var found = d.brandOverview.filter(function(br) { return br.brand === brand; })[0];
          return (found && total > 0) ? +(found.amount / total * 100).toFixed(1) : null;
        }
        return null;
      });
      return { name: brand, type: 'line', data: vals, symbol: 'none', lineStyle: { width: 2, color: colors[i] }, itemStyle: { color: colors[i] } };
    });

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) { return p.map(function(i) { return i.seriesName + ': ' + i.value + '%'; }).join('<br>'); } },
      legend: { data: targetBrands, bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '6%', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { color: muted, fontSize: 8, rotate: 45 } },
      yAxis: { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
      series: series
    });
    allCharts.push(chart);
  }

  function renderBrandInsight() {
    var brandMap = {};
    DASHBOARD_ALL.allWeeks.forEach(function(w) {
      var d = getWeekData(w);
      if (d && d.brandOverview) {
        d.brandOverview.forEach(function(br) {
          if (!brandMap[br.brand]) brandMap[br.brand] = { amount: 0 };
          brandMap[br.brand].amount += br.amount || 0;
        });
      }
    });
    var brands = Object.keys(brandMap).map(function(k) { return { brand: k, amount: brandMap[k].amount }; }).sort(function(a, b) { return b.amount - a.amount; });
    var total = brands.reduce(function(s, b) { return s + b.amount; }, 0);

    var cwRank = brands.findIndex(function(b) { return b.brand === '创维'; }) + 1;
    var cw = brands.filter(function(b) { return b.brand === '创维'; })[0];
    var hx = brands.filter(function(b) { return b.brand === '海信'; })[0];
    var cwMs = cw ? (cw.amount / total * 100).toFixed(1) : '--';
    var hxMs = hx ? (hx.amount / total * 100).toFixed(1) : '--';

    var text = '2026年南部战区全年累计品牌排名：创维第' + cwRank + '名，累计销额';
    text += cw ? cw.amount.toFixed(1) + '万（市占率' + cwMs + '%），' : '--，';
    text += '海信' + (hx ? hx.amount.toFixed(1) + '万（' + hxMs + '%）' : '--') + '。';
    var insightEl = document.getElementById('insight-brand');
    if (insightEl) insightEl.textContent = text;
  }

  // ===== SECTION 4: 产品分析 =====
  function renderProductAnalysis() {
    var latestWeek = DASHBOARD_ALL.allWeeks[DASHBOARD_ALL.allWeeks.length - 1];
    var d = getWeekData(latestWeek);
    if (!d) return;

    // TOP20 all brands
    var tbody = document.getElementById('table-top20-body');
    if (tbody && d.top20) {
      var html = '';
      d.top20.forEach(function(r, i) {
        var rankCls = i < 3 ? 'rd-' + (i + 1) : 'rd-o';
        html += '<tr><td class="rank"><span class="rank-dot ' + rankCls + '">' + (i+1) + '</span></td>';
        html += '<td>' + r.brand + '</td><td>' + r.model + '</td>';
        html += '<td class="num">' + r.sales + '</td><td class="num">' + r.amount + '万</td>';
        html += '<td class="num">¥' + (r.avg_price || 0).toLocaleString() + '</td></tr>';
      });
      tbody.innerHTML = html;
    }

    // 创维 TOP10
    var cwTbody = document.getElementById('table-cw-top10-body');
    if (cwTbody && d.top20_cw) {
      var html = '';
      d.top20_cw.forEach(function(r, i) {
        var rankCls = i < 3 ? 'rd-' + (i + 1) : 'rd-o';
        html += '<tr><td class="rank"><span class="rank-dot ' + rankCls + '">' + (i+1) + '</span></td>';
        html += '<td>' + r.model + '</td><td class="num">' + r.sales + '</td>';
        html += '<td class="num">' + r.amount + '万</td>';
        html += '<td class="num">¥' + (r.avg_price || 0).toLocaleString() + '</td></tr>';
      });
      cwTbody.innerHTML = html;
    }

    // Product insight
    var insightEl = document.getElementById('insight-product');
    if (insightEl && d.top20_cw && d.top20_cw.length > 0) {
      var top = d.top20_cw[0];
      var text = latestWeek + '南部战区创维销售TOP1型号为' + top.model + '，销量' + top.sales + '台，销额' + top.amount + '万。';
      if (d.top20) {
        var cwTop20 = d.top20.filter(function(r) { return r.brand === '创维'; }).length;
        text += '全行业TOP20中创维占' + cwTop20 + '款。';
      }
      insightEl.textContent = text;
    }
  }

  // ===== MAIN =====
  function renderAll() {
    allCharts.forEach(function(c) { c.dispose(); });
    allCharts = [];

    renderKPIs();
    renderTrendAmount();
    renderTrendMS();
    renderTrendAchieve();
    renderTrendInsight();
    renderBranchCumulative();
    renderBranchCumulativeTable();
    renderBranchMSTrend();
    renderBranchAchieveTrend();
    renderBranchInsight();
    renderBrandCumulative();
    renderBrandWeeklyTrend();
    renderBrandMSTrend();
    renderBrandInsight();
    renderProductAnalysis();
  }

  // Branch selector
  var branchSelect = document.getElementById('compare-branch');
  if (branchSelect) {
    branchSelect.addEventListener('change', function() {
      currentBranch = this.value;
      renderAll();
    });
  }

  // Initial render
  renderAll();

  window.addEventListener('resize', function() {
    allCharts.forEach(function(c) { c.resize(); });
  });
})();
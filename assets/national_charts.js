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

  function getWeekData(week) { return DASHBOARD_ALL.data[week]; }
  function getBranchWeekData(week, branch) {
    var bw = DASHBOARD_ALL.branchData[week];
    return bw ? bw[branch] : null;
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

  function countWeeks(getter) {
    var count = 0;
    DASHBOARD_ALL.allWeeks.forEach(function(w) {
      var v = getter(w);
      if (v !== null && v !== undefined && v !== 0) count++;
    });
    return count;
  }

  // ===== KPI =====
  function renderKPIs() {
    var allWeeks = DASHBOARD_ALL.allWeeks;
    var latestWeek = allWeeks[allWeeks.length - 1];
    var latestData = getWeekData(latestWeek);

    var allCw = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.cw : 0; });
    var allHy = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hy : 0; });
    var allMs = allHy > 0 ? allCw / allHy : 0;
    var allAchieve = allMs / 0.245;
    var allHx = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hx : 0; });
    var allTcl = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.tcl : 0; });
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
      var yoyEl = document.getElementById('kpi-latest-yoy');
      if (yoyEl && latestData.totals.yoy !== undefined) {
        yoyEl.textContent = (latestData.totals.yoy >= 0 ? '+' : '') + (latestData.totals.yoy * 100).toFixed(1) + '%';
        yoyEl.style.color = latestData.totals.yoy >= 0 ? green : accent;
      }
    }

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
  }

  // ===== SECTION 1: 年度总览 =====
  function renderCompareCards() {
    var allCw = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.cw : 0; });
    var allHy = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hy : 0; });
    var allHx = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hx : 0; });
    var allTcl = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.tcl : 0; });
    var allMs = allHy > 0 ? allCw / allHy : 0;
    var allAchieve = allMs / 0.245;

    document.getElementById('cmp-all-cw').textContent = allCw.toFixed(1) + '万';
    document.getElementById('cmp-all-hy').textContent = allHy.toFixed(1) + '万';
    document.getElementById('cmp-all-ms').textContent = (allMs * 100).toFixed(1) + '%';
    document.getElementById('cmp-all-hx').textContent = allHx.toFixed(1) + '万';
    document.getElementById('cmp-all-tcl').textContent = allTcl.toFixed(1) + '万';
    document.getElementById('cmp-all-achieve').textContent = (allAchieve * 100).toFixed(1) + '%';

    var brTitle = document.getElementById('cmp-branch-title');
    if (brTitle) brTitle.textContent = (currentBranch === '南部全部' ? '南部全部' : currentBranch) + ' · 年度累计';

    if (currentBranch === '南部全部') {
      document.getElementById('cmp-br-cw').textContent = allCw.toFixed(1) + '万';
      document.getElementById('cmp-br-hy').textContent = allHy.toFixed(1) + '万';
      document.getElementById('cmp-br-ms').textContent = (allMs * 100).toFixed(1) + '%';
      document.getElementById('cmp-br-hx').textContent = allHx.toFixed(1) + '万';
      document.getElementById('cmp-br-tcl').textContent = allTcl.toFixed(1) + '万';
      document.getElementById('cmp-br-achieve').textContent = (allAchieve * 100).toFixed(1) + '%';
    } else {
      var brCw = sumWeeks(function(w) { var d = getBranchWeekData(w, currentBranch); return d && d.totals ? d.totals.cw : 0; });
      var brHy = sumWeeks(function(w) { var d = getBranchWeekData(w, currentBranch); return d && d.totals ? d.totals.hy : 0; });
      var brHx = sumWeeks(function(w) { var d = getBranchWeekData(w, currentBranch); return d && d.totals ? d.totals.hx : 0; });
      var brTcl = sumWeeks(function(w) { var d = getBranchWeekData(w, currentBranch); return d && d.totals ? d.totals.tcl : 0; });
      var brMs = brHy > 0 ? brCw / brHy : 0;
      var brTarget = TARGETS[currentBranch] || 0.25;
      var brAchieve = brMs / brTarget;
      document.getElementById('cmp-br-cw').textContent = brCw.toFixed(1) + '万';
      document.getElementById('cmp-br-hy').textContent = brHy.toFixed(1) + '万';
      document.getElementById('cmp-br-ms').textContent = (brMs * 100).toFixed(1) + '%';
      document.getElementById('cmp-br-hx').textContent = brHx.toFixed(1) + '万';
      document.getElementById('cmp-br-tcl').textContent = brTcl.toFixed(1) + '万';
      document.getElementById('cmp-br-achieve').textContent = (brAchieve * 100).toFixed(1) + '%';
    }
  }

  function renderCumulativeAmount() {
    var el = document.getElementById('chart-cumulative-amount');
    if (!el) return;
    var branchData = [];
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      var hx = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.hx : 0; });
      var tcl = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.tcl : 0; });
      branchData.push({ branch: b, cw: +cw.toFixed(1), hx: +hx.toFixed(1), tcl: +tcl.toFixed(1) });
    });
    branchData.sort(function(a, b) { return b.cw - a.cw; });

    var labels = branchData.map(function(d) { return d.branch; });
    var cwVals = branchData.map(function(d) { return d.cw; });
    var hxVals = branchData.map(function(d) { return d.hx; });
    var tclVals = branchData.map(function(d) { return d.tcl; });

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { color: ink, fontSize: 10 } },
      yAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
      color: [accent, orange, blue],
      series: [
        { name: '创维', type: 'bar', data: cwVals, barGap: '10%', barWidth: '28%', itemStyle: { borderRadius: [3,3,0,0] }, label: { show: false } },
        { name: '海信', type: 'bar', data: hxVals, barWidth: '28%', itemStyle: { borderRadius: [3,3,0,0] }, label: { show: false } },
        { name: 'TCL', type: 'bar', data: tclVals, barWidth: '28%', itemStyle: { borderRadius: [3,3,0,0] }, label: { show: false } }
      ]
    });
    allCharts.push(chart);
  }

  function renderCumulativeMSAchieve() {
    var el = document.getElementById('chart-cumulative-ms-achieve');
    if (!el) return;
    var branchData = [];
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      var hy = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.hy : 0; });
      var ms = hy > 0 ? +(cw / hy * 100).toFixed(1) : 0;
      var target = TARGETS[b] || 0.25;
      var achieve = +(ms / (target * 100) * 100).toFixed(1);
      branchData.push({ branch: b, ms: ms, achieve: achieve });
    });
    branchData.sort(function(a, b) { return b.ms - a.ms; });

    var labels = branchData.map(function(d) { return d.branch; });
    var msVals = branchData.map(function(d) { return d.ms; });
    var achVals = branchData.map(function(d) { return d.achieve; });

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['平均市占率%', '达成率%'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { color: ink, fontSize: 10 } },
      yAxis: [{ type: 'value', name: '%', axisLabel: { color: muted, fontSize: 9 }, splitLine: { lineStyle: { color: rule } } },
        { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 9 }, splitLine: { show: false } }],
      color: [accent, green],
      series: [
        { name: '平均市占率%', type: 'bar', data: msVals, barWidth: '38%', itemStyle: { borderRadius: [3,3,0,0] }, label: { show: true, position: 'top', color: ink, fontSize: 8, formatter: '{c}%' } },
        { name: '达成率%', type: 'line', yAxisIndex: 1, data: achVals, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: green }, itemStyle: { color: green, borderColor: '#fff', borderWidth: 2 }, markLine: { silent: true, data: [{ yAxis: 100, label: { formatter: '100%' } }], lineStyle: { color: '#94a3b8', type: 'dashed' } }, label: { show: true, color: green, fontSize: 8, formatter: '{c}%' } }
      ]
    });
    allCharts.push(chart);
  }

  function renderOverviewInsight() {
    var allCw = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.cw : 0; });
    var allHy = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hy : 0; });
    var allHx = sumWeeks(function(w) { var d = getWeekData(w); return d && d.totals ? d.totals.hx : 0; });
    var allMs = allHy > 0 ? (allCw / allHy * 100).toFixed(1) : '--';

    var bestBranch = '', bestCw = 0;
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      if (cw > bestCw) { bestCw = cw; bestBranch = b; }
    });

    var text = '2026年南部战区26W01-26W27年度累计：创维销额' + allCw.toFixed(1) + '万，行业' + allHy.toFixed(1) + '万，市占率' + allMs + '%。';
    text += '海信' + allHx.toFixed(1) + '万，差距' + (allCw - allHx).toFixed(1) + '万。';
    text += '贡献最大的分公司是' + bestBranch + '（' + bestCw.toFixed(1) + '万）。';
    if (currentBranch !== '南部全部') {
      var brCw = sumWeeks(function(w) { var d = getBranchWeekData(w, currentBranch); return d && d.totals ? d.totals.cw : 0; });
      text += ' ' + currentBranch + '分公司贡献南部' + (allCw > 0 ? (brCw/allCw*100).toFixed(1) : '--') + '%。';
    }
    var el = document.getElementById('insight-overview-text');
    if (el) el.textContent = text;
  }

  // ===== SECTION 2: 分公司排名 =====
  function renderBranchCumulativeTable() {
    var tbody = document.getElementById('table-branch-cumulative-body');
    if (!tbody) return;

    var branchData = [];
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      var hx = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.hx : 0; });
      var msAvg = avgWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.ms : null; });
      var achieveAvg = avgWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.achieve : null; });
      var vsHx = cw - hx;

      // 周胜率: weeks where cw > hx
      var winCount = 0, totalWeeks = 0;
      DASHBOARD_ALL.allWeeks.forEach(function(w) {
        var d = getBranchWeekData(w, b);
        if (d && d.totals) {
          totalWeeks++;
          if (d.totals.cw > d.totals.hx) winCount++;
        }
      });
      var winRate = totalWeeks > 0 ? (winCount / totalWeeks * 100) : 0;

      branchData.push({ branch: b, cw: +cw.toFixed(1), ms: msAvg ? +(msAvg * 100).toFixed(1) : 0, achieve: achieveAvg ? +(achieveAvg * 100).toFixed(1) : 0, vsHx: +vsHx.toFixed(1), winRate: +winRate.toFixed(1) });
    });
    branchData.sort(function(a, b) { return b.cw - a.cw; });

    var totalCw = branchData.reduce(function(s, d) { return s + d.cw; }, 0);

    var html = '';
    branchData.forEach(function(d, i) {
      var rankCls = i < 3 ? 'rd-' + (i + 1) : 'rd-o';
      var vsCls = d.vsHx >= 0 ? 'tag-green' : 'tag-red';
      var contrib = totalCw > 0 ? (d.cw / totalCw * 100).toFixed(1) : 0;
      html += '<tr><td class="rank"><span class="rank-dot ' + rankCls + '">' + (i+1) + '</span></td>';
      html += '<td><b>' + d.branch + '</b></td>';
      html += '<td class="num">' + d.cw + '万</td>';
      html += '<td class="num">' + d.ms + '%</td>';
      html += '<td class="num">' + d.achieve + '%</td>';
      html += '<td class="num"><span class="tag ' + vsCls + '">' + (d.vsHx >= 0 ? '+' : '') + d.vsHx + '万</span></td>';
      html += '<td class="num">' + contrib + '%</td>';
      html += '<td class="num">' + d.winRate + '%</td></tr>';
    });
    tbody.innerHTML = html;
  }

  function renderBranchContribution() {
    var el = document.getElementById('chart-branch-contribution');
    if (!el) return;

    var branchData = [];
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      branchData.push({ name: b, value: +cw.toFixed(1) });
    });
    branchData.sort(function(a, b) { return b.value - a.value; });

    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
      series: [{
        type: 'treemap', data: branchData, width: '100%', height: '100%', roam: false,
        label: { show: true, formatter: '{b}\n{c}万', fontSize: 11, color: '#fff', fontWeight: 'bold' },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        levels: [{ colorMapping: 'value', color: [accent, orange, blue, green, purple, '#0d9488', '#d946ef', '#f59e0b', '#0891b2', '#4f46e5', '#be123c'] }]
      }]
    });
    allCharts.push(chart);
  }

  function renderBranchRankInsight() {
    var bestBranch = '', bestCw = 0, bestWinRate = 0, bestWinBranch = '';
    BRANCHES.forEach(function(b) {
      var cw = sumWeeks(function(w) { var d = getBranchWeekData(w, b); return d && d.totals ? d.totals.cw : 0; });
      if (cw > bestCw) { bestCw = cw; bestBranch = b; }
      var winCount = 0, totalWeeks = 0;
      DASHBOARD_ALL.allWeeks.forEach(function(w) {
        var d = getBranchWeekData(w, b);
        if (d && d.totals) { totalWeeks++; if (d.totals.cw > d.totals.hx) winCount++; }
      });
      var wr = totalWeeks > 0 ? winCount / totalWeeks : 0;
      if (wr > bestWinRate) { bestWinRate = wr; bestWinBranch = b; }
    });

    var text = '11个分公司年度累计销额排名：' + bestBranch + '以' + bestCw.toFixed(1) + '万居首。';
    text += '周胜率最高为' + bestWinBranch + '（' + (bestWinRate*100).toFixed(1) + '%），即' + bestWinBranch + '在多数周次中销额超越了海信。';
    var el = document.getElementById('insight-branch-rank-text');
    if (el) el.textContent = text;
  }

  // ===== SECTION 3: 品牌竞争 =====
  function renderBrandCumulative() {
    var brandMap = {};
    DASHBOARD_ALL.allWeeks.forEach(function(w) {
      var d = getWeekData(w);
      if (d && d.brandOverview) {
        d.brandOverview.forEach(function(br) {
          if (!brandMap[br.brand]) brandMap[br.brand] = { sales: 0, amount: 0 };
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

    var pieEl = document.getElementById('chart-brand-cumulative-pie');
    if (pieEl && brands.length > 0) {
      var top6 = brands.slice(0, 6);
      var otherAmount = brands.slice(6).reduce(function(s, b) { return s + b.amount; }, 0);
      var pieData = top6.map(function(b) { return { name: b.brand, value: b.amount }; });
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

  function renderBrandInsight() {
    var brandMap = {};
    DASHBOARD_ALL.allWeeks.forEach(function(w) {
      var d = getWeekData(w);
      if (d && d.brandOverview) {
        d.brandOverview.forEach(function(br) {
          if (!brandMap[br.brand]) brandMap[br.brand] = { amount: 0, sales: 0 };
          brandMap[br.brand].amount += br.amount || 0;
          brandMap[br.brand].sales += br.sales || 0;
        });
      }
    });
    var brands = Object.keys(brandMap).map(function(k) { return { brand: k, amount: brandMap[k].amount, sales: brandMap[k].sales }; }).sort(function(a, b) { return b.amount - a.amount; });
    var total = brands.reduce(function(s, b) { return s + b.amount; }, 0);

    var cwRank = brands.findIndex(function(b) { return b.brand === '创维'; }) + 1;
    var cw = brands.filter(function(b) { return b.brand === '创维'; })[0];
    var hx = brands.filter(function(b) { return b.brand === '海信'; })[0];
    var tcl = brands.filter(function(b) { return b.brand === 'TCL'; })[0];

    var text = '2026年南部战区年度累计品牌排名：创维第' + cwRank + '名，累计销额';
    text += cw ? cw.amount.toFixed(1) + '万（市占率' + (cw.amount/total*100).toFixed(1) + '%）' : '--';
    text += hx ? '；海信' + hx.amount.toFixed(1) + '万（' + (hx.amount/total*100).toFixed(1) + '%）' : '';
    text += tcl ? '；TCL' + tcl.amount.toFixed(1) + '万（' + (tcl.amount/total*100).toFixed(1) + '%）' : '';
    text += '。';
    if (cw && hx) {
      text += '全年累计差距' + (cw.amount - hx.amount).toFixed(1) + '万。';
    }
    var el = document.getElementById('insight-brand-text');
    if (el) el.textContent = text;
  }

  // ===== SECTION 4: 产品分析 (年度累计) =====
  function renderProductAnalysis() {
    // Aggregate product data across all 27 weeks
    var productMap = {};
    DASHBOARD_ALL.allWeeks.forEach(function(w) {
      var d = getWeekData(w);
      if (d && d.top20) {
        d.top20.forEach(function(r) {
          var key = r.brand + '|' + r.model;
          if (!productMap[key]) {
            productMap[key] = { brand: r.brand, model: r.model, sales: 0, amount: 0, weeks: 0, prices: [] };
          }
          productMap[key].sales += r.sales || 0;
          productMap[key].amount += r.amount || 0;
          productMap[key].weeks += 1;
          if (r.avg_price) productMap[key].prices.push(r.avg_price);
        });
      }
    });

    var products = Object.keys(productMap).map(function(k) {
      var p = productMap[k];
      var avgPrice = p.prices.length > 0 ? Math.round(p.prices.reduce(function(s, v) { return s + v; }, 0) / p.prices.length) : (p.sales > 0 ? Math.round(p.amount * 10000 / p.sales) : 0);
      return { brand: p.brand, model: p.model, sales: p.sales, amount: +p.amount.toFixed(2), weeks: p.weeks, avgPrice: avgPrice };
    }).sort(function(a, b) { return b.amount - a.amount; });

    // TOP20 all brands
    var tbody = document.getElementById('table-top20-body');
    if (tbody) {
      var html = '';
      products.slice(0, 20).forEach(function(r, i) {
        var rankCls = i < 3 ? 'rd-' + (i + 1) : 'rd-o';
        html += '<tr><td class="rank"><span class="rank-dot ' + rankCls + '">' + (i+1) + '</span></td>';
        html += '<td>' + r.brand + '</td><td>' + r.model + '</td>';
        html += '<td class="num">' + r.sales.toLocaleString() + '</td>';
        html += '<td class="num">' + r.amount + '万</td>';
        html += '<td class="num">¥' + r.avgPrice.toLocaleString() + '</td>';
        html += '<td class="num">' + r.weeks + '周</td></tr>';
      });
      tbody.innerHTML = html;
    }

    // 创维 TOP10
    var cwProducts = products.filter(function(p) { return p.brand === '创维'; }).slice(0, 10);
    var cwTbody = document.getElementById('table-cw-top10-body');
    if (cwTbody) {
      var cwHtml = '';
      cwProducts.forEach(function(r, i) {
        var rankCls = i < 3 ? 'rd-' + (i + 1) : 'rd-o';
        cwHtml += '<tr><td class="rank"><span class="rank-dot ' + rankCls + '">' + (i+1) + '</span></td>';
        cwHtml += '<td>' + r.model + '</td><td class="num">' + r.sales.toLocaleString() + '</td>';
        cwHtml += '<td class="num">' + r.amount + '万</td>';
        cwHtml += '<td class="num">¥' + r.avgPrice.toLocaleString() + '</td>';
        cwHtml += '<td class="num">' + r.weeks + '周</td></tr>';
      });
      cwTbody.innerHTML = cwHtml;
    }

    // Product insight
    var insightEl = document.getElementById('insight-product-text');
    if (insightEl && cwProducts.length > 0) {
      var top = cwProducts[0];
      var text = '年度累计创维TOP1型号为' + top.model + '，累计销量' + top.sales.toLocaleString() + '台，销额' + top.amount + '万，出现在' + top.weeks + '周中。';
      if (products.length > 0) {
        var cwInTop20 = products.slice(0, 20).filter(function(r) { return r.brand === '创维'; }).length;
        text += '年度TOP20中创维占' + cwInTop20 + '款。';
      }
      insightEl.textContent = text;
    }
  }

  // ===== MAIN =====
  function renderAll() {
    allCharts.forEach(function(c) { c.dispose(); });
    allCharts = [];

    renderKPIs();
    renderCompareCards();
    renderCumulativeAmount();
    renderCumulativeMSAchieve();
    renderOverviewInsight();
    renderBranchCumulativeTable();
    renderBranchContribution();
    renderBranchRankInsight();
    renderBrandCumulative();
    renderBrandInsight();
    renderProductAnalysis();
  }

  var branchSelect = document.getElementById('compare-branch');
  if (branchSelect) {
    branchSelect.addEventListener('change', function() {
      currentBranch = this.value;
      renderAll();
    });
  }

  renderAll();

  window.addEventListener('resize', function() {
    allCharts.forEach(function(c) { c.resize(); });
  });
})();
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = '#e63946', accent2 = '#457b9d', blue = '#2563eb', orange = '#ea580c';
  var green = '#16a34a', purple = '#7c3aed', teal = '#0d9488', ink = '#1a1a2e';
  var muted = '#6b7280', rule = '#e2e8f0', bg2 = '#f5f7fa';
  var allCharts = [];

  var D = DASHBOARD_NATIONAL;
  var allWeeks = D.allWeeks;
  var currentWeek = D.currentWeek || '26W27';

  function getWeekData(week) {
    for (var i = 0; i < D.weeklyTrends.length; i++) {
      if (D.weeklyTrends[i].week === week) return D.weeklyTrends[i];
    }
    return D.weeklyTrends[D.weeklyTrends.length - 1];
  }

  function renderAll() {
    allCharts.forEach(function(c) { c.dispose(); });
    allCharts = [];

    var wd = getWeekData(currentWeek);

    // ========== KPI CARDS ==========
    document.getElementById('kpi-cw-sales').textContent = wd.cw_sales.toLocaleString();
    document.getElementById('kpi-cw-amount').textContent = wd.cw_amount.toFixed(1) + '万';
    document.getElementById('kpi-cw-ms-qty').textContent = wd.cw_ms_qty.toFixed(1) + '%';
    document.getElementById('kpi-cw-ms-amt').textContent = wd.cw_ms_amt.toFixed(1) + '%';
    document.getElementById('kpi-total-sales').textContent = wd.total_sales.toLocaleString();
    document.getElementById('kpi-total-amount').textContent = wd.total_amount.toFixed(1) + '万';
    document.getElementById('kpi-avg-price').textContent = '¥' + wd.avg_price.toLocaleString();
    document.getElementById('kpi-yoy-sales').textContent = (wd.cw_yoy_sales >= 0 ? '▲' : '▼') + Math.abs(wd.cw_yoy_sales).toFixed(1) + '%';
    document.getElementById('kpi-yoy-amount').textContent = (wd.cw_yoy_amount >= 0 ? '▲' : '▼') + Math.abs(wd.cw_yoy_amount).toFixed(1) + '%';
    document.getElementById('kpi-yoy-sales').style.color = wd.cw_yoy_sales >= 0 ? green : accent;
    document.getElementById('kpi-yoy-amount').style.color = wd.cw_yoy_amount >= 0 ? green : accent;

    // ========== BRANCH TABLE ==========
    var brHtml = '';
    D.branchData.forEach(function(r, i) {
      var rd = i === 0 ? 'rd-1' : i === 1 ? 'rd-2' : i === 2 ? 'rd-3' : 'rd-o';
      brHtml += '<tr><td class="rank"><span class="rank-dot ' + rd + '">' + (i+1) + '</span></td>';
      brHtml += '<td><strong>' + r.branch + '</strong></td>';
      brHtml += '<td class="num">' + r.cw_sales.toLocaleString() + '</td>';
      brHtml += '<td class="num">' + r.cw_amount.toFixed(1) + '</td>';
      brHtml += '<td class="num"><strong>' + r.cw_ms.toFixed(1) + '%</strong></td>';
      brHtml += '<td class="num">' + r.total_sales.toLocaleString() + '</td>';
      brHtml += '<td class="num">' + r.total_amount.toFixed(1) + '</td></tr>';
    });
    document.getElementById('table-branch-body').innerHTML = brHtml;

    // ========== BRAND RANKING TABLE ==========
    var brandHtml = '';
    wd.brand_rank.forEach(function(r) {
      var isCW = r.brand === '创维';
      var rd = r.rank <= 3 ? 'rd-' + r.rank : 'rd-o';
      brandHtml += '<tr' + (isCW ? ' style="background:rgba(230,57,70,0.04);font-weight:600"' : '') + '>';
      brandHtml += '<td class="rank"><span class="rank-dot ' + rd + '">' + r.rank + '</span></td>';
      brandHtml += '<td><strong>' + r.brand + '</strong></td>';
      brandHtml += '<td class="num">' + r.amount.toFixed(1) + '万</td>';
      brandHtml += '<td class="num">' + r.sales.toLocaleString() + '</td>';
      brandHtml += '<td class="num"><strong>' + r.ms_amt.toFixed(1) + '%</strong></td>';
      brandHtml += '<td class="num">' + r.ms_qty.toFixed(1) + '%</td>';
      brandHtml += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
    });
    document.getElementById('table-brand-body').innerHTML = brandHtml;

    // ========== TOP30 TABLE ==========
    var top30Html = '';
    D.top30.forEach(function(r, i) {
      var bTag = r.brand === '创维' ? 'tag-red' : r.brand === '海信' ? 'tag-blue' : 'tag-yellow';
      top30Html += '<tr><td class="rank">' + (i+1) + '</td>';
      top30Html += '<td><span class="tag ' + bTag + '">' + r.brand + '</span></td>';
      top30Html += '<td><strong>' + r.model + '</strong></td>';
      top30Html += '<td class="num">' + r.size + '吋</td>';
      top30Html += '<td class="num">' + r.sales.toLocaleString() + '</td>';
      top30Html += '<td class="num">' + r.amount.toFixed(1) + '万</td>';
      top30Html += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
    });
    document.getElementById('table-top30-body').innerHTML = top30Html;

    // ========== CW TOP20 TABLE ==========
    var cw20Html = '';
    D.cwTop20.forEach(function(r, i) {
      cw20Html += '<tr><td class="rank">' + (i+1) + '</td>';
      cw20Html += '<td><strong>' + r.model + '</strong></td>';
      cw20Html += '<td class="num">' + r.size + '吋</td>';
      cw20Html += '<td class="num">' + r.sales.toLocaleString() + '</td>';
      cw20Html += '<td class="num">' + r.amount.toFixed(1) + '万</td>';
      cw20Html += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
    });
    document.getElementById('table-cw-top20-body').innerHTML = cw20Html;

    // ========== SIZE TOP20 TABS ==========
    var segIds = ['table-size-50', 'table-size-55', 'table-size-65', 'table-size-75', 'table-size-85', 'table-size-86', 'table-size-98'];
    D.sizeSegs.forEach(function(seg, si) {
      var items = D.sizeTop20[seg] || [];
      var sHtml = '';
      items.forEach(function(r, i) {
        var bTag = r.brand === '创维' ? 'tag-red' : r.brand === '海信' ? 'tag-blue' : 'tag-yellow';
        sHtml += '<tr><td class="rank">' + (i+1) + '</td>';
        sHtml += '<td><span class="tag ' + bTag + '">' + r.brand + '</span></td>';
        sHtml += '<td><strong>' + r.model + '</strong></td>';
        sHtml += '<td class="num">' + r.sales.toLocaleString() + '</td>';
        sHtml += '<td class="num">' + r.amount.toFixed(1) + '万</td>';
        sHtml += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
      });
      document.getElementById(segIds[si]).innerHTML = sHtml;
    });

    // ========== CHARTS ==========

    // Chart 1: CW weekly trend (sales + amount)
    var c1El = document.getElementById('chart-cw-trend');
    if (c1El) {
      var c1 = echarts.init(c1El, null, { renderer: 'svg' });
      var wkLabels = allWeeks.map(function(w) { return w.replace('26W','W'); });
      var cwSales = D.brandWeekly['创维'].map(function(r) { return r.wk_sales; });
      var cwAmount = D.brandWeekly['创维'].map(function(r) { return r.wk_amount; });
      c1.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['销量(台)', '销额(万)'], bottom: 0, textStyle: { fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: wkLabels, axisLabel: { fontSize: 9, color: muted } },
        yAxis: [
          { type: 'value', name: '台', axisLabel: { fontSize: 10, color: muted }, splitLine: { lineStyle: { color: rule } } },
          { type: 'value', name: '万', axisLabel: { fontSize: 10, color: muted }, splitLine: { show: false } }
        ],
        color: [accent, blue],
        series: [
          { name: '销量(台)', type: 'bar', data: cwSales, barWidth: '60%', itemStyle: { borderRadius: [3,3,0,0] } },
          { name: '销额(万)', type: 'line', yAxisIndex: 1, data: cwAmount, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2 }, itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 } }
        ]
      });
      allCharts.push(c1);
    }

    // Chart 2: National weekly trend
    var c2El = document.getElementById('chart-national-trend');
    if (c2El) {
      var c2 = echarts.init(c2El, null, { renderer: 'svg' });
      var nSales = D.weeklyTrends.map(function(r) { return r.total_sales; });
      var nAmount = D.weeklyTrends.map(function(r) { return r.total_amount; });
      var nPrice = D.weeklyTrends.map(function(r) { return r.avg_price; });
      c2.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['销量(台)', '销额(万)', '均价(元)'], bottom: 0, textStyle: { fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: wkLabels, axisLabel: { fontSize: 9, color: muted } },
        yAxis: [
          { type: 'value', name: '台/万', axisLabel: { fontSize: 10, color: muted }, splitLine: { lineStyle: { color: rule } } },
          { type: 'value', name: '元', axisLabel: { fontSize: 10, color: muted, formatter: function(v) { return (v/1000).toFixed(0)+'k'; } }, splitLine: { show: false } }
        ],
        color: [accent, blue, orange],
        series: [
          { name: '销量(台)', type: 'bar', data: nSales, barWidth: '50%', itemStyle: { borderRadius: [3,3,0,0] } },
          { name: '销额(万)', type: 'line', data: nAmount, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2, color: blue }, itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 } },
          { name: '均价(元)', type: 'line', yAxisIndex: 1, data: nPrice, symbol: 'diamond', symbolSize: 6, lineStyle: { width: 2, type: 'dashed', color: orange }, itemStyle: { color: orange, borderColor: '#fff', borderWidth: 2 } }
        ]
      });
      allCharts.push(c2);
    }

    // Chart 3: Brand cumulative amount trend
    var c3El = document.getElementById('chart-brand-cumulative');
    if (c3El) {
      var c3 = echarts.init(c3El, null, { renderer: 'svg' });
      var brandColors = [accent, blue, orange, '#9a60b4', green, '#0d9488', '#f59e0b', '#6b7280', '#ec4899', '#6366f1'];
      var series = D.topBrands.map(function(brand, idx) {
        return {
          name: brand, type: 'line', data: D.brandWeekly[brand].map(function(r) { return r.cum_amount; }),
          symbol: 'none', lineStyle: { width: brand === '创维' ? 3 : 1.5 }, itemStyle: { color: brandColors[idx] },
          emphasis: { focus: 'series' }
        };
      });
      c3.setOption({
        tooltip: { trigger: 'axis' },
        legend: { type: 'scroll', bottom: 0, textStyle: { fontSize: 10 }, data: D.topBrands },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
        xAxis: { type: 'category', data: wkLabels, axisLabel: { fontSize: 9, color: muted } },
        yAxis: { type: 'value', name: '累计销额(万)', axisLabel: { fontSize: 10, color: muted }, splitLine: { lineStyle: { color: rule } } },
        color: brandColors,
        series: series
      });
      allCharts.push(c3);
    }

    // Chart 4: Size segment weekly trend
    var c4El = document.getElementById('chart-size-trend');
    if (c4El) {
      var c4 = echarts.init(c4El, null, { renderer: 'svg' });
      var sizeColors = [accent, blue, orange, green, purple, teal, '#f59e0b'];
      var sizeSeries = D.sizeSegs.map(function(seg, idx) {
        return {
          name: seg, type: 'line', data: D.sizeWeekly[seg].map(function(r) { return r.sales; }),
          symbol: 'none', lineStyle: { width: 2 }, itemStyle: { color: sizeColors[idx] },
          emphasis: { focus: 'series' }
        };
      });
      c4.setOption({
        tooltip: { trigger: 'axis' },
        legend: { type: 'scroll', bottom: 0, textStyle: { fontSize: 10 }, data: D.sizeSegs },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
        xAxis: { type: 'category', data: wkLabels, axisLabel: { fontSize: 9, color: muted } },
        yAxis: { type: 'value', name: '销量(台)', axisLabel: { fontSize: 10, color: muted }, splitLine: { lineStyle: { color: rule } } },
        color: sizeColors,
        series: sizeSeries
      });
      allCharts.push(c4);
    }

    // Chart 5: Brand size segment share (current week)
    var c5El = document.getElementById('chart-brand-size-ms');
    if (c5El) {
      var c5 = echarts.init(c5El, null, { renderer: 'svg' });
      var msData = [];
      D.sizeSegs.forEach(function(seg) {
        var ms = D.sizeMS[seg] || {};
        var total = 0;
        D.topBrands.forEach(function(b) { total += (ms[b] || {}).ms_amt || 0; });
        D.topBrands.forEach(function(b) {
          msData.push({ name: b, value: (ms[b] || {}).ms_amt || 0, seg: seg });
        });
      });
      // Build a stacked bar chart
      var segVals = {};
      D.topBrands.forEach(function(b) { segVals[b] = []; });
      D.sizeSegs.forEach(function(seg) {
        var ms = D.sizeMS[seg] || {};
        D.topBrands.forEach(function(b) {
          segVals[b].push((ms[b] || {}).ms_amt || 0);
        });
      });
      var brandSeries = D.topBrands.map(function(b, idx) {
        return { name: b, type: 'bar', stack: 'total', data: segVals[b], barWidth: '50%', itemStyle: { color: brandColors[idx] } };
      });
      c5.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { type: 'scroll', bottom: 0, textStyle: { fontSize: 9 }, data: D.topBrands },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
        xAxis: { type: 'category', data: D.sizeSegs, axisLabel: { fontSize: 10, color: muted } },
        yAxis: { type: 'value', name: '销额份额%', axisLabel: { fontSize: 10, color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
        color: brandColors,
        series: brandSeries
      });
      allCharts.push(c5);
    }

    // Chart 6: Brand size segment distribution (treemap for 创维)
    var c6El = document.getElementById('chart-cw-size-dist');
    if (c6El) {
      var c6 = echarts.init(c6El, null, { renderer: 'svg' });
      var cwSize = D.brandSizeData['创维'] || {};
      var treeData = [];
      for (var seg in cwSize) {
        treeData.push({ name: seg, value: cwSize[seg].amount });
      }
      c6.setOption({
        tooltip: { formatter: function(p) { return p.name + '<br/>销额: ' + p.value.toFixed(1) + '万'; } },
        series: [{
          type: 'treemap', data: treeData, roam: false,
          label: { show: true, formatter: function(p) { return p.name + '\n' + p.value.toFixed(1) + '万'; }, fontSize: 11 },
          itemStyle: { borderColor: '#fff', borderWidth: 2 }
        }]
      });
      allCharts.push(c6);
    }
  }

  // Week selector
  var weekSelect = document.getElementById('week-selector');
  if (weekSelect) {
    weekSelect.addEventListener('change', function() {
      currentWeek = this.value;
      document.getElementById('header-week').textContent = currentWeek;
      renderAll();
    });
  }

  // Size tab switching
  document.querySelectorAll('.size-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.size-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      var seg = this.getAttribute('data-seg');
      document.querySelectorAll('.size-tab-content').forEach(function(c) { c.style.display = 'none'; });
      document.getElementById('size-tab-' + seg).style.display = 'block';
    });
  });

  // Initial render
  renderAll();

  window.addEventListener('resize', function() {
    allCharts.forEach(function(c) { c.resize(); });
  });
})();
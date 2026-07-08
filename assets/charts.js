(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var green = style.getPropertyValue('--green').trim();
  var orange = style.getPropertyValue('--orange').trim();
  var blue = style.getPropertyValue('--blue').trim();
  var purple = style.getPropertyValue('--purple').trim();
  var teal = style.getPropertyValue('--teal').trim();

  var allCharts = [];
  function resizeAll() { allCharts.forEach(function(c) { if (c && !c.isDisposed()) c.resize(); }); }
  window.addEventListener('resize', resizeAll);

  var d = DASHBOARD;

  // ========== TABLES ==========
  (function() {
    // Brand overview table
    var boHtml = '';
    d.brandOverview.forEach(function(r) {
      var isCW = r.brand === '创维';
      var yTag = r.yoy_ms >= 0 ? 'tag-green' : 'tag-red';
      boHtml += '<tr' + (isCW ? ' style="background:rgba(0,153,255,0.06);font-weight:600"' : '') + '>';
      boHtml += '<td class="rank"><span class="rank-dot rd-o">' + r.rank + '</span></td>';
      boHtml += '<td><strong>' + r.brand + '</strong></td>';
      boHtml += '<td class="num">' + r.sales.toLocaleString() + '</td>';
      boHtml += '<td class="num">' + r.amount.toFixed(2) + '</td>';
      boHtml += '<td class="num">' + (r.ms_sales*100).toFixed(1) + '%</td>';
      boHtml += '<td class="num"><strong>' + (r.ms_amount*100).toFixed(1) + '%</strong></td>';
      boHtml += '<td class="num"><span class="tag ' + yTag + '">' + (r.yoy_ms >= 0 ? '+' : '') + (r.yoy_ms*100).toFixed(1) + '%</span></td>';
      boHtml += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
    });
    document.getElementById('table-brand-body').innerHTML = boHtml;

    // MS table
    var msHtml = '';
    d.msData.forEach(function(r, i) {
      var rd = i === 0 ? 'rd-1' : i === 1 ? 'rd-2' : i === 2 ? 'rd-3' : 'rd-o';
      var aTag = r.achieve >= 1.0 ? 'tag-green' : r.achieve >= 0.9 ? 'tag-yellow' : 'tag-red';
      var lTag = r.lead_hx >= 0 ? 'tag-green' : 'tag-red';
      var yTag = r.yoy >= 0 ? 'tag-green' : 'tag-red';
      msHtml += '<tr><td class="rank"><span class="rank-dot ' + rd + '">' + (i+1) + '</span></td>';
      msHtml += '<td><strong>' + r.branch + '</strong></td>';
      msHtml += '<td class="num">' + r.cw.toFixed(2) + '</td>';
      msHtml += '<td class="num"><strong>' + (r.cw_ms*100).toFixed(1) + '%</strong></td>';
      msHtml += '<td class="num">' + (r.target*100).toFixed(1) + '%</td>';
      msHtml += '<td class="num"><span class="tag ' + aTag + '">' + (r.achieve*100).toFixed(1) + '%</span></td>';
      msHtml += '<td class="num"><span class="tag ' + yTag + '">' + (r.yoy >= 0 ? '+' : '') + (r.yoy*100).toFixed(1) + '%</span></td>';
      msHtml += '<td class="num"><span class="tag ' + lTag + '">' + (r.lead_hx >= 0 ? '+' : '') + r.lead_hx.toFixed(1) + '万</span></td></tr>';
    });
    var tc = d.totals;
    msHtml += '<tr style="font-weight:700;background:var(--bg2)"><td class="rank">-</td><td><strong>总计</strong></td>';
    msHtml += '<td class="num">' + tc.cw.toFixed(2) + '</td>';
    msHtml += '<td class="num">' + (tc.ms*100).toFixed(1) + '%</td>';
    msHtml += '<td class="num">24.4%</td>';
    msHtml += '<td class="num"><span class="tag tag-green">' + (tc.ms/0.244*100).toFixed(1) + '%</span></td>';
    msHtml += '<td class="num"><span class="tag ' + (tc.yoy >= 0 ? 'tag-green' : 'tag-red') + '">' + (tc.yoy >= 0 ? '+' : '') + (tc.yoy*100).toFixed(1) + '%</span></td>';
    msHtml += '<td class="num"><span class="tag tag-red">' + (tc.cw - tc.hx).toFixed(1) + '万</span></td></tr>';
    document.getElementById('ms-table-body').innerHTML = msHtml;

    // 98 table
    var html98 = '';
    d.data98.forEach(function(r) {
      var hxRatio = r.hx_s > 0 ? (r.cw_s / r.hx_s).toFixed(2) : '-';
      var tclRatio = r.tcl_s > 0 ? (r.cw_s / r.tcl_s).toFixed(2) : '-';
      html98 += '<tr><td><strong>' + r.branch + '</strong></td>';
      html98 += '<td class="num">' + r.cw_s + '</td><td class="num">' + r.cw_e.toFixed(2) + '</td>';
      html98 += '<td class="num">' + r.hx_s + '</td><td class="num">' + r.hx_e.toFixed(2) + '</td>';
      html98 += '<td class="num">' + r.tcl_s + '</td><td class="num">' + r.tcl_e.toFixed(2) + '</td>';
      html98 += '<td class="num">' + hxRatio + '</td><td class="num">' + tclRatio + '</td></tr>';
    });
    var scw = d.data98.reduce(function(s,r){return s+r.cw_s;},0);
    var shx = d.data98.reduce(function(s,r){return s+r.hx_s;},0);
    var stcl = d.data98.reduce(function(s,r){return s+r.tcl_s;},0);
    html98 += '<tr style="font-weight:700;background:var(--bg2)"><td><strong>合计</strong></td>';
    html98 += '<td class="num">' + scw + '</td><td class="num">' + (scw > 0 ? (d.data98.reduce(function(s,r){return s+r.cw_e;},0)).toFixed(2) : '0.00') + '</td>';
    html98 += '<td class="num">' + shx + '</td><td class="num">' + (shx > 0 ? (d.data98.reduce(function(s,r){return s+r.hx_e;},0)).toFixed(2) : '0.00') + '</td>';
    html98 += '<td class="num">' + stcl + '</td><td class="num">' + (stcl > 0 ? (d.data98.reduce(function(s,r){return s+r.tcl_e;},0)).toFixed(2) : '0.00') + '</td>';
    html98 += '<td class="num">' + (shx > 0 ? (scw/shx).toFixed(2) : '-') + '</td><td class="num">' + (stcl > 0 ? (scw/stcl).toFixed(2) : '-') + '</td></tr>';
    document.getElementById('table-98-body').innerHTML = html98;

    // TOP20 table
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

    // Size TOP5 tables
    var segs = ['80吋+', '75-77吋', '65吋', '55吋及以下'];
    var segIds = ['table-size80-body', 'table-size75-body', 'table-size65-body', 'table-size55-body'];
    for (var si = 0; si < segs.length; si++) {
      var items = d.sizeTop5[segs[si]] || [];
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
    }

    // Q7H table
    var q7hHtml = '';
    d.q7hData.forEach(function(r) {
      var ratio = r.u7s_s > 0 ? (r.q7h_s / r.u7s_s).toFixed(1) : (r.q7h_s > 0 ? '∞' : '-');
      q7hHtml += '<tr><td><strong>' + r.branch + '</strong></td>';
      q7hHtml += '<td class="num">' + r.q7h_s + '</td><td class="num">' + r.q7h_e.toFixed(2) + '万</td>';
      q7hHtml += '<td class="num">' + r.u7s_s + '</td><td class="num">' + r.u7s_e.toFixed(2) + '万</td>';
      q7hHtml += '<td class="num"><strong>' + ratio + 'x</strong></td></tr>';
    });
    document.getElementById('table-q7h-body').innerHTML = q7hHtml;
  })();

  // ========== CHART 1: MS vs Achieve ==========
  var c2 = echarts.init(document.getElementById('chart-ms-achieve'), null, { renderer: 'svg' });
  var branches = d.msData.map(function(r) { return r.branch; });
  var msVals = d.msData.map(function(r) { return +(r.cw_ms * 100).toFixed(1); });
  var achieveVals = d.msData.map(function(r) { return +(r.achieve * 100).toFixed(1); });
  var targetVals = d.msData.map(function(r) { return +(r.target * 100).toFixed(1); });
  c2.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['市占率', '目标', '达成率'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: branches, axisLabel: { rotate: 35, fontSize: 10, color: muted } },
    yAxis: [
      { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
      { type: 'value', name: '达成率%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { show: false } }
    ],
    color: [accent, '#d4d4d8', blue],
    series: [
      { name: '市占率', type: 'bar', data: msVals, barWidth: '40%', barGap: '20%', itemStyle: { borderRadius: [4,4,0,0] } },
      { name: '目标', type: 'bar', data: targetVals, barWidth: '40%', itemStyle: { color: '#d4d4d8', borderRadius: [4,4,0,0] } },
      { name: '达成率', type: 'line', yAxisIndex: 1, data: achieveVals, symbol: 'diamond', symbolSize: 8,
        lineStyle: { width: 2.5, color: blue }, itemStyle: { color: blue },
        markLine: { silent: true, data: [{ yAxis: 100, label: { formatter: '100%', fontSize: 10 }, lineStyle: { color: green, type: 'dashed', width: 1.5 } }] } }
    ]
  });
  allCharts.push(c2);

  // ========== CHART 2: YoY ==========
  var c3 = echarts.init(document.getElementById('chart-yoy'), null, { renderer: 'svg' });
  var yoyData = d.msData.map(function(r) { return { name: r.branch, value: +(r.yoy * 100).toFixed(2) }; });
  var yoyX = yoyData.map(function(r) { return r.name; });
  var yoyY = yoyData.map(function(r) { return r.value; });
  c3.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) { return p[0].name + '<br/>同比: ' + (p[0].value >= 0 ? '+' : '') + p[0].value + '%'; } },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: yoyX, axisLabel: { rotate: 35, fontSize: 10, color: muted } },
    yAxis: { type: 'value', name: '百分点(%)', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
    series: [{
      type: 'bar', data: yoyY.map(function(v) {
        return { value: v, itemStyle: { color: v >= 0 ? green : accent, borderRadius: v >= 0 ? [4,4,0,0] : [0,0,4,4] } };
      }), barWidth: '55%',
      label: { show: true, position: 'top', color: ink, fontSize: 10, formatter: function(p) { return (p.value >= 0 ? '+' : '') + p.value + '%'; } }
    }]
  });
  allCharts.push(c3);

  // ========== CHART 2b: Brand overview ==========
  var c3b = echarts.init(document.getElementById('chart-brand-overview'), null, { renderer: 'svg' });
  var boBrands = d.brandOverview.map(function(r) { return r.brand; });
  var boAmount = d.brandOverview.map(function(r) { return r.amount; });
  var boMS = d.brandOverview.map(function(r) { return +(r.ms_amount * 100).toFixed(1); });
  c3b.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['销额(万)', '额市占率%'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: boBrands, axisLabel: { color: muted, fontSize: 10 } },
    yAxis: [
      { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
      { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { show: false } }
    ],
    color: [accent, orange],
    series: [
      { name: '销额(万)', type: 'bar', data: boAmount, barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0] },
        label: { show: true, position: 'top', color: ink, fontSize: 9, formatter: function(p) { return p.value.toFixed(0); } } },
      { name: '额市占率%', type: 'line', yAxisIndex: 1, data: boMS, symbol: 'circle', symbolSize: 8,
        lineStyle: { width: 2.5, color: orange }, itemStyle: { color: orange, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, color: orange, fontSize: 9, formatter: '{c}%' } }
    ]
  });
  allCharts.push(c3b);

  // ========== CHART 3: 98+ horizontal bar 精致版 ==========
  var c4 = echarts.init(document.getElementById('chart-98-bar'), null, { renderer: 'svg' });
  var b98 = d.data98.map(function(r) { return r.branch; }).reverse();
  var cw98 = d.data98.map(function(r) { return r.cw_s; }).reverse();
  var hx98 = d.data98.map(function(r) { return r.hx_s; }).reverse();
  var tcl98 = d.data98.map(function(r) { return r.tcl_s; }).reverse();
  var max98 = Math.max.apply(null, cw98.concat(hx98).concat(tcl98));
  c4.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(20,22,30,0.92)',
      borderColor: '#333', textStyle: { color: '#fff', fontSize: 12 },
      formatter: function(params) {
        var s = '<strong>' + params[0].name + '</strong>';
        params.forEach(function(p) { s += '<br/>' + p.marker + ' ' + p.seriesName + ': <b>' + p.value + '台</b>'; });
        return s;
      }
    },
    legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: ink, fontSize: 11 }, itemWidth: 14, itemHeight: 10 },
    grid: { left: '3%', right: '10%', bottom: '12%', top: '5%', containLabel: true },
    xAxis: { type: 'value', name: '台', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', data: b98, axisLabel: { color: ink, fontSize: 11, fontWeight: 'bold' },
      axisLine: { show: false }, axisTick: { show: false } },
    color: [accent, blue, orange],
    series: [
      { name: '创维', type: 'bar', data: cw98, barWidth: '45%', barGap: '15%',
        itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:accent},{offset:1,color:accent+'66'}]) },
        label: { show: true, position: 'right', color: accent, fontSize: 11, fontWeight: 'bold', formatter: '{c}台' },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: accent+'40' } } },
      { name: '海信', type: 'bar', data: hx98, barWidth: '45%',
        itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:blue},{offset:1,color:blue+'66'}]) },
        label: { show: true, position: 'right', color: blue, fontSize: 10, formatter: '{c}台' } },
      { name: 'TCL', type: 'bar', data: tcl98, barWidth: '45%',
        itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:orange},{offset:1,color:orange+'66'}]) },
        label: { show: true, position: 'right', color: orange, fontSize: 10, formatter: '{c}台' } }
    ]
  });
  allCharts.push(c4);

  // ========== CHART 5: 98+ Heatmap ==========
  var c5 = echarts.init(document.getElementById('chart-98-heat'), null, { renderer: 'svg' });
  // Build dynamic brands from data (preserve order from data)
  var brandsSet = new Set();
  var pricesSet = new Set();
  d.heat98.forEach(function(r) { brandsSet.add(r.brand); pricesSet.add(r.price_band); });
  var heatBrands = Array.from(brandsSet);
  var heatPrices = Array.from(pricesSet).sort(function(a, b) {
    var order = {'<1万':1, '1-1.5万':2, '1.5-2万':3, '2-3万':4, '>3万':5};
    return order[a] - order[b];
  });
  var heatData = [];
  d.heat98.forEach(function(r) {
    // x-axis = price band, y-axis = brand
    // ECharts requires [x, y, value]
    heatData.push([heatPrices.indexOf(r.price_band), heatBrands.indexOf(r.brand), r.sales]);
  });
  c5.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, backgroundColor: 'rgba(20,22,30,0.92)',
      borderColor: '#333', textStyle: { color: '#fff', fontSize: 12 },
      formatter: function(p) { return heatBrands[p.value[1]] + ' · ' + heatPrices[p.value[0]] + '<br/>销量: ' + p.value[2] + '台'; } },
    grid: { left: '15%', right: '8%', top: '10%', bottom: '12%' },
    xAxis: { type: 'category', data: heatPrices, axisLabel: { color: muted, fontSize: 10 }, position: 'top',
      axisLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', data: heatBrands, axisLabel: { color: ink, fontSize: 10, fontWeight: 'bold' },
      inverse: true, axisLine: { show: false }, axisTick: { show: false } },
    visualMap: { min: 0, max: 40, calculable: false, orient: 'horizontal', left: 'center', bottom: -8,
      inRange: { color: [bg2, accent2, accent] }, textStyle: { color: muted, fontSize: 10 } },
    series: [{
      type: 'heatmap', data: heatData, label: { show: true, color: ink, fontSize: 10, fontWeight: 'bold' },
      itemStyle: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: accent+'40' } }
    }]
  });
  allCharts.push(c5);

  // ========== CHART 6: Treemap ==========
  var c6 = echarts.init(document.getElementById('chart-treemap'), null, { renderer: 'svg' });
  var treeData = [];
  var brandColors = { '创维': accent, '海信': blue, 'TCL': orange };
  var otherColors = [purple, teal, '#94a3b8'];
  var oi = 0;
  var brandAgg = {};
  d.top20.forEach(function(r) {
    if (!brandAgg[r.brand]) brandAgg[r.brand] = [];
    brandAgg[r.brand].push({ name: r.model, value: r.amount });
  });
  Object.keys(brandAgg).forEach(function(brand) {
    var color = brandColors[brand] || otherColors[oi++ % otherColors.length];
    treeData.push({ name: brand, itemStyle: { color: color }, children: brandAgg[brand] });
  });
  c6.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: function(p) { return p.name + '<br/>销额: ' + p.value + '万'; } },
    series: [{
      type: 'treemap', data: treeData, width: '100%', height: '100%',
      roam: false, nodeClick: false, breadcrumb: { show: false },
      label: { show: true, formatter: function(p) { return p.name + '\n' + p.value + '万'; }, color: '#fff', fontSize: 10 },
      upperLabel: { show: true, height: 24, color: '#fff', fontSize: 12, fontWeight: 'bold' },
      itemStyle: { borderColor: '#fff', borderWidth: 2 }
    }]
  });
  allCharts.push(c6);

  // ========== CHART 7: 创维 TOP10 ==========
  var c7 = echarts.init(document.getElementById('chart-cw-top10'), null, { renderer: 'svg' });
  var cwM = d.top20_cw.map(function(r) { return r.model; }).reverse();
  var cwA = d.top20_cw.map(function(r) { return r.amount; }).reverse();
  c7.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: '3%', right: '10%', top: '5%', bottom: '5%', containLabel: true },
    xAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', data: cwM, axisLabel: { color: ink, fontSize: 10 } },
    series: [{
      type: 'bar', data: cwA, barWidth: '60%', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
        [{ offset: 0, color: accent }, { offset: 1, color: accent + '88' }]), borderRadius: [0,4,4,0] },
      label: { show: true, position: 'right', color: ink, fontSize: 10, formatter: '{c}万' }
    }]
  });
  allCharts.push(c7);

  // ========== CHART 8: 海信 TOP10 ==========
  var c8 = echarts.init(document.getElementById('chart-hx-top10'), null, { renderer: 'svg' });
  var hxM = d.top20_hx.map(function(r) { return r.model; }).reverse();
  var hxA = d.top20_hx.map(function(r) { return r.amount; }).reverse();
  c8.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: '3%', right: '10%', top: '5%', bottom: '5%', containLabel: true },
    xAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', data: hxM, axisLabel: { color: ink, fontSize: 10 } },
    series: [{
      type: 'bar', data: hxA, barWidth: '60%', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
        [{ offset: 0, color: blue }, { offset: 1, color: blue + '88' }]), borderRadius: [0,4,4,0] },
      label: { show: true, position: 'right', color: ink, fontSize: 10, formatter: '{c}万' }
    }]
  });
  allCharts.push(c8);

  // ========== CHART 9: TCL TOP10 ==========
  var c9 = echarts.init(document.getElementById('chart-tcl-top10'), null, { renderer: 'svg' });
  var tclM = d.top20_tcl.map(function(r) { return r.model; }).reverse();
  var tclA = d.top20_tcl.map(function(r) { return r.amount; }).reverse();
  c9.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: '3%', right: '10%', top: '5%', bottom: '5%', containLabel: true },
    xAxis: { type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', data: tclM, axisLabel: { color: ink, fontSize: 10 } },
    series: [{
      type: 'bar', data: tclA, barWidth: '60%', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
        [{ offset: 0, color: orange }, { offset: 1, color: orange + '88' }]), borderRadius: [0,4,4,0] },
      label: { show: true, position: 'right', color: ink, fontSize: 10, formatter: '{c}万' }
    }]
  });
  allCharts.push(c9);

  // ========== CHART 10: 行业尺寸段玫瑰图 ==========
  var c10 = echarts.init(document.getElementById('chart-size-pie'), null, { renderer: 'svg' });
  var sizeData = d.sizeList.map(function(r) { return { name: r.size, value: r.amount }; });
  c10.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: function(p) { return p.name + ': ' + p.value + '万 (' + p.percent + '%)'; } },
    legend: { bottom: 0, textStyle: { color: ink, fontSize: 9 } },
    color: [accent, blue, orange, purple, green, teal, '#ec4899', '#8b5cf6', '#6b7280'],
    series: [{
      type: 'pie', radius: ['30%', '70%'], center: ['50%', '45%'], roseType: 'area',
      label: { formatter: '{b}\n{d}%', color: ink, fontSize: 9 },
      data: sizeData
    }]
  });
  allCharts.push(c10);

  // ========== CHART 11: 创维尺寸段 ==========
  var c11 = echarts.init(document.getElementById('chart-cw-size-pie'), null, { renderer: 'svg' });
  var cwSizeData = d.cwSizeList.map(function(r) { return { name: r.size, value: r.amount }; });
  c11.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: function(p) { return p.name + ': ' + p.value + '万 (' + p.percent + '%)'; } },
    legend: { bottom: 0, textStyle: { color: ink, fontSize: 9 } },
    color: [accent, blue, orange, purple, green, teal, '#ec4899', '#8b5cf6', '#6b7280'],
    series: [{
      type: 'pie', radius: ['30%', '70%'], center: ['50%', '45%'], roseType: 'area',
      label: { formatter: '{b}\n{d}%', color: ink, fontSize: 9 },
      data: cwSizeData
    }]
  });
  allCharts.push(c11);

  // ========== CHART 9: 销量 vs 均价 双轴组合图 ==========
  var c12 = echarts.init(document.getElementById('chart-sales-price'), null, { renderer: 'svg' });
  var spLabels = d.cwSizeList.map(function(r) { return r.size; });
  var spSales = d.cwSizeList.map(function(r) { return r.sales; });
  var spPrice = d.cwSizeList.map(function(r) { return r.avg_price; });
  c12.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['销量', '均价'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: spLabels, axisLabel: { color: muted, fontSize: 10 } },
    yAxis: [
      { type: 'value', name: '台', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
      { type: 'value', name: '元', axisLabel: { color: muted, fontSize: 10, formatter: function(v) { return (v/1000).toFixed(0) + 'k'; } }, splitLine: { show: false } }
    ],
    color: [accent, blue],
    series: [
      { name: '销量', type: 'bar', data: spSales, barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0] },
        label: { show: true, position: 'top', color: ink, fontSize: 10 } },
      { name: '均价', type: 'line', yAxisIndex: 1, data: spPrice, symbol: 'circle', symbolSize: 10,
        lineStyle: { width: 2.5, color: blue }, itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: function(p) { return '¥' + (p.value/1000).toFixed(1) + 'k'; }, color: blue, fontSize: 10, fontWeight: 'bold' } }
    ]
  });
  allCharts.push(c12);

  // ========== CHART 10: 尺寸段品牌份额 精致版 ==========
  var c13 = echarts.init(document.getElementById('chart-size-brand'), null, { renderer: 'svg' });
  var segsRev = d.sizeSegs.slice().reverse();
  var cwS = d.cwShares.slice().reverse();
  var hxS = d.hxShares.slice().reverse();
  var tclS = d.tclShares.slice().reverse();
  c13.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(20,22,30,0.92)',
      borderColor: '#333', textStyle: { color: '#fff', fontSize: 12 },
      formatter: function(params) {
        var s = '<strong>' + params[0].name + '</strong>';
        params.forEach(function(p) { s += '<br/>' + p.marker + ' ' + p.seriesName + ': <b>' + p.value + '%</b>'; });
        return s;
      }
    },
    legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: ink, fontSize: 11 }, itemWidth: 14, itemHeight: 10 },
    grid: { left: '3%', right: '10%', bottom: '12%', top: '5%', containLabel: true },
    xAxis: { type: 'value', name: '销额份额 %', max: 50, axisLabel: { color: muted, fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }, axisLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', data: segsRev, axisLabel: { color: ink, fontSize: 12, fontWeight: 'bold' },
      axisLine: { show: false }, axisTick: { show: false } },
    color: [accent, blue, orange],
    series: [
      { name: '创维', type: 'bar', data: cwS, barWidth: '45%', barGap: '15%',
        itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:accent},{offset:1,color:accent+'66'}]) },
        label: { show: true, position: 'right', color: accent, fontSize: 11, fontWeight: 'bold', formatter: '{c}%' },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: accent+'40' } } },
      { name: '海信', type: 'bar', data: hxS, barWidth: '45%',
        itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:blue},{offset:1,color:blue+'66'}]) },
        label: { show: true, position: 'right', color: blue, fontSize: 10, formatter: '{c}%' } },
      { name: 'TCL', type: 'bar', data: tclS, barWidth: '45%',
        itemStyle: { borderRadius: [0,5,5,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:orange},{offset:1,color:orange+'66'}]) },
        label: { show: true, position: 'right', color: orange, fontSize: 10, formatter: '{c}%' } }
    ]
  });
  allCharts.push(c13);

  // ========== CHART 14: Q7H vs U7S-PRO 精致版 ==========
  var c14 = echarts.init(document.getElementById('chart-q7h-bar'), null, { renderer: 'svg' });
  var qB = d.q7hData.map(function(r) { return r.branch; });
  var qData = d.q7hData.map(function(r) { return r.q7h_s; });
  var uData = d.q7hData.map(function(r) { return r.u7s_s; });
  c14.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(20,22,30,0.92)',
      borderColor: '#333', textStyle: { color: '#fff', fontSize: 12 },
      formatter: function(params) {
        var s = '<strong>' + params[0].name + '</strong>';
        var idx = params[0].dataIndex;
        params.forEach(function(p) {
          s += '<br/>' + p.marker + ' ' + p.seriesName + ': <b>' + p.value + '台</b>' +
                (p.value * 1 > 0 ? ' · 销额 ' + (p.seriesName.indexOf('Q7H') >= 0 ? d.q7hData[idx].q7h_e : d.q7hData[idx].u7s_e) + '万' : '');
        });
        if (qData[idx] > 0 && uData[idx] > 0) {
          var ratio = (qData[idx] / uData[idx]).toFixed(1) + 'x';
          s += '<br/>比值: <b>' + ratio + '</b> (Q7H/U7S)';
        }
        return s;
      }
    },
    legend: { data: ['Q7H(创维)', 'U7S-PRO(海信)'], bottom: 0, textStyle: { color: ink, fontSize: 11 }, itemWidth: 20 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: qB, axisLabel: { color: ink, fontSize: 11, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: rule } }, axisTick: { lineStyle: { color: rule } } },
    yAxis: { type: 'value', name: '销量 (台)', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLine: { lineStyle: { color: rule } } },
    color: [accent, blue],
    series: [
      { name: 'Q7H(创维)', type: 'bar', data: qData, barWidth: '40%',
        itemStyle: { borderRadius: [4,4,0,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:accent},{offset:1,color:accent+'66'}]) },
        label: { show: true, position: 'top', color: accent, fontSize: 11, fontWeight: 'bold', formatter: '{c}台' },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: accent+'40' } } },
      { name: 'U7S-PRO(海信)', type: 'bar', data: uData, barWidth: '40%',
        itemStyle: { borderRadius: [4,4,0,0], color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:blue},{offset:1,color:blue+'66'}]) },
        label: { show: true, position: 'top', color: blue, fontSize: 11, formatter: '{c}台' },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: blue+'40' } } }
    ]
  });
  allCharts.push(c14);

})();
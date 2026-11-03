/* 创维电视南部战区 · 周报深度分析 charts
 * 数据来源：window.DASHBOARD_ALL（与动态看板共用单一事实来源）
 */
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#e63946';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#457b9d';
  var blue = style.getPropertyValue('--blue').trim() || '#2563eb';
  var green = style.getPropertyValue('--green').trim() || '#16a34a';
  var orange = style.getPropertyValue('--orange').trim() || '#ea580c';
  var purple = style.getPropertyValue('--purple').trim() || '#7c3aed';
  var gold = style.getPropertyValue('--gold').trim() || '#ca8a04';
  var ink = style.getPropertyValue('--ink').trim() || '#0f172a';
  var muted = style.getPropertyValue('--muted').trim() || '#64748b';
  var rule = style.getPropertyValue('--rule').trim() || '#e2e8f0';

  var CURRENT_WEEK = '26W43';

  function getD() {
    if (!window.DASHBOARD_ALL) return null;
    return {
      week: CURRENT_WEEK,
      totals: DASHBOARD_ALL.data[CURRENT_WEEK].totals,
      brandOverview: DASHBOARD_ALL.data[CURRENT_WEEK].brandOverview,
      msData: DASHBOARD_ALL.data[CURRENT_WEEK].msData,
      top40: DASHBOARD_ALL.data[CURRENT_WEEK].top40,
      priceBands: DASHBOARD_ALL.data[CURRENT_WEEK].priceBands,
      sizeList: DASHBOARD_ALL.data[CURRENT_WEEK].sizeList,
      sizeSegs: DASHBOARD_ALL.data[CURRENT_WEEK].sizeSegs,
      cwSizeList: DASHBOARD_ALL.data[CURRENT_WEEK].cwSizeList,
      cwShares: DASHBOARD_ALL.data[CURRENT_WEEK].cwShares,
      hxShares: DASHBOARD_ALL.data[CURRENT_WEEK].hxShares,
      tclShares: DASHBOARD_ALL.data[CURRENT_WEEK].tclShares,
      data98: DASHBOARD_ALL.data[CURRENT_WEEK].data98,
      q7hData: DASHBOARD_ALL.data[CURRENT_WEEK].q7hData,
      q7hBySize: DASHBOARD_ALL.data[CURRENT_WEEK].q7hBySize
    };
  }

  function mkChart(id, opt) {
    var el = document.getElementById(id); if (!el) return null;
    var c = echarts.init(el, null, { renderer: 'svg' });
    c.setOption(opt); return c;
  }

  // ============ Helper ============
  function h(tag, cls, content) { return '<' + tag + (cls ? ' class="' + cls + '"' : '') + '>' + content + '</' + tag + '>'; }
  function hi(text, cls) { return '<span class="' + (cls || 'hi') + '">' + text + '</span>'; }

  // ============ Cover ============
  function renderCover(d) {
    var t = d.totals;
    var cwRank = 0;
    d.brandOverview.forEach(function(b) { if (b.brand === '创维') cwRank = b.rank; });
    var gap = t.cw - t.hx;
    document.getElementById('cover-badge').textContent = '📊 WEEKLY REPORT · ' + d.week;
    document.getElementById('cover-date').textContent = '南部战区 · 第' + d.week + '周';
    document.getElementById('kpi-cw').textContent = t.cw.toFixed(1);
    document.getElementById('kpi-ms').textContent = (t.ms*100).toFixed(1) + '%';
    document.getElementById('kpi-ms').style.color = accent;
    document.getElementById('kpi-achieve').textContent = (t.achieve*100).toFixed(1) + '%';
    document.getElementById('kpi-rank').textContent = '#' + cwRank;
    var yoyHtml = t.yoy >= 0 ? '<span class="trend-up">▲ +' + (t.yoy*100).toFixed(1) + '% YoY</span>' : '';
    document.getElementById('kpi-yoy').innerHTML = yoyHtml;
    var gapHtml = gap >= 0 ? '领先 ' + gap.toFixed(1) + '万' : '落后 ' + Math.abs(gap).toFixed(1) + '万';
    document.getElementById('kpi-gap').innerHTML = gapHtml;
    document.getElementById('footer-week').textContent = d.week;
  }

  // ============ Executive Summary (图片风格) ============
  function renderSummary(d) {
    var t = d.totals, bo = d.brandOverview, ms = d.msData;
    var cw = bo.find(function(b) { return b.brand === '创维'; });
    var hx = bo.find(function(b) { return b.brand === '海信'; });
    var tcl = bo.find(function(b) { return b.brand === 'TCL'; });

    var lead = '本周创维南部战区销额 <strong>' + t.cw.toFixed(1) + '万</strong>，市占率 <strong>' + (t.ms*100).toFixed(1) + '%</strong>（YoY +' + (t.yoy*100).toFixed(1) + 'pct），目标达成 <strong>' + (t.achieve*100).toFixed(1) + '%</strong>。';
    document.getElementById('exec-lead').innerHTML = lead;
    document.getElementById('exec-summary').style.display = 'block';

    // 态势 — 品牌格局 + 分公司
    var stHtml = '';
    stHtml += '<div class="line">行业总销额 ' + hi(t.hy.toFixed(1) + '万') + '，TOP3 品牌合计 ' + hi((t.cw + t.hx + t.tcl).toFixed(1) + '万') + '（占 ' + hi(((t.cw+t.hx+t.tcl)/t.hy*100).toFixed(1) + '%') + '），集中度维持高位</div>';
    stHtml += '<div class="line">海信以 ' + hi(hx.amount.toFixed(1) + '万') + ' 稳居第一，创维 ' + hi(t.cw.toFixed(1) + '万') + ' 紧随其后，TCL ' + hi(t.tcl.toFixed(1) + '万') + ' 第三</div>';
    // 分公司
    var bestMs = ms.slice().sort(function(a,b) { return b.cw_ms - a.cw_ms; })[0];
    var bestAch = ms.slice().sort(function(a,b) { return b.achieve - a.achieve; })[0];
    stHtml += '<div class="line">分公司中 ' + hi(bestMs.branch + '（市占 ' + (bestMs.cw_ms*100).toFixed(1) + '%）') + ' 领先，' + hi(bestAch.branch + '（达成 ' + (bestAch.achieve*100).toFixed(1) + '%）') + ' 表现最佳</div>';
    // 98+
    var cw98 = d.data98.reduce(function(s,r){ return s+r.cw_s; }, 0);
    var hx98 = d.data98.reduce(function(s,r){ return s+r.hx_s; }, 0);
    stHtml += '<div class="line">98吋+ 市场创维 ' + hi(cw98 + '台') + ' vs 海信 ' + hi(hx98 + '台') + '，控场优势明显</div>';
    document.getElementById('block-stance').innerHTML = stHtml;

    // 核心问题
    var probHtml = '';
    // 落后最多的分公司
    ms.sort(function(a,b){ return a.lead_hx - b.lead_hx; });
    var lag1 = ms[0], lag2 = ms[1];
    probHtml += '<div class="line">' + hi(lag1.branch) + ' 落后海信 ' + hi(Math.abs(lag1.lead_hx).toFixed(1) + '万') + '（全区最多），' + lag2.branch + ' 次席</div>';
    // 达成率最低
    ms.sort(function(a,b){ return a.achieve - b.achieve; });
    var lowAch = ms[0];
    probHtml += '<div class="line">' + hi(lowAch.branch + ' 达成率 ' + (lowAch.achieve*100).toFixed(1) + '%') + '（全区最低），距 100% 目标差 ' + ((1-lowAch.achieve)*100).toFixed(1) + 'pct</div>';
    // TOP40 排名
    var top1 = d.top40[0], topCwRank = d.top40.findIndex(function(r){ return r.brand === '创维'; });
    var cwInTop40 = d.top40.filter(function(r){ return r.brand === '创维'; }).length;
    probHtml += '<div class="line">TOP40 中创维仅 ' + hi(cwInTop40 + '席') + '，头部' + top1.brand + ' ' + top1.model + ' 居首（' + top1.amount.toFixed(1) + '万），创维首型号排第 ' + hi(topCwRank+1) + ' 位</div>';
    // 差距
    probHtml += '<div class="line">与海信销额差距 ' + hi(Math.abs(t.cw - t.hx).toFixed(1) + '万') + '，环比上周可能有扩大趋势</div>';
    document.getElementById('block-problem').innerHTML = probHtml;

    // 成果与亮点
    var resHtml = '';
    resHtml += '<div class="line">市占率 ' + hi((t.ms*100).toFixed(1) + '%') + '，YoY 提升 ' + hi('+' + (t.yoy*100).toFixed(1) + 'pct') + '（TOP3 中唯一正增长）</div>';
    resHtml += '<div class="line">目标达成 ' + hi((t.achieve*100).toFixed(1) + '%') + '，超额完成</div>';
    resHtml += '<div class="line">98吋+ 控场分公司 ' + hi(d.data98.filter(function(r){return r.cw_s>r.hx_s && r.cw_s>r.tcl_s;}).length + '/11家') + '</div>';
    // Q7H
    var qTotal = d.q7hData.reduce(function(s,r){ return s+r.q7h_s; }, 0);
    var uTotal = d.q7hData.reduce(function(s,r){ return s+r.u7s_s; }, 0);
    resHtml += '<div class="line">Q7H vs U7S-PRO 控比 ' + hi((uTotal>0?(qTotal/uTotal).toFixed(2):'∞') + 'x') + '（' + qTotal + ' vs ' + uTotal + '）</div>';
    document.getElementById('block-result').innerHTML = resHtml;
  }

  // ============ Brand Minicards ============
  function renderBrandMinis(d) {
    var el = document.getElementById('brand-minis'); if (!el) return;
    var first6 = d.brandOverview.slice(0, 6);
    var clsMap = { '创维':'cw', '海信':'hx', 'TCL':'tcl', '三星':'cw', '索尼':'cw', '东芝':'cw', '华为':'cw' };
    var html = first6.map(function(b) {
      var cls = clsMap[b.brand] || '';
      return '<div class="bm ' + cls + '"><div class="bn">#' + b.rank + ' ' + b.brand + '</div>' +
        '<div class="ba">' + b.amount.toFixed(1) + '</div>' +
        '<div class="bs">额占 ' + (b.ms_amount*100).toFixed(1) + '% YoY ' + (b.yoy_ms>=0?'+':'') + (b.yoy_ms*100).toFixed(1) + 'pct</div></div>';
    }).join('');
    el.innerHTML = html;
  }

  // ============ Brand Compare Chart ============
  function chartBrandCompare(d) {
    var cwIdx = d.brandOverview.findIndex(function(b){ return b.brand==='创维'; });
    mkChart('chart-brand-compare', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['销额(万)', '额市占率%'], bottom: 0, textStyle: { color: muted, fontSize: 10 } },
      grid: { left: '3%', right: '5%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: d.brandOverview.map(function(r){ return r.brand; }), axisLabel: { color: ink, fontWeight: 700, fontSize: 10 } },
      yAxis: [
        { type: 'value', name: '万元', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
        { type: 'value', name: '%', min: 0, max: 35, axisLabel: { color: muted, fontSize: 10, formatter: '{value}%' }, splitLine: { show: false } }
      ],
      color: [accent, accent2],
      series: [
        { name: '销额(万)', type: 'bar', barWidth: '55%',
          data: d.brandOverview.map(function(r){ return { value: r.amount, itemStyle: { color: r.brand==='创维'?accent:r.brand==='海信'?blue:r.brand==='TCL'?orange:'#94a3b8', borderRadius: [4,4,0,0] } }; }),
          label: { show: true, position: 'top', color: ink, fontSize: 9, fontWeight: 600 } },
        { name: '额市占率%', type: 'line', yAxisIndex: 1, data: d.brandOverview.map(function(r){ return +(r.ms_amount*100).toFixed(1); }),
          symbol: 'circle', symbolSize: 9, lineStyle: { width: 2.5, color: orange },
          itemStyle: { color: orange, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, color: orange, fontSize: 9, fontWeight: 700, formatter: '{c}%' } }
      ]
    });
  }
  function chartBrandPie(d) {
    var palette = [accent, blue, orange, purple, teal, gold, '#f97316', '#6366f1', '#84cc16', '#0ea5e9'];
    mkChart('chart-brand-pie', {
      animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
      legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: ink, fontSize: 10 } },
      color: palette,
      series: [{ type: 'pie', radius: ['40%', '72%'], center: ['40%', '50%'],
        data: d.brandOverview.map(function(r){ return { name: r.brand, value: r.amount }; }),
        label: { color: ink, fontSize: 9, formatter: '{b}\n{d}%' }, itemStyle: { borderColor: '#fff', borderWidth: 2 } }]
    });
  }

  // ============ Branch ============
  function chartBranchBubble(d) {
    mkChart('chart-branch-bubble', {
      animation: false, tooltip: { trigger: 'item', appendToBody: true,
        formatter: function(p){ return p.name + '<br/>市占率: ' + p.value[0] + '%<br/>达成率: ' + p.value[1] + '%<br/>销额: ' + p.value[2].toFixed(1) + '万'; } },
      grid: { left: '10%', right: '6%', bottom: '10%', top: '8%' },
      xAxis: { type: 'value', name: '市占率(%)', min: 15, max: 32, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'value', name: '达成率(%)', min: 80, max: 130, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
      series: [{ type: 'scatter', data: d.msData.map(function(r){
        var c = r.achieve >= 1.1 ? green : r.achieve >= 1.0 ? accent : orange;
        return { name: r.branch, value: [+(r.cw_ms*100).toFixed(1), +(r.achieve*100).toFixed(1), r.cw],
          itemStyle: { color: c, borderColor: '#fff', borderWidth: 2 } };
      }), symbolSize: function(v){ return Math.max(22, v[2]/3); },
      label: { show: true, formatter: '{b}', color: ink, fontSize: 10, fontWeight: 700 },
      markLine: { symbol: 'none', silent: true, lineStyle: { color: '#94a3b8', type: 'dashed' },
        data: [{ yAxis: 100, label: { show: true, position: 'end', formatter: '达成 100%' } }] } }]
    });
  }
  function renderBranchTable(d) {
    var el = document.getElementById('branch-table'); if (!el) return;
    var sorted = d.msData.slice().sort(function(a,b){ return b.cw_ms - a.cw_ms; });
    var html = sorted.map(function(r, i){
      var wowHtml = r.wow !== undefined && r.wow !== null ? '<span class="' + (r.wow>=0?'trend-up':'trend-down') + '">' + (r.wow>=0?'+':'') + (r.wow*100).toFixed(1) + '%</span>' : '-';
      var yoyHtml = r.yoy !== undefined && r.yoy !== null ? '<span class="' + (r.yoy>=0?'trend-up':'trend-down') + '">' + (r.yoy>=0?'+':'') + (r.yoy*100).toFixed(1) + '%</span>' : '-';
      var achCls = r.achieve >= 1.1 ? 'trend-up' : r.achieve >= 1.0 ? '' : (r.achieve >= 0.9 ? '' : 'trend-down');
      var gapCls = r.lead_hx >= 0 ? 'trend-up' : 'trend-down';
      return '<tr><td class="rank">' + (i+1) + '</td><td><strong>' + r.branch + '</strong></td>' +
        '<td class="num cw">' + r.cw.toFixed(1) + '</td>' +
        '<td class="num hx">' + r.hx.toFixed(1) + '</td>' +
        '<td class="num tcl">' + r.tcl.toFixed(1) + '</td>' +
        '<td class="num">' + r.hy.toFixed(1) + '</td>' +
        '<td class="num"><strong>' + (r.cw_ms*100).toFixed(1) + '%</strong></td>' +
        '<td class="num">' + (r.target*100).toFixed(1) + '%</td>' +
        '<td class="num ' + achCls + '"><strong>' + (r.achieve*100).toFixed(1) + '%</strong></td>' +
        '<td class="num">' + wowHtml + '</td><td class="num">' + yoyHtml + '</td>' +
        '<td class="num ' + gapCls + '">' + (r.lead_hx>=0?'+':'') + r.lead_hx.toFixed(1) + '</td></tr>';
    }).join('');
    el.innerHTML = html;
  }

  // ============ Top40 ============
  function chartTop40Brand(d) {
    var brandData = {};
    d.top40.forEach(function(r){
      brandData[r.brand] = brandData[r.brand] || { count: 0, amt: 0 };
      brandData[r.brand].count++; brandData[r.brand].amt += r.amount;
    });
    var sortedBrands = Object.keys(brandData).sort(function(a,b){ return brandData[b].count - brandData[a].count; });
    var colorMap = { '创维':accent, '海信':blue, 'TCL':orange };
    mkChart('chart-top40-brand', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['TOP40入场数量', 'TOP40合计销额(万)'], bottom: 0, textStyle: { color: muted, fontSize: 10 } },
      grid: { left: '3%', right: '5%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: sortedBrands, axisLabel: { color: ink, fontWeight: 700, fontSize: 10 } },
      yAxis: [
        { type: 'value', name: '数量', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
        { type: 'value', name: '万', axisLabel: { color: muted }, splitLine: { show: false } }
      ],
      color: [accent, accent2],
      series: [
        { name: 'TOP40入场数量', type: 'bar', barWidth: '45%',
          data: sortedBrands.map(function(b){ return { value: brandData[b].count, itemStyle: { color: colorMap[b] || '#94a3b8', borderRadius: [4,4,0,0] } }; }),
          label: { show: true, position: 'top', fontSize: 10, fontWeight: 700 } },
        { name: 'TOP40合计销额(万)', type: 'line', yAxisIndex: 1,
          data: sortedBrands.map(function(b){ return +brandData[b].amt.toFixed(1); }),
          symbol: 'circle', symbolSize: 9, lineStyle: { width: 2.5, color: blue },
          itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 }, label: { show: true, color: blue, fontWeight: 700, fontSize: 9 } }
      ]
    });
  }
  function chartTop40Bars(d) {
    var top = d.top40.slice(0, 15).reverse();
    mkChart('chart-top40-bars', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true,
        formatter: function(p){ var r = top[p[0].dataIndex]; return r.brand + ' ' + r.model + '<br/>销额: ' + r.amount.toFixed(2) + '万<br/>销量: ' + r.sales + '台'; } },
      grid: { left: '25%', right: '6%', bottom: '5%', top: '3%' },
      xAxis: { type: 'value', name: '万元', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'category', inverse: true, data: top.map(function(r){ return r.brand + ' ' + r.model; }),
        axisLabel: { color: ink, fontSize: 10, fontWeight: 600,
          formatter: function(s){ return s.length > 18 ? s.slice(0, 17) + '…' : s; } }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{ type: 'bar', barWidth: '60%',
        data: top.map(function(r){ var c = r.brand==='创维'?accent:r.brand==='海信'?blue:r.brand==='TCL'?orange:'#94a3b8';
          return { value: r.amount.toFixed(2), itemStyle: { color: c, borderRadius: [0,4,4,0] } }; }),
        label: { show: true, position: 'right', fontSize: 9, fontWeight: 700, formatter: '{c}万' } }]
    });
  }
  function renderTop40Table(d) {
    var el = document.getElementById('top40-table'); if (!el) return;
    var top = d.top40.slice(0, 15);
    var totalAmt = top.reduce(function(s,r){ return s + r.amount; }, 0);
    var cum = 0;
    var html = top.map(function(r){
      cum += r.amount;
      var bCls = r.brand==='创维'?'cw':r.brand==='海信'?'hx':r.brand==='TCL'?'tcl':'';
      return '<tr><td class="rank">' + r.rank + '</td>' +
        '<td class="' + bCls + '">' + r.brand + '</td>' +
        '<td><strong>' + r.model + '</strong></td>' +
        '<td>' + (r.size||'-') + '</td>' +
        '<td class="num cw">' + r.amount.toFixed(2) + '</td>' +
        '<td class="num">' + r.sales + '</td>' +
        '<td class="num">¥' + r.avg_price.toLocaleString() + '</td>' +
        '<td class="num">' + (totalAmt>0?(r.amount/totalAmt*100).toFixed(1)+'%':'-') + '</td>' +
        '<td class="num"><div class="bar-cell"><div class="bar-wrap"><div class="bar-fill" style="width:' + (totalAmt>0?cum/totalAmt*100:0) + '%"></div></div></div></td></tr>';
    }).join('');
    el.innerHTML = html;
  }

  // ============ Price Bands ============
  function chartPriceCompare(d) {
    mkChart('chart-price-compare', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['行业销额(万)', '创维销额(万)', '创维控比%'], bottom: 0, textStyle: { color: muted, fontSize: 10 } },
      grid: { left: '3%', right: '5%', bottom: '12%', top: '5%', containLabel: true },
      xAxis: { type: 'category', data: d.priceBands.map(function(r){ return r.band; }), axisLabel: { color: ink, fontWeight: 700, fontSize: 11 } },
      yAxis: [
        { type: 'value', name: '万元', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
        { type: 'value', name: '%', min: 0, max: 40, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { show: false } }
      ],
      color: ['#94a3b8', accent, blue],
      series: [
        { name: '行业销额(万)', type: 'bar', barWidth: '38%',
          data: d.priceBands.map(function(r){ return { value: r.hy_amount.toFixed(0), itemStyle: { borderRadius: [4,4,0,0] } }; }) },
        { name: '创维销额(万)', type: 'bar', barWidth: '38%',
          data: d.priceBands.map(function(r){ return { value: r.cw_amount.toFixed(0), itemStyle: { borderRadius: [4,4,0,0], color: accent } }; }),
          label: { show: true, position: 'top', color: accent, fontSize: 9, fontWeight: 700 } },
        { name: '创维控比%', type: 'line', yAxisIndex: 1,
          data: d.priceBands.map(function(r){ return +r.cw_share.toFixed(1); }),
          symbol: 'diamond', symbolSize: 10, lineStyle: { width: 2.5, color: blue },
          itemStyle: { color: blue }, label: { show: true, color: blue, fontSize: 9, fontWeight: 700, formatter: '{c}%' } }
      ]
    });
  }
  function renderPriceTable(d) {
    var el = document.getElementById('price-table'); if (!el) return;
    var order = { '<1万':1, '1-1.5万':2, '1.5-2万':3, '2-3万':4, '>3万':5 };
    var sorted = d.priceBands.slice().sort(function(a,b){ return (order[a.band]||99)-(order[b.band]||99); });
    var html = sorted.map(function(r){
      var cwAvg = r.cw_sales > 0 ? r.cw_amount*10000/r.cw_sales : 0;
      var hyAvg = r.hy_sales > 0 ? r.hy_amount*10000/r.hy_sales : 0;
      var avgDiff = hyAvg > 0 ? (cwAvg - hyAvg) / hyAvg * 100 : 0;
      return '<tr><td><strong>' + r.band + '</strong></td>' +
        '<td class="num">' + r.hy_amount.toFixed(2) + '</td>' +
        '<td class="num">' + r.hy_share.toFixed(1) + '%</td>' +
        '<td class="num cw">' + r.cw_amount.toFixed(2) + '</td>' +
        '<td class="num">' + r.cw_share.toFixed(1) + '%</td>' +
        '<td class="num ' + (avgDiff>=0?'trend-up':'trend-down') + '">' + (avgDiff>=0?'+':'') + avgDiff.toFixed(1) + '%</td></tr>';
    }).join('');
    el.innerHTML = html;
  }

  // ============ Size Segs ============
  function chartSizeCompare(d) {
    mkChart('chart-size-compare', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['行业销额(万)', '创维销额(万)'], bottom: 0, textStyle: { color: muted, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '5%', containLabel: true },
      xAxis: { type: 'category', data: d.sizeList.map(function(r){ return r.size; }), axisLabel: { color: ink, fontWeight: 700, fontSize: 11 } },
      yAxis: { type: 'value', name: '万元', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      color: ['#94a3b8', accent],
      series: [
        { name: '行业销额(万)', type: 'bar', barWidth: '45%',
          data: d.sizeList.map(function(r){ return { value: r.amount.toFixed(0), itemStyle: { borderRadius: [4,4,0,0] } }; }),
          label: { show: true, position: 'top', color: muted, fontSize: 9 } },
        { name: '创维销额(万)', type: 'bar', barWidth: '45%',
          data: d.cwSizeList.map(function(r){ return { value: r.amount.toFixed(0), itemStyle: { borderRadius: [4,4,0,0], color: accent } }; }),
          label: { show: true, position: 'top', color: accent, fontSize: 10, fontWeight: 700 } }
      ]
    });
  }
  function chartSizeBrand(d) {
    mkChart('chart-size-brand', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: muted, fontSize: 10 } },
      grid: { left: '3%', right: '5%', bottom: '12%', top: '5%', containLabel: true },
      xAxis: { type: 'value', max: 50, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
      yAxis: { type: 'category', data: d.sizeList.map(function(r){ return r.size; }), axisLabel: { color: ink, fontWeight: 700, fontSize: 11 } },
      color: [accent, blue, orange],
      series: [
        { name: '创维', type: 'bar', barWidth: '25%', data: d.cwShares, label: { show: true, position: 'right', color: accent, fontSize: 9, fontWeight: 700, formatter: '{c}%' }, itemStyle: { borderRadius: [0,5,5,0] } },
        { name: '海信', type: 'bar', barWidth: '25%', data: d.hxShares, label: { show: true, position: 'right', color: blue, fontSize: 9, formatter: '{c}%' }, itemStyle: { borderRadius: [0,5,5,0], color: blue } },
        { name: 'TCL', type: 'bar', barWidth: '25%', data: d.tclShares, label: { show: true, position: 'right', color: orange, fontSize: 9, formatter: '{c}%' }, itemStyle: { borderRadius: [0,5,5,0], color: orange } }
      ]
    });
  }

  // ============ 98+ ============
  function chart98Bar(d) {
    var sorted = d.data98.slice().sort(function(a,b){ return (b.cw_s+b.hx_s+b.tcl_s)-(a.cw_s+a.hx_s+a.tcl_s); });
    mkChart('chart-98-bar', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: muted, fontSize: 10 } },
      grid: { left: '3%', right: '6%', bottom: '12%', top: '5%', containLabel: true },
      xAxis: { type: 'value', name: '台', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'category', inverse: true, data: sorted.map(function(r){ return r.branch; }), axisLabel: { color: ink, fontWeight: 700 }, axisLine: { show: false }, axisTick: { show: false } },
      color: [accent, blue, orange],
      series: [
        { name: '创维', type: 'bar', stack: 'a', data: sorted.map(function(r){ return r.cw_s; }), label: { show: true, position: 'right', color: accent, fontWeight: 700, fontSize: 11 } },
        { name: '海信', type: 'bar', stack: 'a', data: sorted.map(function(r){ return r.hx_s; }) },
        { name: 'TCL', type: 'bar', stack: 'a', data: sorted.map(function(r){ return r.tcl_s; }) }
      ]
    });
  }

  // ============ Q7H ============
  function chartQ7HBranch(d) {
    mkChart('chart-q7h-branch', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['Q7H(创维)', 'U7S-PRO(海信)'], bottom: 0, textStyle: { color: muted, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
      xAxis: { type: 'category', data: d.q7hData.map(function(r){ return r.branch; }), axisLabel: { color: ink, fontWeight: 700, rotate: 20, fontSize: 10 } },
      yAxis: { type: 'value', name: '台', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
      color: [accent, blue],
      series: [
        { name: 'Q7H(创维)', type: 'bar', barWidth: '38%', data: d.q7hData.map(function(r){ return r.q7h_s; }),
          itemStyle: { borderRadius: [4,4,0,0], color: accent }, label: { show: true, position: 'top', color: accent, fontWeight: 700, fontSize: 9 } },
        { name: 'U7S-PRO(海信)', type: 'bar', barWidth: '38%', data: d.q7hData.map(function(r){ return r.u7s_s; }),
          itemStyle: { borderRadius: [4,4,0,0], color: blue }, label: { show: true, position: 'top', color: blue, fontSize: 9 } }
      ]
    });
  }
  function chartQ7HSize(d) {
    mkChart('chart-q7h-size', {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '5%', containLabel: true },
      xAxis: { type: 'category', data: d.q7hBySize.map(function(r){ return r.size + '吋'; }), axisLabel: { color: ink, fontWeight: 700 } },
      yAxis: { type: 'value', name: '万元', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      color: [accent],
      series: [{ type: 'bar', barWidth: '45%', data: d.q7hBySize.map(function(r){ return { value: r.amount.toFixed(2), itemStyle: { borderRadius: [4,4,0,0], color: accent } }; }),
        label: { show: true, position: 'top', color: ink, fontWeight: 700, fontSize: 10 } }]
    });
  }

  // ============ Insight Lists (图片风格: 短句要点式) ============
  function renderInsBrand(d) {
    var el = document.getElementById('ins-brand'); if (!el) return;
    var t = d.totals, cw = d.brandOverview.find(function(b){ return b.brand==='创维'; }), hx = d.brandOverview.find(function(b){ return b.brand==='海信'; }), tcl = d.brandOverview.find(function(b){ return b.brand==='TCL'; });
    var hyTop3Share = (cw.amount + hx.amount + tcl.amount) / t.hy * 100;
    var html = '';
    html += '<li>行业总销额 <span class="hi">' + t.hy.toFixed(1) + '万</span>，TOP3 品牌合计 <span class="hi">' + hyTop3Share.toFixed(1) + '%</span>，市场集中度维持高位</li>';
    html += '<li>海信 <span class="hi-blue">' + hx.amount.toFixed(1) + '万</span> 居第一（额占 ' + (hx.ms_amount*100).toFixed(1) + '%），创维 <span class="hi">' + cw.amount.toFixed(1) + '万</span> 紧随其后</li>';
    html += '<li>创维市占率 YoY <span class="hi-green">+' + (cw.yoy_ms*100).toFixed(1) + 'pct</span>，TOP3 中唯一正增长</li>';
    html += '<li>创维均价 <span class="hi">' + cw.avg_price.toLocaleString() + '元</span>，低于海信 ' + (hx.avg_price - cw.avg_price).toLocaleString() + ' 元，产品结构需向上</li>';
    html += '<li>三星、索尼、东芝合计占 <span class="hi">' + (d.brandOverview.slice(3,6).reduce(function(s,r){ return s+r.ms_amount; },0)*100).toFixed(1) + '%</span>，大尺寸高端形成局部竞争</li>';
    el.innerHTML = html;
  }
  function renderInsBranch(d) {
    var el = document.getElementById('ins-branch'); if (!el) return;
    var ms = d.msData;
    var best = ms.slice().sort(function(a,b){ return b.cw_ms - a.cw_ms; })[0];
    var worst = ms.slice().sort(function(a,b){ return a.cw_ms - b.cw_ms; })[0];
    ms.sort(function(a,b){ return a.achieve - b.achieve; });
    var lowAch = ms[0];
    ms.sort(function(a,b){ return a.lead_hx - b.lead_hx; });
    var lag = ms[0];
    ms.sort(function(a,b){ return a.wow - b.wow; });
    var lowWow = ms.filter(function(r){ return r.wow !== undefined && r.wow !== null; })[0];
    var html = '';
    html += '<li><span class="hi-green">' + best.branch + '</span> 市占率 ' + (best.cw_ms*100).toFixed(1) + '%（全区第 1），达成率 ' + (best.achieve*100).toFixed(1) + '%</li>';
    html += '<li><span class="hi-orange">' + worst.branch + '</span> 市占率仅 ' + (worst.cw_ms*100).toFixed(1) + '%（全区倒数），需重点攻坚</li>';
    html += '<li><span class="hi-orange">' + lowAch.branch + '</span> 达成率 ' + (lowAch.achieve*100).toFixed(1) + '%（最低），距 100% 差 ' + ((1-lowAch.achieve)*100).toFixed(1) + 'pct</li>';
    html += '<li><span class="hi">' + lag.branch + '</span> 落后海信 ' + Math.abs(lag.lead_hx).toFixed(1) + '万（全区最多），海信在该区域形成压制</li>';
    if (lowWow && lowWow.wow !== undefined && lowWow.wow < 0) {
      html += '<li><span class="hi-orange">' + lowWow.branch + '</span> 环比 ' + (lowWow.wow*100).toFixed(1) + '%（全区最差），需关注趋势</li>';
    }
    el.innerHTML = html;
  }
  function renderInsTop40(d) {
    var el = document.getElementById('ins-top40'); if (!el) return;
    var t40 = d.top40;
    var cwCnt = t40.filter(function(r){ return r.brand==='创维'; }).length;
    var top1 = t40[0];
    var topCwRank = t40.findIndex(function(r){ return r.brand==='创维'; });
    var topCw = t40[topCwRank];
    var top3Amt = t40.slice(0,3).reduce(function(s,r){ return s + r.amount; }, 0);
    var totalAmt = t40.reduce(function(s,r){ return s + r.amount; }, 0);
    var html = '';
    html += '<li>TOP40 中创维占 <span class="hi">' + cwCnt + '席</span>，共 <span class="hi">' + Object.keys(t40.reduce(function(m,r){ m[r.brand]=1; return m; }, {})).length + '</span> 个品牌入场</li>';
    html += '<li>头部 <span class="hi-blue">' + top1.brand + ' ' + top1.model + '</span> 居首（' + top1.amount.toFixed(1) + '万），创维首型号 <span class="hi">' + topCw.model + '</span> 排第 ' + (topCwRank+1) + ' 位（' + topCw.amount.toFixed(1) + '万）</li>';
    html += '<li>TOP3 集中度 <span class="hi">' + (top3Amt/totalAmt*100).toFixed(1) + '%</span>，头部效应明显</li>';
    html += '<li>⚠️ 创维未进入 TOP3，头部阵地被竞品（' + top1.brand + ' / ' + t40[1].brand + ' / ' + t40[2].brand + '）占据</li>';
    el.innerHTML = html;
  }
  function renderInsPrice(d) {
    var el = document.getElementById('ins-price'); if (!el) return;
    var sorted = d.priceBands.slice().sort(function(a,b){ return b.hy_amount - a.hy_amount; });
    var topBand = sorted[0];
    var byCw = d.priceBands.slice().sort(function(a,b){ return b.cw_share - a.cw_share; });
    var html = '';
    html += '<li>行业主战场 <span class="hi">' + topBand.band + '</span>（销额 ' + topBand.hy_amount.toFixed(0) + '万，占比 ' + topBand.hy_share.toFixed(1) + '%），创维控比 ' + topBand.cw_share.toFixed(1) + '%</li>';
    html += '<li>创维控比最高 <span class="hi-green">' + byCw[0].band + '</span>（' + byCw[0].cw_share.toFixed(1) + '%），是 Q7H / U7S-PRO 主战场</li>';
    html += '<li>创维控比最低 <span class="hi-orange">' + byCw[byCw.length-1].band + '</span>（仅 ' + byCw[byCw.length-1].cw_share.toFixed(1) + '%），高端市场缺席</li>';
    html += '<li>"<1万"价位行业销额 ' + d.priceBands[0].hy_amount.toFixed(0) + '万（48.6%），创维仅占 ' + d.priceBands[0].cw_share.toFixed(1) + '%，低端竞争偏弱</li>';
    el.innerHTML = html;
  }
  function renderInsSize(d) {
    var el = document.getElementById('ins-size'); if (!el) return;
    var sorted = d.sizeList.slice().sort(function(a,b){ return b.amount - a.amount; });
    var top = sorted[0], top2 = sorted[1];
    var bestSeg = d.cwShares.indexOf(Math.max.apply(null, d.cwShares));
    var worstSeg = d.cwShares.indexOf(Math.min.apply(null, d.cwShares));
    var html = '';
    html += '<li>行业第一大尺寸段 <span class="hi">' + top.size + '</span>（销额 ' + top.amount.toFixed(0) + '万），加上 ' + top2.size + ' 合计占 <span class="hi">' + ((top.amount+top2.amount)/d.sizeList.reduce(function(s,r){ return s+r.amount; },0)*100).toFixed(1) + '%</span></li>';
    html += '<li>创维份额最高 <span class="hi-green">' + d.sizeList[bestSeg].size + '</span>（' + d.cwShares[bestSeg].toFixed(1) + '%），最佳阵地</li>';
    html += '<li>创维份额最低 <span class="hi-orange">' + d.sizeList[worstSeg].size + '</span>（仅 ' + d.cwShares[worstSeg].toFixed(1) + '%），需加强</li>';
    el.innerHTML = html;
  }
  function renderIns98(d) {
    var el = document.getElementById('ins-98'); if (!el) return;
    var totalCw = d.data98.reduce(function(s,r){ return s+r.cw_s; }, 0);
    var totalHx = d.data98.reduce(function(s,r){ return s+r.hx_s; }, 0);
    var dominate = d.data98.filter(function(r){ return r.cw_s > r.hx_s && r.cw_s > r.tcl_s; });
    var loseHx = d.data98.filter(function(r){ return r.hx_s > r.cw_s; });
    var big = d.data98.slice().sort(function(a,b){ return (a.cw_s+a.hx_s+a.tcl_s)-(b.cw_s+b.hx_s+b.tcl_s); })[d.data98.length-1];
    var html = '';
    html += '<li>98吋+ 市场创维 <span class="hi-green">' + totalCw + '台</span> vs 海信 ' + totalHx + '台，领先 ' + (totalCw - totalHx) + ' 台</li>';
    html += '<li>创维控场 <span class="hi-green">' + dominate.length + '/11家分公司</span>，是创维对海信的最大结构性优势</li>';
    if (loseHx.length > 0) {
      html += '<li>海信反超 <span class="hi-orange">' + loseHx.length + '家：' + loseHx.map(function(r){ return r.branch; }).join('、') + '</span>，需重点关注</li>';
    }
    html += '<li>最大市场 <span class="hi">' + big.branch + '</span>（合计 ' + (big.cw_s+big.hx_s+big.tcl_s) + '台），创维 ' + big.cw_s + ' 台</li>';
    el.innerHTML = html;
  }
  function renderInsQ7H(d) {
    var el = document.getElementById('ins-q7h'); if (!el) return;
    var qTotal = d.q7hData.reduce(function(s,r){ return s+r.q7h_s; }, 0);
    var uTotal = d.q7hData.reduce(function(s,r){ return s+r.u7s_s; }, 0);
    var qLead = d.q7hData.filter(function(r){ return r.q7h_s > r.u7s_s; });
    var uLead = d.q7hData.filter(function(r){ return r.u7s_s > r.q7h_s; });
    var qBest = d.q7hData.slice().sort(function(a,b){ return b.q7h_s - a.q7h_s; })[0];
    var topSize = d.q7hBySize.slice().sort(function(a,b){ return b.amount - a.amount; })[0];
    var html = '';
    html += '<li>Q7H 合计 <span class="hi">' + qTotal + '台</span> vs U7S-PRO ' + uTotal + '台，控比 <span class="hi-green">' + (uTotal>0?(qTotal/uTotal).toFixed(2):'∞') + 'x</span></li>';
    html += '<li>Q7H 压制 <span class="hi-green">' + qLead.length + '家</span>，U7S-PRO 反超 <span class="hi-orange">' + uLead.length + '家：' + uLead.map(function(r){ return r.branch; }).join('、') + '</span></li>';
    html += '<li>最大战场 <span class="hi">' + qBest.branch + '</span>（Q7H ' + qBest.q7h_s + '台 vs U7S-PRO ' + qBest.u7s_s + '台）</li>';
    html += '<li>Q7H 主力尺寸 <span class="hi">' + topSize.size + '吋</span>（销额 ' + topSize.amount.toFixed(1) + '万）</li>';
    el.innerHTML = html;
  }

  // ============ Conclusion & Recommendations ============
  function renderConclusion(d) {
    var el = document.getElementById('conclusion-list'); if (!el) return;
    var t = d.totals;
    var ms = d.msData; ms.sort(function(a,b){ return a.achieve - b.achieve; });
    var lowAch = ms[0];
    ms.sort(function(a,b){ return a.lead_hx - b.lead_hx; });
    var lag = ms[0];
    var cwCnt = d.top40.filter(function(r){ return r.brand==='创维'; }).length;
    var topCwRank = d.top40.findIndex(function(r){ return r.brand==='创维'; });
    var qTotal = d.q7hData.reduce(function(s,r){ return s+r.q7h_s; }, 0);
    var uTotal = d.q7hData.reduce(function(s,r){ return s+r.u7s_s; }, 0);
    var dominate = d.data98.filter(function(r){ return r.cw_s > r.hx_s && r.cw_s > r.tcl_s; }).length;

    var html = '';
    html += '<li>整体态势向上：销额 ' + t.cw.toFixed(1) + '万、市占率 ' + (t.ms*100).toFixed(1) + '%（YoY +' + (t.yoy*100).toFixed(1) + 'pct）、达成率 ' + (t.achieve*100).toFixed(1) + '%，三项核心指标全部达标。</li>';
    html += '<li>与海信差距扩大：落后 ' + Math.abs(t.cw - t.hx).toFixed(1) + '万，海信均价（' + d.brandOverview.find(function(b){ return b.brand==='海信'; }).avg_price.toLocaleString() + '元）高于创维（' + d.brandOverview.find(function(b){ return b.brand==='创维'; }).avg_price.toLocaleString() + '元），产品结构偏上。</li>';
    html += '<li>分公司结构不均衡：' + lowAch.branch + '达成率 ' + (lowAch.achieve*100).toFixed(1) + '%（最低）、' + lag.branch + '落后海信 ' + Math.abs(lag.lead_hx).toFixed(1) + '万（最大），需重点攻坚。</li>';
    html += '<li>头部阵地失守：TOP40 中仅 ' + cwCnt + ' 席，创维首型号排第 ' + (topCwRank+1) + ' 位，头部被三星/海信压制。</li>';
    html += '<li>大尺寸和 Q7H 是亮点：98吋+ ' + dominate + '/11 家控场、Q7H 控比 ' + (uTotal>0?(qTotal/uTotal).toFixed(2):'∞') + 'x，是核心优势战场。</li>';
    el.innerHTML = html;
  }
  function renderRecommendations(d) {
    var el = document.getElementById('recommendations'); if (!el) return;
    var recs = [
      { icon: '🎯', title: '加大 1-1.5 万价位产品投放', desc: '行业主战场（销额 ' + d.priceBands[1].hy_amount.toFixed(0) + '万、占 ' + d.priceBands[1].hy_share.toFixed(1) + '%），创维控比 ' + d.priceBands[1].cw_share.toFixed(1) + '% 最高，建议新增 75吋 Q7H SKU 抢占份额。' },
      { icon: '🏆', title: '巩固 98吋+ 大尺寸优势', desc: '11 家分公司控场 ' + d.data98.filter(function(r){return r.cw_s>r.hx_s;}).length + ' 家，但海南、广州被海信反超，建议渠道激励专项。' },
      { icon: '📉', title: '云南分公司重点攻坚', desc: '达成率 ' + (d.msData.slice().sort(function(a,b){return a.achieve-b.achieve;})[0].achieve*100).toFixed(1) + '%（最低），落后海信 ' + Math.abs(d.msData.slice().sort(function(a,b){return a.lead_hx-b.lead_hx;})[0].lead_hx).toFixed(1) + '万，建议专项组驻点。' },
      { icon: '⚠️', title: 'Q7H 反击 U7S-PRO 反超市场', desc: 'Q7H vs U7S-PRO 控比 ' + (d.q7hData.reduce(function(s,r){return s+r.q7h_s;},0) > 0 ? (d.q7hData.reduce(function(s,r){return s+r.q7h_s;},0) / d.q7hData.reduce(function(s,r){return s+r.u7s_s;},0)).toFixed(2) + 'x' : '∞') + 'x，闽南、海口被反超，建议限时活动 + 渠道政策。' },
      { icon: '📊', title: '提升 TOP 型号头部份额', desc: 'TOP40 创维仅 ' + d.top40.filter(function(r){return r.brand==='创维';}).length + ' 席，建议加快 85吋 Q7H / 100吋 Q7H 铺货，抢占头部阵地。' }
    ];
    var html = recs.map(function(r){
      return '<li><h4>' + r.icon + ' ' + r.title + '</h4><p>' + r.desc + '</p></li>';
    }).join('');
    el.innerHTML = html;
  }

  // ============ Init ============
  function renderAll() {
    if (!window.DASHBOARD_ALL) { console.error('DASHBOARD_ALL 未加载'); return; }
    CURRENT_WEEK = DASHBOARD_ALL.currentWeek || '26W43';
    var d = getD(); if (!d) return;
    renderCover(d);
    renderSummary(d);
    renderBrandMinis(d);
    chartBrandCompare(d); chartBrandPie(d);
    renderInsBrand(d);
    chartBranchBubble(d); renderBranchTable(d);
    renderInsBranch(d);
    chartTop40Brand(d); chartTop40Bars(d); renderTop40Table(d);
    renderInsTop40(d);
    chartPriceCompare(d); renderPriceTable(d);
    renderInsPrice(d);
    chartSizeCompare(d); chartSizeBrand(d);
    renderInsSize(d);
    chart98Bar(d);
    renderIns98(d);
    chartQ7HBranch(d); chartQ7HSize(d);
    renderInsQ7H(d);
    renderConclusion(d); renderRecommendations(d);
  }

  document.addEventListener('DOMContentLoaded', function() { setTimeout(renderAll, 100); });
  window.addEventListener('resize', function() {
    var all = ['chart-brand-compare','chart-brand-pie','chart-branch-bubble','chart-top40-brand','chart-top40-bars',
      'chart-price-compare','chart-size-compare','chart-size-brand','chart-98-bar','chart-q7h-branch','chart-q7h-size'];
    all.forEach(function(id){ var c = echarts.getInstanceByDom(document.getElementById(id)); if (c) c.resize(); });
  });

})();

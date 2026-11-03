/* 创维电视周报 · 渲染逻辑 */
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
  var currentKey = '26W43';
  var currentBranch = '南部全部';
  var top40ViewMode = 'amount';

  // Week date ranges
  var WEEK_START = new Date(2025, 11, 29);
  function getWeekDate(weekStr) {
    var num = parseInt(weekStr.replace('26W', ''));
    var d = new Date(WEEK_START);
    d.setDate(d.getDate() + (num - 1) * 7);
    var end = new Date(d);
    end.setDate(end.getDate() + 6);
    var fmt = function(dt) { return (dt.getMonth()+1).toString().padStart(2,'0') + '.' + dt.getDate().toString().padStart(2,'0'); };
    return fmt(d) + ' - ' + fmt(end);
  }
  var MONTH_DATES = { '1月':'01.01 - 01.31','2月':'02.01 - 02.28','3月':'03.01 - 03.31','4月':'04.01 - 04.30',
    '5月':'05.01 - 05.31','6月':'06.01 - 06.28','7月':'06.29 - 08.02','8月':'08.03 - 08.30','9月':'08.31 - 10.04','10月':'10.05 - 10.25' };

  function getData() {
    if (!window.DASHBOARD_ALL) return null;
    if (currentMode === 'weekly') {
      if (currentBranch === '南部全部') return DASHBOARD_ALL.data[currentKey];
      var bw = DASHBOARD_ALL.branchData[currentKey]; return bw ? bw[currentBranch] : null;
    } else {
      if (currentBranch === '南部全部') return DASHBOARD_ALL.monthly[currentKey];
      var bm = DASHBOARD_ALL.branchMonthly[currentKey]; return bm ? bm[currentBranch] : null;
    }
  }
  // getAllData 保持原样：返回战区数据（给 renderBranch/renderInsBranch 用，它们需要 msData 全部分公司列表）
  function getAllData() {
    if (!window.DASHBOARD_ALL) return null;
    return currentMode === 'weekly' ? DASHBOARD_ALL.data[currentKey] : DASHBOARD_ALL.monthly[currentKey];
  }

  function disposeCharts() { allCharts.forEach(function(c) { c.dispose(); }); allCharts = []; }
  function mkChart(el, opt) { var c = echarts.init(el, null, { renderer: 'svg' }); c.setOption(opt); allCharts.push(c); return c; }

  /* ========== 头部 ========== */
  function updateHeader() {
    var hw = document.getElementById('header-week'); if (hw) hw.textContent = currentKey;
    var hd = document.getElementById('header-date'); if (hd) hd.textContent = currentMode === 'weekly' ? getWeekDate(currentKey) : (MONTH_DATES[currentKey] || '');
    var hy = document.getElementById('header-yoy-ref'); if (hy) hy.textContent = currentMode === 'weekly' ? currentKey.replace('26W','25W') : '月度累计';
    var fw = document.getElementById('footer-week'); if (fw) fw.textContent = currentKey;
    var badges = document.querySelectorAll('.section-header .badge');
    var label = currentBranch === '南部全部' ? '南部战区' : currentBranch;
    badges.forEach(function(b) { if (b.textContent.indexOf('26W') === -1 && b.textContent.indexOf('月') === -1) { /* keep static badges */ } });
  }

  /* ========== KPI ========== */
  function renderKPIs(d) {
    if (!d || !d.totals) return;
    var t = d.totals;
    document.getElementById('kpi-cw').innerHTML = t.cw.toFixed(1) + '<span class="delta down">万</span>';
    document.getElementById('kpi-hy').textContent = t.hy.toFixed(1) + '万';
    if (t.ms !== undefined) document.getElementById('kpi-ms').textContent = (t.ms*100).toFixed(1) + '%';
    if (t.ms_25 !== undefined) document.getElementById('kpi-ms-25').textContent = (t.ms_25*100).toFixed(1) + '%';
    if (t.yoy !== undefined) {
      var yv = (t.yoy*100).toFixed(1);
      document.getElementById('kpi-yoy').innerHTML = (t.yoy >= 0 ? '<span class="delta up">▲ +' : '<span class="delta down">▼ ') + yv + '%</span>';
    }
    if (t.achieve !== undefined) {
      document.getElementById('kpi-achieve').textContent = (t.achieve*100).toFixed(1) + '%';
      var achSub = document.getElementById('kpi-achieve-sub');
      if (achSub) {
        var tp = t.target !== undefined ? (t.target*100).toFixed(1) : '--';
        var status = t.achieve >= 1.0 ? '超额完成' : t.achieve >= 0.9 ? '接近目标' : '未达标';
        achSub.textContent = '目标 ' + tp + '% · ' + status;
      }
    }
    var gap = t.cw - t.hx;
    document.getElementById('kpi-gap').innerHTML = (gap >= 0 ? '+' : '') + gap.toFixed(1) + '<span class="delta down">万</span>';
    document.getElementById('kpi-hx').textContent = t.hx.toFixed(1) + '万';
    document.getElementById('kpi-tcl').textContent = t.tcl.toFixed(1) + '万';
    // 品牌排名
    if (d.brandOverview) {
      var rank = '--';
      d.brandOverview.forEach(function(b) { if (b.brand === '创维') rank = '第' + b.rank; });
      document.getElementById('kpi-rank').textContent = rank;
    }
    // TOP1 型号
    if (d.top40 && d.top40.length > 0) {
      var t1 = d.top40[0];
      document.getElementById('kpi-top1').innerHTML = t1.amount.toFixed(1) + '<span class="delta down">万</span>';
      document.getElementById('kpi-top1-sub').textContent = t1.brand + ' ' + t1.model;
    }
  }

  /* ========== 模块2: 品牌格局 ========== */
  function renderBrand(d) {
    if (!d || !d.brandOverview) return;
    var bo = d.brandOverview;

    // 品牌数字卡（6 个主要品牌）
    var mainBrands = bo.slice(0, 6);
    var cardsHtml = '';
    mainBrands.forEach(function(b) {
      var cls = b.brand === '创维' ? 'cw' : b.brand === '海信' ? 'hx' : b.brand === 'TCL' ? 'tcl' : 'other';
      cardsHtml += '<div class="brand-card ' + cls + '"><div class="bname">' + b.brand + '</div><div class="bamt">' + b.amount.toFixed(1) + '</div><div class="bms">额市占率 ' + (b.ms_amount*100).toFixed(1) + '%</div></div>';
    });
    var bc = document.getElementById('brand-cards'); if (bc) bc.innerHTML = cardsHtml;

    // 条形图
    mkChart(document.getElementById('chart-brand-bar'), {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['销额(万)', '额市占率%'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: bo.map(function(r) { return r.brand; }), axisLabel: { color: muted, fontSize: 11 } },
      yAxis: [{ type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
        { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { show: false } }],
      color: [accent, orange],
      series: [
        { name: '销额(万)', type: 'bar', data: bo.map(function(r) { return r.amount; }), barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0] }, label: { show: true, position: 'top', color: ink, fontSize: 9 } },
        { name: '额市占率%', type: 'line', yAxisIndex: 1, data: bo.map(function(r) { return +(r.ms_amount*100).toFixed(1); }), symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: orange }, itemStyle: { color: orange, borderColor: '#fff', borderWidth: 2 }, label: { show: true, color: orange, fontSize: 9, formatter: '{c}%' } }
      ]
    });

    // 饼图
    mkChart(document.getElementById('chart-brand-pie'), {
      animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
      legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: ink, fontSize: 10 } },
      series: [{ type: 'pie', radius: ['45%', '70%'], center: ['40%', '50%'],
        data: bo.map(function(r) { return { name: r.brand, value: r.amount }; }),
        label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' }, itemStyle: { borderColor: bg2, borderWidth: 2 } }]
    });
  }

  /* ========== 模块3: 分公司 ========== */
  function renderBranch(d) {
    var allData = getAllData(); if (!allData || !allData.msData) return;
    var ms = allData.msData.slice().sort(function(a, b) { return b.cw_ms - a.cw_ms; });

    // 表格
    var html = '';
    ms.forEach(function(r, i) {
      var wowHtml = r.wow !== undefined && r.wow !== null ?
        '<span class="' + (r.wow >= 0 ? 'trend-up' : 'trend-down') + '">' + (r.wow >= 0 ? '+' : '') + (r.wow*100).toFixed(1) + '%</span>' : '-';
      var yoyHtml = r.yoy !== undefined && r.yoy !== null ?
        '<span class="' + (r.yoy >= 0 ? 'trend-up' : 'trend-down') + '">' + (r.yoy >= 0 ? '+' : '') + (r.yoy*100).toFixed(1) + '%</span>' : '-';
      var achTag = r.achieve >= 1.0 ? 'tag-green' : r.achieve >= 0.9 ? 'tag-yellow' : 'tag-red';
      html += '<tr><td class="rank">' + (i+1) + '</td><td><strong>' + r.branch + '</strong></td>';
      html += '<td class="num">' + r.cw.toFixed(2) + '万</td>';
      html += '<td class="num">' + (r.cw_ms*100).toFixed(1) + '%</td>';
      html += '<td class="num">' + (r.target*100).toFixed(1) + '%</td>';
      html += '<td class="num"><span class="tag ' + achTag + '">' + (r.achieve*100).toFixed(1) + '%</span></td>';
      html += '<td class="num">' + wowHtml + '</td><td class="num">' + yoyHtml + '</td>';
      var gapCls = r.lead_hx >= 0 ? 'trend-up' : 'trend-down';
      html += '<td class="num ' + gapCls + '">' + (r.lead_hx >= 0 ? '+' : '') + r.lead_hx.toFixed(1) + '</td></tr>';
    });
    document.getElementById('branch-table-body').innerHTML = html;

    // 分公司对比图（销额柱状 + 市占率折线）
    mkChart(document.getElementById('chart-branch-bar'), {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['创维销额(万)', '市占率%', '达成率%'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: ms.map(function(r) { return r.branch; }), axisLabel: { color: muted, fontSize: 10, rotate: 25 } },
      yAxis: [{ type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
        { type: 'value', name: '%', axisLabel: { color: muted, fontSize: 10 }, splitLine: { show: false } }],
      color: [accent, blue, orange],
      series: [
        { name: '创维销额(万)', type: 'bar', data: ms.map(function(r) { return r.cw.toFixed(1); }), barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0] }, label: { show: true, position: 'top', color: ink, fontSize: 9 } },
        { name: '市占率%', type: 'line', yAxisIndex: 1, data: ms.map(function(r) { return +(r.cw_ms*100).toFixed(1); }), symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: blue }, itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 } },
        { name: '达成率%', type: 'line', yAxisIndex: 1, data: ms.map(function(r) { return +(r.achieve*100).toFixed(1); }), symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: orange }, itemStyle: { color: orange, borderColor: '#fff', borderWidth: 2 } }
      ]
    });
  }

  /* ========== 模块4: TOP40 ========== */
  function renderTop40(d) {
    if (!d || !d.top40) return;
    var t40 = d.top40;
    var totalAmount = t40.reduce(function(s, r) { return s + r.amount; }, 0);
    var totalSales = t40.reduce(function(s, r) { return s + r.sales; }, 0);

    var wowMode = top40ViewMode === 'wow';
    var html = '';
    var cumAmt = 0, cumSales = 0;

    // 如果是环比视图，过滤掉 wow_sales 为 null 的
    var list = wowMode ? t40.filter(function(r) { return r.wow_sales !== null; }) : t40;

    list.forEach(function(r, i) {
      cumAmt += r.amount; cumSales += r.sales;
      var bTag = r.brand === '创维' ? 'tag-red' : r.brand === '海信' ? 'tag-blue' : r.brand === 'TCL' ? 'tag-yellow' : 'tag-gray';
      var cumPct = totalAmount > 0 ? cumAmt / totalAmount * 100 : 0;
      var wowHtml = r.wow_sales !== null && r.wow_sales !== undefined ?
        '<span class="' + (r.wow_sales >= 0 ? 'trend-up' : 'trend-down') + '">' +
        (r.wow_sales >= 0 ? '▲ +' : '▼ ') + (r.wow_sales*100).toFixed(1) + '%</span>' : '<span class="hi-muted">—</span>';

      html += '<tr>';
      html += '<td class="rank">' + (i+1) + '</td>';
      html += '<td><span class="tag ' + bTag + '">' + r.brand + '</span></td>';
      html += '<td><strong>' + r.model + '</strong></td>';
      html += '<td>' + (r.size || '<span class="hi-muted">—</span>') + '</td>';
      html += '<td class="num">' + (r.sales != null ? r.sales : '<span class="hi-muted">—</span>') + '</td>';
      html += '<td class="num">' + (totalSales > 0 ? ((r.sales/totalSales*100).toFixed(1) + '%') : '<span class="hi-muted">—</span>') + '</td>';
      html += '<td class="num"><strong>' + (r.amount != null ? r.amount.toFixed(2) : '<span class="hi-muted">—</span>') + '</strong></td>';
      html += '<td class="num">' + (totalAmount > 0 ? ((r.amount/totalAmount*100).toFixed(1) + '%') : '<span class="hi-muted">—</span>') + '</td>';
      html += '<td class="cum-bar"><div class="cum-fill"><div style="width:' + cumPct + '%"></div></div><span style="font-size:0.72rem;color:var(--muted);margin-left:4px">' + cumPct.toFixed(1) + '%</span></td>';
      html += '<td class="num">' + (r.avg_price != null && r.avg_price > 0 ? '¥' + r.avg_price.toLocaleString() : '<span class="hi-muted">—</span>') + '</td>';
      html += '<td class="num">' + wowHtml + '</td>';
      html += '</tr>';
    });
    document.getElementById('top40-table-body').innerHTML = html;
  }

  /* ========== 模块5: 价格段 ========== */
  function renderPriceBands(d) {
    if (!d || !d.priceBands || d.priceBands.length === 0) return;
    var pb = d.priceBands;

    // 行业饼图
    mkChart(document.getElementById('chart-price-pie-hy'), {
      animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      series: [{ type: 'pie', radius: ['40%', '70%'], data: pb.map(function(r) { return { name: r.band, value: r.hy_amount }; }),
        label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' }, itemStyle: { borderColor: bg2, borderWidth: 2 } }]
    });
    // 创维饼图
    mkChart(document.getElementById('chart-price-pie-cw'), {
      animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      series: [{ type: 'pie', radius: ['40%', '70%'], data: pb.map(function(r) { return { name: r.band, value: r.cw_amount }; }),
        label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' }, itemStyle: { borderColor: bg2, borderWidth: 2 } }]
    });

    // 表格
    var orderO = { '<1万':1, '1-1.5万':2, '1.5-2万':3, '2-3万':4, '>3万':5 };
    pb.sort(function(a, b) { return (orderO[a.band]||99) - (orderO[b.band]||99); });
    var html = '';
    pb.forEach(function(r) {
      var cwAvg = r.cw_sales > 0 ? (r.cw_amount * 10000 / r.cw_sales) : 0;
      var hyAvg = r.hy_sales > 0 ? (r.hy_amount * 10000 / r.hy_sales) : 0;
      var avgDiff = hyAvg > 0 ? ((cwAvg - hyAvg) / hyAvg * 100) : 0;
      html += '<tr><td><strong>' + r.band + '</strong></td>';
      html += '<td class="num">' + r.cw_sales + '</td><td class="num">' + r.cw_amount.toFixed(2) + '</td>';
      html += '<td class="num">' + r.cw_share.toFixed(1) + '%</td>';
      html += '<td class="num">' + r.hy_sales + '</td><td class="num">' + r.hy_amount.toFixed(2) + '</td>';
      html += '<td class="num">' + r.hy_share.toFixed(1) + '%</td>';
      html += '<td class="num ' + (avgDiff >= 0 ? 'trend-up' : 'trend-down') + '">' + (avgDiff >= 0 ? '+' : '') + avgDiff.toFixed(1) + '%</td></tr>';
    });
    document.getElementById('price-table-body').innerHTML = html;
  }

  /* ========== 模块6: 尺寸段 ========== */
  function renderSizeSegs(d) {
    if (!d) return;
    // 🔧 行业饼图也排除"其他"，和创维饼图 segment 对齐
    var hyPieData = (d.sizeList||[]).filter(function(r){return r.size!=='其他'});
    // 行业饼图
    mkChart(document.getElementById('chart-size-pie-hy'), {
      animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      series: [{ type: 'pie', radius: ['40%', '70%'], data: hyPieData.map(function(r) { return { name: r.size, value: r.amount }; }),
        label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' }, itemStyle: { borderColor: bg2, borderWidth: 2 } }]
    });
    // 创维饼图
    mkChart(document.getElementById('chart-size-pie-cw'), {
      animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      series: [{ type: 'pie', radius: ['40%', '70%'], data: (d.cwSizeList||[]).map(function(r) { return { name: r.size, value: r.amount }; }),
        label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' }, itemStyle: { borderColor: bg2, borderWidth: 2 } }]
    });
    // 品牌份额对比
    if (d.sizeSegs && d.cwShares) {
      var segsRev = d.sizeSegs.slice().reverse();
      var cwS = d.cwShares.slice().reverse();
      var hxS = (d.hxShares||[]).slice().reverse();
      var tclS = (d.tclShares||[]).slice().reverse();
      mkChart(document.getElementById('chart-size-brand'), {
        animation: false, tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
        xAxis: { type: 'value', name: '%', max: 50, axisLabel: { color: muted, fontSize: 9, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
        yAxis: { type: 'category', data: segsRev, axisLabel: { color: ink, fontSize: 11, fontWeight: 'bold' }, axisLine: { show: false }, axisTick: { show: false } },
        color: [accent, blue, orange],
        series: [
          { name: '创维', type: 'bar', data: cwS.map(function(v) { return { value: v, itemStyle: { borderRadius: [0,5,5,0], color: accent } }; }), barWidth: '30%', label: { show: true, position: 'right', fontSize: 9, color: accent, fontWeight: 'bold', formatter: '{c}%' } },
          { name: '海信', type: 'bar', data: hxS.map(function(v) { return { value: v, itemStyle: { borderRadius: [0,5,5,0], color: blue } }; }), barWidth: '30%', label: { show: true, position: 'right', fontSize: 9, color: blue, formatter: '{c}%' } },
          { name: 'TCL', type: 'bar', data: tclS.map(function(v) { return { value: v, itemStyle: { borderRadius: [0,5,5,0], color: orange } }; }), barWidth: '30%', label: { show: true, position: 'right', fontSize: 9, color: orange, formatter: '{c}%' } }
        ]
      });
    }

    // 表格（也过滤掉"其他"）
    var html = '';
    (d.sizeList||[]).filter(function(r){return r.size!=='其他'}).forEach(function(r) {
      var cw = (d.cwSizeList||[]).filter(function(c) { return c.size === r.size; })[0];
      var cwSales = cw ? cw.sales : 0;
      var cwAmt = cw ? cw.amount : 0;
      var cwAvg = cw ? cw.avg_price : 0;
      var share = r.amount > 0 ? (cwAmt / r.amount * 100) : 0;
      html += '<tr><td><strong>' + r.size + '</strong></td>';
      html += '<td class="num">' + r.sales + '</td><td class="num">' + r.amount.toFixed(2) + '</td><td class="num">¥' + r.avg_price.toLocaleString() + '</td>';
      html += '<td class="num">' + cwSales + '</td><td class="num">' + cwAmt.toFixed(2) + '</td><td class="num">¥' + cwAvg.toLocaleString() + '</td>';
      html += '<td class="num" style="color:var(--accent);font-weight:700">' + share.toFixed(1) + '%</td></tr>';
    });
    document.getElementById('size-table-body').innerHTML = html;
  }

  /* ========== 模块7: 98吋+ ========== */
  function renderSize98(d) {
    if (!d || !d.data98) return;

    mkChart(document.getElementById('chart-98-bar'), {
      animation: false, tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      grid: { left: '3%', right: '10%', bottom: '12%', top: '5%', containLabel: true },
      xAxis: { type: 'value', name: '台', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
      yAxis: { type: 'category', data: d.data98.map(function(r) { return r.branch; }).reverse(), axisLabel: { color: ink, fontSize: 11, fontWeight: 'bold' }, axisLine: { show: false }, axisTick: { show: false } },
      color: [accent, blue, orange],
      series: [
        { name: '创维', type: 'bar', data: d.data98.map(function(r) { return r.cw_s; }).reverse(), barWidth: '45%', itemStyle: { borderRadius: [0,5,5,0], color: accent }, label: { show: true, position: 'right', color: accent, fontSize: 10, fontWeight: 'bold', formatter: '{c}台' } },
        { name: '海信', type: 'bar', data: d.data98.map(function(r) { return r.hx_s; }).reverse(), barWidth: '45%', itemStyle: { borderRadius: [0,5,5,0], color: blue }, label: { show: true, position: 'right', color: blue, fontSize: 10, formatter: '{c}台' } },
        { name: 'TCL', type: 'bar', data: d.data98.map(function(r) { return r.tcl_s; }).reverse(), barWidth: '45%', itemStyle: { borderRadius: [0,5,5,0], color: orange }, label: { show: true, position: 'right', color: orange, fontSize: 10, formatter: '{c}台' } }
      ]
    });

    // 热力图
    if (d.heat98 && d.heat98.length > 0) {
      var brandsSet = new Set(), pricesSet = new Set();
      d.heat98.forEach(function(r) { brandsSet.add(r.brand); pricesSet.add(r.price_band); });
      var heatBrands = Array.from(brandsSet), heatPrices = Array.from(pricesSet).sort(function(a,b) { var o = {'<1万':1,'1-1.5万':2,'1.5-2万':3,'2-3万':4,'>3万':5}; return (o[a]||99) - (o[b]||99); });
      var heatData = [];
      d.heat98.forEach(function(r) { heatData.push([heatPrices.indexOf(r.price_band), heatBrands.indexOf(r.brand), r.sales]); });
      mkChart(document.getElementById('chart-98-heat'), {
        animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: function(p) { return heatBrands[p.value[1]] + ' · ' + heatPrices[p.value[0]] + '<br/>销量: ' + p.value[2] + '台'; } },
        grid: { left: '15%', right: '8%', top: '10%', bottom: '12%' },
        xAxis: { type: 'category', data: heatPrices, axisLabel: { color: muted, fontSize: 10 }, position: 'top', axisLine: { lineStyle: { color: rule } } },
        yAxis: { type: 'category', data: heatBrands, axisLabel: { color: ink, fontSize: 10, fontWeight: 'bold' }, inverse: true, axisLine: { show: false }, axisTick: { show: false } },
        visualMap: { min: 0, max: 50, calculable: false, orient: 'horizontal', left: 'center', bottom: -8, inRange: { color: [bg2, accent2, accent] }, textStyle: { color: muted, fontSize: 10 } },
        series: [{ type: 'heatmap', data: heatData, label: { show: true, color: ink, fontSize: 10, fontWeight: 'bold' }, itemStyle: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' } }]
      });
    }

    // 表格
    var html = '';
    d.data98.forEach(function(r) {
      // 🔧 控比 = 创维 / 98吋+ 行业总台数 × 100%（全行业口径，不是三家内部）
      var hy = r.hy_s || 0;
      var ratioPct = hy > 0 ? (r.cw_s / hy * 100).toFixed(1) : '—';
      html += '<tr><td><strong>' + r.branch + '</strong></td>';
      html += '<td class="num">' + r.cw_s + '</td><td class="num">' + r.cw_e.toFixed(2) + '</td>';
      html += '<td class="num">' + r.hx_s + '</td><td class="num">' + r.tcl_s + '</td>';
      html += '<td class="num" style="color:' + (hy > 0 && r.cw_s / hy >= 0.25 ? 'var(--accent)' : 'var(--muted)') + '"><strong>' + ratioPct + '%</strong></td></tr>';
    });
    document.getElementById('table-98-body').innerHTML = html;
  }

  /* ========== 模块8: Q7H ========== */
  function renderQ7H(d) {
    // Q7H vs U7S-PRO 分公司
    if (d && d.q7hData) {
      var qData = d.q7hData;
      mkChart(document.getElementById('chart-q7h-bar'), {
        animation: false, tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['Q7H(创维)', 'U7S-PRO(海信)'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
        xAxis: { type: 'category', data: qData.map(function(r) { return r.branch; }), axisLabel: { color: ink, fontSize: 11, fontWeight: 'bold', rotate: 25 }, axisLine: { lineStyle: { color: rule } }, axisTick: { lineStyle: { color: rule } } },
        yAxis: { type: 'value', name: '销量(台)', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
        color: [accent, blue],
        series: [
          { name: 'Q7H(创维)', type: 'bar', data: qData.map(function(r) { return r.q7h_s; }), barWidth: '40%', itemStyle: { borderRadius: [4,4,0,0], color: accent }, label: { show: true, position: 'top', color: accent, fontSize: 10, fontWeight: 'bold', formatter: '{c}' } },
          { name: 'U7S-PRO(海信)', type: 'bar', data: qData.map(function(r) { return r.u7s_s; }), barWidth: '40%', itemStyle: { borderRadius: [4,4,0,0], color: blue }, label: { show: true, position: 'top', color: blue, fontSize: 10, formatter: '{c}' } }
        ]
      });

      // 表格
      var html = '';
      qData.forEach(function(r) {
        // 🔧 控比 = Q7H / (Q7H + U7S-PRO) × 100%
        var total = r.q7h_s + r.u7s_s;
        var ratioPct = total > 0 ? (r.q7h_s / total * 100).toFixed(1) : '—';
        var ratioColor = total > 0 && r.q7h_s / total >= 0.5 ? 'var(--accent)' : 'var(--accent)';
        html += '<tr><td><strong>' + r.branch + '</strong></td>';
        html += '<td class="num" style="color:var(--accent)">' + r.q7h_s + '</td><td class="num">' + r.q7h_e.toFixed(2) + '</td>';
        html += '<td class="num" style="color:var(--blue)">' + r.u7s_s + '</td><td class="num">' + r.u7s_e.toFixed(2) + '</td>';
        html += '<td class="num"><strong style="color:' + ratioColor + '">' + ratioPct + '%</strong></td></tr>';
      });
      document.getElementById('q7h-branch-body').innerHTML = html;
    }

    // Q7H 按尺寸明细
    if (d && d.q7hBySize && d.q7hBySize.length > 0) {
      var q7hSize = d.q7hBySize;
      var sizes = q7hSize.map(function(r) { return r.size + '吋'; });
      mkChart(document.getElementById('chart-q7h-by-size'), {
        animation: false, tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['销额(万)', '销量'], bottom: 0, textStyle: { color: ink, fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: q7hSize.map(function(r) { return r.size + '吋'; }), axisLabel: { color: muted, fontSize: 11 } },
        yAxis: [{ type: 'value', name: '万', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
          { type: 'value', name: '台', axisLabel: { color: muted, fontSize: 10 }, splitLine: { show: false } }],
        color: [accent, green],
        series: [
          { name: '销额(万)', type: 'bar', data: q7hSize.map(function(r) { return r.amount.toFixed(1); }), barWidth: '50%', itemStyle: { borderRadius: [4,4,0,0], color: accent }, label: { show: true, position: 'top', color: ink, fontSize: 9 } },
          { name: '销量', type: 'line', yAxisIndex: 1, data: q7hSize.map(function(r) { return r.sales; }), symbol: 'circle', symbolSize: 10, lineStyle: { width: 2.5, color: green }, itemStyle: { color: green, borderColor: '#fff', borderWidth: 2 }, label: { show: true, color: green, fontSize: 10, fontWeight: 'bold' } }
        ]
      });

      var html = '';
      q7hSize.forEach(function(r) {
        html += '<tr><td><strong>' + r.size + '吋</strong></td><td>' + r.model + '</td>';
        html += '<td class="num">' + r.sales + '</td><td class="num">' + r.amount.toFixed(2) + '</td><td class="num">¥' + r.avg_price.toLocaleString() + '</td></tr>';
      });
      document.getElementById('q7h-size-body').innerHTML = html;
    }
  }

  /* ========== 三色块渲染工具 ========== */
  function fillBlock(prefix, data) {
    ['stance', 'problem', 'result'].forEach(function(key) {
      var el = document.getElementById(prefix + '-' + key);
      if (!el) return;
      var lines = data[key] || [];
      if (lines.length === 0) {
        el.innerHTML = '<li style="color:var(--muted)">—</li>';
      } else {
        el.innerHTML = lines.map(function(l) { return '<li>' + l + '</li>'; }).join('');
      }
    });
  }

  /* ========== 模块2: 品牌格局点评 ========== */
  function renderInsBrand(d) {
    if (!d || !d.brandOverview || d.brandOverview.length === 0) return;
    var bo = d.brandOverview;
    var t = d.totals || {};
    var cw = bo.find(function(b) { return b.brand === '创维'; });
    var hx = bo.find(function(b) { return b.brand === '海信'; });
    var tcl = bo.find(function(b) { return b.brand === 'TCL'; });
    var isBranch = currentBranch !== '南部全部';
    var label = isBranch ? currentBranch : '南部战区';

    var stance = [], problem = [], result = [];

    // 📈 态势
    stance.push(label + '行业总销额 <span class="hi">' + t.hy.toFixed(0) + '万</span>，同比 <span class="hi">' + ((t.yoy||0)*100).toFixed(1) + '%</span>');
    stance.push('海信 <span class="hi-blue">' + (hx?hx.amount.toFixed(0):'--') + '万</span> 领先第一，创维 <span class="hi">' + (cw?cw.amount.toFixed(0):t.cw.toFixed(0)) + '万</span> 排名第 <span class="hi">' + (cw?cw.rank:'--') + '</span>');
    stance.push('行业第三 TCL <span class="hi-orange">' + (tcl?tcl.amount.toFixed(0):'--') + '万</span>，与创维差距 <span class="hi">' + (cw?tcl?(cw.amount-tcl.amount).toFixed(0):'--':'--') + '万</span>');

    // ⚠️ 核心问题
    if (cw && hx) {
      var gap = hx.amount - cw.amount;
      if (gap > 0) problem.push('落后海信 <span class="hi">'+ gap.toFixed(0) +'万</span>，市占率差 <span class="hi">'+ ((hx.ms_amount-cw.ms_amount)*100).toFixed(1) +'pct</span>');
      else result.push('反超海信 <span class="hi-green">'+ Math.abs(gap).toFixed(0) +'万</span>');
    }
    if (cw && cw.yoy_ms !== undefined && cw.yoy_ms < 0) {
      problem.push('创维市占率同比 <span class="hi">▼ '+ (cw.yoy_ms*100).toFixed(1) +'pct</span>，份额被蚕食');
    }
    if (cw && tcl && cw.amount < tcl.amount) {
      problem.push('TCL销额 <span class="hi-orange">已超过创维</span>，需警惕第三位追赶');
    }

    // ✅ 成果亮点
    if (cw && cw.yoy_ms !== undefined && cw.yoy_ms >= 0) {
      result.push('市占率同比 <span class="hi-green">▲ +'+ (cw.yoy_ms*100).toFixed(1) +'pct</span>，份额持续扩大');
    }
    if (t.achieve !== undefined && t.achieve >= 1.0) {
      result.push('目标达成 <span class="hi-green">'+ (t.achieve*100).toFixed(1) +'%</span>，超额完成');
    }
    if (bo[0].brand === '创维') {
      result.push('稳居 <span class="hi-green">销额第一</span>，领先第二名 <span class="hi-green">'+ (bo[0].amount - bo[1].amount).toFixed(0) +'万</span>');
    }

    // ⚠️ 补充：达成率不足 & 同比下滑 进问题（之前漏了）
    if (t.achieve !== undefined && t.achieve < 0.95) {
      problem.push('目标达成 <span class="hi">仅 '+ (t.achieve*100).toFixed(1) +'%</span>，未达预期');
    }

    fillBlock('ins-brand', { stance: stance, problem: problem, result: result });
  }

  /* ========== 模块3: 分公司态势点评 ========== */
  function renderInsBranch(d) {
    var allData = getAllData(); if (!allData || !allData.msData) return;
    var ms = allData.msData.slice();
    var isBranch = currentBranch !== '南部全部';
    var stance = [], problem = [], result = [];

    if (isBranch) {
      var target = ms.find(function(r) { return r.branch === currentBranch; });
      if (!target) return;
      var avgCw = ms.reduce(function(s, r) { return s + r.cw; }, 0) / ms.length;
      var avgMs = ms.reduce(function(s, r) { return s + r.cw_ms; }, 0) / ms.length;
      var rankCw = ms.filter(function(r) { return r.cw > target.cw; }).length + 1;
      var rankMs = ms.filter(function(r) { return r.cw_ms > target.cw_ms; }).length + 1;
      var rankAch = ms.filter(function(r) { return r.achieve > target.achieve; }).length + 1;

      stance.push(currentBranch + '销额 <span class="hi">'+ target.cw.toFixed(1) +'万</span>，全区均值 <span class="hi-muted">'+ avgCw.toFixed(1) +'万</span>');
      stance.push('市占率 <span class="hi">'+ (target.cw_ms*100).toFixed(1) +'%</span>，全区第 <span class="hi">'+ rankMs +'</span> / 达成率 <span class="hi">'+ (target.achieve*100).toFixed(1) +'%</span>（第 '+ rankAch +'）');
      // 🔧 修复 -0 问题
      var hxDiff = target.lead_hx;
      var hxDiffStr = Math.abs(hxDiff) < 0.5 ? '基本持平' : (hxDiff >= 0 ? '+' : '') + hxDiff.toFixed(1);
      stance.push('vs 海信 <span class="hi-blue">'+ hxDiffStr +'万</span>');

      if (target.achieve < 0.9) problem.push('目标达成 <span class="hi">仅 '+ (target.achieve*100).toFixed(1) +'%</span>，需重点攻坚');
      if (hxDiff < -0.5) problem.push('落后海信 <span class="hi">'+ Math.abs(hxDiff).toFixed(0) +'万</span>，差距明显');
      if (target.wow !== undefined && target.wow !== null && target.wow < -0.1) problem.push('环比 <span class="hi">▼ '+ (target.wow*100).toFixed(1) +'%</span>，周度下滑');

      if (rankCw <= 3) result.push('销额排名 <span class="hi-green">第'+ rankCw +'</span>，头部阵营');
      if (target.achieve >= 1.05) result.push('达成率 <span class="hi-green">'+ (target.achieve*100).toFixed(1) +'%</span>，超预期');
      if (target.lead_hx > 0) result.push('领先海信 <span class="hi-green">'+ target.lead_hx.toFixed(0) +'万</span>');
    } else {
      // 全区横向
      var msSorted = ms.slice().sort(function(a, b) { return b.cw_ms - a.cw_ms; });
      var best = msSorted[0], worst = msSorted[msSorted.length - 1];
      var lowAch = ms.slice().sort(function(a, b) { return a.achieve - b.achieve; })[0];
      var lagHx = ms.slice().sort(function(a, b) { return a.lead_hx - b.lead_hx; })[0];
      var wowList = ms.filter(function(r) { return r.wow !== undefined && r.wow !== null; });
      var lowWow = wowList.length > 0 ? wowList.slice().sort(function(a, b) { return a.wow - b.wow; })[0] : null;
      var highWow = wowList.length > 0 ? wowList.slice().sort(function(a, b) { return b.wow - a.wow; })[0] : null;

      stance.push('11 家分公司市占率均值 <span class="hi">'+ ((ms.reduce(function(s,r){return s+r.cw_ms},0)/11)*100).toFixed(1) +'%</span>');
      stance.push('达成率均值 <span class="hi">'+ ((ms.reduce(function(s,r){return s+r.achieve},0)/11)*100).toFixed(1) +'%</span>');
      stance.push(best.branch + '市占率 <span class="hi-green">'+ (best.cw_ms*100).toFixed(1) +'%</span> 全区最高');

      problem.push(worst.branch + '市占率 <span class="hi">仅 '+ (worst.cw_ms*100).toFixed(1) +'%</span>，倒数第一');
      if (lowAch.achieve < 0.9) problem.push(lowAch.branch + '目标达成 <span class="hi">仅 '+ (lowAch.achieve*100).toFixed(1) +'%</span>');
      if (lagHx.lead_hx < 0) problem.push(lagHx.branch + '落后海信 <span class="hi">'+ Math.abs(lagHx.lead_hx).toFixed(0) +'万</span>，差距最大');
      if (lowWow && lowWow.wow < -0.15) problem.push(lowWow.branch + '环比 <span class="hi">▼ '+ (lowWow.wow*100).toFixed(1) +'%</span>，下滑最严重');

      var overAch = ms.filter(function(r) { return r.achieve >= 1.0; });
      if (overAch.length > 0) result.push('<span class="hi-green">'+ overAch.length +'</span> 家分公司达成率超 100%');
      var leadHxCnt = ms.filter(function(r) { return r.lead_hx >= 0; });
      if (leadHxCnt.length > 0) result.push('领先海信 <span class="hi-green">'+ leadHxCnt.length +'</span> 家');
      if (highWow && highWow.wow > 0.1) result.push(highWow.branch + '环比 <span class="hi-green">▲ +'+ (highWow.wow*100).toFixed(1) +'%</span>，增长最快');
    }

    fillBlock('ins-branch', { stance: stance, problem: problem, result: result });
  }

  /* ========== 模块4: TOP40 型号点评 ========== */
  function renderInsTop40(d) {
    if (!d || !d.top40) return;
    var t40 = d.top40;
    var cwModels = t40.filter(function(r) { return r.brand === '创维'; });
    var top1 = t40[0];
    var totalAmt = t40.reduce(function(s, r) { return s + r.amount; }, 0);
    var brandMap = {};
    t40.forEach(function(r) { brandMap[r.brand] = (brandMap[r.brand] || 0) + 1; });
    var brands = Object.keys(brandMap).sort(function(a, b) { return brandMap[b] - brandMap[a]; });
    var topCw = cwModels.length > 0 ? cwModels.slice().sort(function(a, b) { return b.amount - a.amount; })[0] : null;
    var topCwRank = topCw ? t40.findIndex(function(r) { return r === topCw; }) + 1 : -1;
    var t40CwAmt = cwModels.reduce(function(s, r) { return s + r.amount; }, 0);

    var stance = [], problem = [], result = [];

    stance.push('TOP40 合计销额 <span class="hi">'+ totalAmt.toFixed(0) +'万</span>，' + brands.length + ' 个品牌入场');
    stance.push('头部 <span class="hi-blue">'+ top1.brand + ' ' + top1.model + '</span> 居首，销额 <span class="hi">'+ top1.amount.toFixed(1) +'万</span>');
    stance.push('创维入榜 <span class="hi">'+ cwModels.length +'</span> 席，合计销额 <span class="hi">'+ t40CwAmt.toFixed(1) +'万</span>（占 TOP40 <span class="hi">'+ (totalAmt>0?(t40CwAmt/totalAmt*100).toFixed(1):0) +'%</span>）');

    if (topCwRank > 0) {
      problem.push('创维排名最高仅 <span class="hi">第 '+ topCwRank +' 位</span>，头部阵地被 <span class="hi-blue">'+ t40[0].brand +'</span> 占据');
    }
    var cwAvgPrice = cwModels.length > 0 ? cwModels.reduce(function(s, r) { return s + r.avg_price; }, 0) / cwModels.length : 0;
    var top3 = t40.slice(0, 3);
    var top3Avg = top3.reduce(function(s, r) { return s + r.avg_price; }, 0) / 3;
    if (top3Avg > cwAvgPrice && cwModels.length > 0) {
      problem.push('TOP3 均价 <span class="hi">¥'+ top3Avg.toFixed(0) +'</span>，创维均价 <span class="hi-muted">¥'+ cwAvgPrice.toFixed(0) +'</span>，头部高端阵地偏弱');
    }

    var wowCw = cwModels.filter(function(r) { return r.wow_sales !== null && r.wow_sales !== undefined; });
    var wowPos = wowCw.filter(function(r) { return r.wow_sales > 0; });
    if (wowCw.length > 0 && wowPos.length > 0) {
      result.push('创维入榜型号中 <span class="hi-green">'+ wowPos.length +'/'+ wowCw.length +'</span> 环比增长');
    }
    if (brands[0] === '创维' && brandMap['创维'] >= 15) {
      result.push('创维入榜 <span class="hi-green">'+ cwModels.length +'</span> 席，品牌覆盖最广');
    }

    fillBlock('ins-top40', { stance: stance, problem: problem, result: result });
  }

  /* ========== 模块5: 价格段点评 ========== */
  function renderInsPrice(d) {
    if (!d || !d.priceBands) return;
    var pb = d.priceBands.slice();
    var orderO = { '<1万':1, '1-1.5万':2, '1.5-2万':3, '2-3万':4, '>3万':5 };
    pb.sort(function(a, b) { return (orderO[a.band]||99) - (orderO[b.band]||99); });

    var pbByHy = pb.slice().sort(function(a, b) { return b.hy_amount - a.hy_amount; });
    var pbByCw = pb.slice().sort(function(a, b) { return b.cw_share - a.cw_share; });
    var topBand = pbByHy[0];
    var best = pbByCw[0];
    // 🔧 薄弱环节 = 行业规模主战场级别（hy_share >= 10%）且创维控比低（cw_share < 20%）
    var weakCands = pb.filter(function(b) { return b.hy_share >= 10 && b.cw_share < 20; });
    weakCands.sort(function(a, b) { return a.cw_share - b.cw_share; });
    var weakest = weakCands[0];

    var stance = [], problem = [], result = [];

    stance.push('行业主战场 <span class="hi">'+ topBand.band +'</span>，销额 <span class="hi">'+ topBand.hy_amount.toFixed(0) +'万</span>，占比 <span class="hi">'+ topBand.hy_share.toFixed(1) +'%</span>');
    stance.push('创维在 <span class="hi">'+ topBand.band +'</span> 控比 <span class="hi">'+ topBand.cw_share.toFixed(1) +'%</span>');

    // 薄弱环节提醒
    if (weakest) {
      var gapAbs = weakest.hy_amount - weakest.cw_amount;
      problem.push('<span class="hi">'+ weakest.band +'</span> 行业占比 <span class="hi-blue">'+ weakest.hy_share.toFixed(1) +'%</span>，创维控比仅 <span class="hi">'+ weakest.cw_share.toFixed(1) +'%</span>（差 <span class="hi">'+ gapAbs.toFixed(0) +'万</span>），最大短板');
    }

    result.push('<span class="hi-green">'+ best.band +'</span> 控比最高 <span class="hi-green">'+ best.cw_share.toFixed(1) +'%</span>');
    var avgCw = pb.reduce(function(s, r) { return s + r.cw_share; }, 0) / pb.length;
    if (avgCw > 25) result.push('全价格段平均控比 <span class="hi-green">'+ avgCw.toFixed(1) +'%</span>，整体优势');

    fillBlock('ins-price', { stance: stance, problem: problem, result: result });
  }

  /* ========== 模块6: 尺寸段点评 ========== */
  function renderInsSize(d) {
    if (!d || !d.sizeList) return;
    var sizeList = d.sizeList.slice().sort(function(a, b) { return b.amount - a.amount; });
    var topSize = sizeList[0];
    var segsWithShare = [];
    (d.sizeSegs || []).forEach(function(seg) {
      var segData = sizeList.filter(function(s) { return s.size === seg; })[0];
      if (segData) {
        var cwAmt = ((d.cwSizeList||[]).filter(function(c) { return c.size === seg; })[0] || {}).amount || 0;
        segsWithShare.push({ size: seg, share: segData.amount > 0 ? cwAmt / segData.amount * 100 : 0, hy_amt: segData.amount });
      }
    });
    segsWithShare.sort(function(a, b) { return b.share - a.share; });
    var bestSeg = segsWithShare[0], worstSeg = segsWithShare[segsWithShare.length - 1];

    var stance = [], problem = [], result = [];

    stance.push('<span class="hi">'+ topSize.size +'吋</span> 是行业第一大尺寸，销额 <span class="hi">'+ topSize.amount.toFixed(0) +'万</span>');
    stance.push('前两大尺寸合计占行业 <span class="hi">'+ ((sizeList.slice(0,2).reduce(function(s,r){return s+r.amount},0)/sizeList.reduce(function(s,r){return s+r.amount},0))*100).toFixed(1) +'%</span>');

    if (worstSeg) problem.push('<span class="hi">'+ worstSeg.size +'</span> 创维份额仅 <span class="hi">'+ worstSeg.share.toFixed(1) +'%</span>，薄弱点');
    // 高尺寸段分析
    var bigSegs = segsWithShare.filter(function(s) { return parseInt(s.size) >= 98; });
    if (bigSegs.length > 0) {
      var bigMax = bigSegs.slice().sort(function(a, b) { return b.hy_amt - a.hy_amt; })[0];
      if (bigMax && bigMax.share < 20) problem.push('大屏 <span class="hi">'+ bigMax.size +'</span> 行业销额 <span class="hi-blue">'+ bigMax.hy_amt.toFixed(0) +'万</span>，创维份额 <span class="hi">仅 '+ bigMax.share.toFixed(1) +'%</span>');
    }

    if (bestSeg) result.push('<span class="hi-green">'+ bestSeg.size +'</span> 创维份额 <span class="hi-green">'+ bestSeg.share.toFixed(1) +'%</span>，绝对优势');
    // 多数尺寸份额超 30%
    var strongCnt = segsWithShare.filter(function(s) { return s.share >= 30; }).length;
    if (strongCnt >= 2) result.push('<span class="hi-green">'+ strongCnt +'</span> 个尺寸段创维份额超 30%');

    fillBlock('ins-size', { stance: stance, problem: problem, result: result });
  }

  /* ========== 模块7: 98吋+ 专项点评 ========== */
  function renderIns98(d) {
    if (!d || !d.data98 || d.data98.length === 0) return;
    var data = d.data98;
    var totalCw = data.reduce(function(s, r) { return s + r.cw_s; }, 0);
    var totalHx = data.reduce(function(s, r) { return s + r.hx_s; }, 0);
    var totalTcl = data.reduce(function(s, r) { return s + r.tcl_s; }, 0);
    // 🔧 用 hy_s（行业总台数），不是三家合计！
    var totalHy = data.reduce(function(s, r) { return s + (r.hy_s || 0); }, 0);
    var dominate = data.filter(function(r) { return r.cw_s > r.hx_s && r.cw_s > r.tcl_s; });
    var loseHx = data.filter(function(r) { return r.hx_s > r.cw_s; });
    var big = data.slice().sort(function(a, b) { return (a.hy_s||0) - (b.hy_s||0); })[data.length - 1];
    // 🔧 控比% = 创维 / 98吋+ 行业总台数
    var ratioPct = totalHy > 0 ? (totalCw / totalHy * 100).toFixed(1) : '—';

    var stance = [], problem = [], result = [];

    stance.push('98吋+ 行业合计 <span class="hi">'+ totalHy +'台</span>，创维 <span class="hi">'+ totalCw +'</span> vs 海信 <span class="hi-blue">'+ totalHx +'</span> vs TCL <span class="hi-orange">'+ totalTcl +'</span>（其他品牌 ' + (totalHy-totalCw-totalHx-totalTcl) + ' 台）');
    stance.push('创维行业控比 <span class="hi">'+ ratioPct +'%</span>');
    stance.push('最大单市场 <span class="hi-blue">'+ big.branch +'</span>（行业 ' + (big.hy_s||0) + ' 台）');

    // 🔧 创维落后海信 → 行业控比不足 25% 算失守
    if (totalHy > 0 && totalCw / totalHy < 0.25 && totalHx > totalCw) {
      problem.push('98吋+ 创维 <span class="hi">'+ totalCw +'</span> 台 < 海信 <span class="hi-blue">'+ totalHx +'</span> 台，行业控比仅 <span class="hi">'+ ratioPct +'%</span>，大屏失守');
    }
    if (loseHx.length >= 3) {
      problem.push('海信在 <span class="hi">'+ loseHx.length +'家</span> 分公司领先：' + loseHx.map(function(r){return r.branch}).join('、'));
    }
    if (big.cw_s < big.hx_s) {
      problem.push('最大市场 <span class="hi-blue">'+ big.branch +'</span> 海信 <span class="hi">'+ big.hx_s +'</span> 台 > 创维 <span class="hi">'+ big.cw_s +'</span> 台，关键阵地失守');
    }

    if (dominate.length > 0) {
      result.push('创维控场 <span class="hi-green">'+ dominate.length +'家</span>：' + dominate.map(function(r){return r.branch}).join('、'));
    }
    if (total > 0 && totalCw / total >= 0.4) result.push('创维控比 <span class="hi-green">'+ ratioPct +'%</span>，大场优势');

    fillBlock('ins-98', { stance: stance, problem: problem, result: result });
  }

  /* ========== 模块8: Q7H 专项点评 ========== */
  function renderInsQ7H(d) {
    if (!d || !d.q7hData) return;
    var q = d.q7hData.slice();
    var qTotal = q.reduce(function(s, r) { return s + r.q7h_s; }, 0);
    var uTotal = q.reduce(function(s, r) { return s + r.u7s_s; }, 0);
    var totalBoth = qTotal + uTotal;
    // 🔧 控比% = Q7H / (Q7H + U7S-PRO)
    var ratioPct = totalBoth > 0 ? (qTotal / totalBoth * 100).toFixed(1) : '—';
    var qLead = q.filter(function(r) { return r.q7h_s > r.u7s_s; });
    var uLead = q.filter(function(r) { return r.u7s_s > r.q7h_s; });
    var qBest = q.slice().sort(function(a, b) { return b.q7h_s - a.q7h_s; })[0];
    var topSize = null, topSizeAmt = 0;
    (d.q7hBySize || []).forEach(function(item) {
      if (item.amount > topSizeAmt) { topSizeAmt = item.amount; topSize = item.size; }
    });

    var stance = [], problem = [], result = [];

    stance.push('Q7H 合计 <span class="hi">'+ qTotal +'台</span> vs U7S-PRO <span class="hi-blue">'+ uTotal +'台</span>，Q7H控比 <span class="hi">'+ ratioPct +'%</span>');
    stance.push('最大战场 <span class="hi">'+ qBest.branch +'</span>（Q7H '+ qBest.q7h_s +' vs U7S-PRO '+ qBest.u7s_s +'）');
    if (topSize) stance.push('Q7H 主力尺寸 <span class="hi">'+ topSize +'吋</span>，销额 <span class="hi">'+ topSizeAmt.toFixed(1) +'万</span>');

    if (uLead.length > 0) {
      problem.push('U7S-PRO 在 <span class="hi">'+ uLead.length +'家</span> 反超：' + uLead.map(function(r){return r.branch+'('+r.u7s_s+'台)'}).join('、'));
    }
    var uBig = uLead.slice().sort(function(a, b) { return b.u7s_s - a.u7s_s; })[0];
    if (uBig && uBig.u7s_s >= 5) {
      problem.push(uBig.branch + ' U7S-PRO <span class="hi">'+ uBig.u7s_s +'台</span>，创维 Q7H <span class="hi">仅 '+ uBig.q7h_s +'台</span>');
    }

    if (qLead.length > 0) {
      result.push('Q7H 压制 <span class="hi-green">'+ qLead.length +'家</span> 分公司');
    }
    if (totalBoth > 0 && qTotal / totalBoth >= 0.6) result.push('Q7H控比 <span class="hi-green">'+ ratioPct +'%</span>，产品力领先');

    fillBlock('ins-q7h', { stance: stance, problem: problem, result: result });
  }

  /* ========== 模块9: 结论与建议（三色块版）========== */
  function generateInsights(d) {
    var stance = [], problems = [], suggestions = [];
    var allData = getAllData(); if (!allData) return;
    var t = allData.totals || {};

    // 📈 核心态势
    stance.push('创维销额 <span class="hi">'+ (t.cw? t.cw.toFixed(0): '--') +'万</span>，市占率 <span class="hi">'+ ((t.ms||0)*100).toFixed(1) +'%</span>，同比 <span class="hi">'+ ((t.yoy||0)*100).toFixed(1) +'%</span>');
    if (t.achieve !== undefined) stance.push('目标达成 <span class="hi">'+ (t.achieve*100).toFixed(1) +'%</span>，目标线 <span class="hi-muted">'+ ((t.target||0)*100).toFixed(1) +'%</span>');
    if (t.hx !== undefined && t.cw !== undefined) {
      stance.push('vs 海信 <span class="hi-blue">'+ t.hx.toFixed(0) +'万</span>，差距 <span class="hi">'+ (t.cw - t.hx).toFixed(0) +'万</span>');
    }

    // ⚠️ 优先问题
    if (allData.msData) {
      var lagging = allData.msData.slice().sort(function(a, b) { return a.lead_hx - b.lead_hx; });
      lagging.forEach(function(r) {
        if (r.lead_hx < -30) problems.push(r.branch + ' 落后海信 <span class="hi">'+ Math.abs(r.lead_hx).toFixed(0) +'万</span>，差距严重');
      });
      var lowAch = allData.msData.filter(function(r) { return r.achieve < 0.9; });
      lowAch.forEach(function(r) {
        problems.push(r.branch + ' 目标达成仅 <span class="hi">'+ (r.achieve*100).toFixed(1) +'%</span>，需重点关注');
      });
    }
    if (allData.q7hData) {
      allData.q7hData.forEach(function(r) {
        if (r.u7s_s > r.q7h_s && r.u7s_s >= 5) {
          problems.push(r.branch + ' U7S-PRO <span class="hi">'+ r.u7s_s +'台</span> > Q7H <span class="hi">'+ r.q7h_s +'台</span>，需加强控场');
        }
      });
    }
    if (allData.priceBands) {
      var worstBand = allData.priceBands.slice().sort(function(a, b) { return a.cw_share - b.cw_share; })[0];
      if (worstBand && worstBand.cw_share < 15) {
        problems.push('价格段 <span class="hi">'+ worstBand.band +'</span> 创维控比仅 <span class="hi">'+ worstBand.cw_share.toFixed(1) +'%</span>');
      }
    }
    if (allData.top40 && allData.totals) {
      var top2Amt = allData.top40.slice(0, 2).reduce(function(s, r) { return s + r.amount; }, 0);
      var conc = allData.totals.hy > 0 ? (top2Amt / allData.totals.hy * 100) : 0;
      if (conc > 25) problems.push('头部2型号集中度 <span class="hi">高达 '+ conc.toFixed(1) +'%</span>，风险集中');
    }

    // ✅ 优先建议
    if (allData.priceBands) {
      var topBand = allData.priceBands.slice().sort(function(a, b) { return b.hy_share - a.hy_share; })[0];
      suggestions.push('<span class="hi">'+ topBand.band +'</span> 是行业主战场（'+ topBand.hy_share.toFixed(1) +'%），应加强该价位段产品力 & 渠道推力');
    }
    if (allData.sizeList) {
      var topSize = allData.sizeList.slice().sort(function(a, b) { return b.amount - a.amount; })[0];
      suggestions.push('<span class="hi">'+ topSize.size +'吋</span> 是第一大尺寸（'+ topSize.amount.toFixed(0) +'万），建议巩固优势 & 提升份额');
    }
    if (allData.msData) {
      var toCatch = allData.msData.filter(function(r) { return r.lead_hx < -30; });
      if (toCatch.length > 0) {
        suggestions.push('针对 ' + toCatch.map(function(r){return r.branch}).join('、') + ' 等落后分公司，建议 Q7H & 大屏产品定向促销');
      }
    }
    if (allData.q7hData) {
      suggestions.push('继续强化 Q7H 产品力，在 U7S-PRO 反超的分公司重点控场');
    }
    suggestions.push('每周复盘各分公司环比、同比数据，<span class="hi">及时介入下滑严重</span> 的分公司');

    fillBlock('exec', { stance: stance, problem: problems, result: suggestions });
  }

  /* ========== 工具：getFirstSeenMap — 直接用 Python 预计算的全量数据 ========== */
  var _firstSeenMap = null;
  var _weeksOrder = null;
  function getFirstSeenMap() {
    if (_firstSeenMap) return _firstSeenMap;
    // 🔧 确保 _weeksOrder 有值（用于计算上市周龄）
    if (!_weeksOrder && window.DASHBOARD_ALL && DASHBOARD_ALL.allWeeks) {
      _weeksOrder = DASHBOARD_ALL.allWeeks.slice();
    }
    // 🔧 优先用 Python 预扫描的全量数据（覆盖 25+26 两年所有型号）
    if (window.DASHBOARD_ALL && DASHBOARD_ALL.modelFirstSeen) {
      _firstSeenMap = DASHBOARD_ALL.modelFirstSeen;
    } else {
      // 兜底：JS 自己扫 top40 历史（精度差，只能扫 26 年进 top40 的型号）
      _firstSeenMap = {};
      if (!window.DASHBOARD_ALL || !DASHBOARD_ALL.allWeeks) return _firstSeenMap;
      DASHBOARD_ALL.allWeeks.forEach(function(w) {
        var t40 = DASHBOARD_ALL.data[w] && DASHBOARD_ALL.data[w].top40;
        if (!t40) return;
        t40.forEach(function(item) {
          var key = item.brand + '|' + item.model;
          if (!_firstSeenMap[key]) _firstSeenMap[key] = w;
        });
      });
    }
    return _firstSeenMap;
  }
  function getModelAge(brand, model, curWeek) {
    var map = getFirstSeenMap();
    var key = brand + '|' + model;
    var first = map[key];
    if (!first) return null;
    if (!_weeksOrder) getFirstSeenMap(); // 确保 _weeksOrder 有值
    if (!_weeksOrder) return 0;
    // 🔧 first 可能是 25WXX 或 26WXX，而 _weeksOrder 只有 26WXX
    // 如果 first 以 25 开头，age = curWeek 对应的 26 年周数 + 25 年剩余周数（粗略）
    if (first.indexOf('25W') === 0) {
      // 25WXX → 转成数字，假设 25 年周数对应 26 年之前的时间
      // 简化处理：直接计算 first 周号到 curWeek 的时间差
      var firstNum = parseInt(first.replace('25W',''));
      var curNum = parseInt(curWeek.replace('26W',''));
      // 粗略：25WXX 到 26W01 有 (52 - firstNum + 1) 周，再加 curNum - 1 周
      return (52 - firstNum + 1) + (curNum - 1);
    }
    var fi = _weeksOrder.indexOf(first);
    var ci = _weeksOrder.indexOf(curWeek);
    if (fi < 0 || ci < 0) return null;
    return ci - fi;
  }

  /* ========== 模块9: 竞品重点产品分析 ========== */
  function renderNewProductTable(d) {
    var tbody = document.getElementById('newprod-tbody');
    var foot = document.getElementById('newprod-foot');
    var brandSumEl = document.getElementById('brand-summary');
    if (!tbody) return;
    if (!d || !d.top40) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">暂无数据</td></tr>'; if(foot) foot.innerHTML=''; return; }

    var firstSeenMap = getFirstSeenMap();
    var curWeek = currentKey;
    var isBranch = currentBranch !== '南部全部';

    // 取 top40 前 25 行（重点型号）
    var labeled = d.top40.map(function(item) {
      var age = getModelAge(item.brand, item.model, curWeek);
      return { item: item, age: age };
    });
    labeled.sort(function(a, b) { return b.item.amount - a.item.amount; });
    var rows = labeled.slice(0, 25);

    // 品牌 class
    function brandClass(brand) {
      if (brand === '创维') return 'cw';
      if (brand === '海信') return 'hx';
      if (brand === 'TCL') return 'tcl';
      if (brand.indexOf('三星') >= 0) return 'samsung';
      if (brand.indexOf('索尼') >= 0) return 'sony';
      return 'other';
    }

    // 综合分析生成（更全面）
    function makeRead(r) {
      var it = r.item, brand = it.brand, wow = it.wow_sales, avgP = it.avg_price, age = r.age, sz = it.size;
      var parts = [];

      // 1. 产品定位（价位+尺寸+市场角色）
      var segKw = '';
      if (sz) segKw += sz + '吋 ';
      if (avgP > 25000) segKw += '超高端';
      else if (avgP > 18000) segKw += '高端旗舰';
      else if (avgP > 12000) segKw += '中高端主力';
      else if (avgP > 8000) segKw += '中端走量';
      else segKw += '入门/性价比';
      parts.push('<span class="hi">' + segKw + '</span>');

      // 2. 上市周期（新品/成长期/成熟期）
      if (age === null) { /* 未知 */ }
      else if (age <= 8) parts.push('<span class="hi-green">新品爬坡期</span>（上市约 ' + age + ' 周）');
      else if (age <= 20) parts.push('<span class="hi-blue">成长期</span>（上市 ' + age + ' 周）');
      else parts.push('成熟期（上市约 ' + age + ' 周）');

      // 3. 环比走势（精准描述）
      if (wow !== null && wow !== undefined) {
        var wPct = (wow * 100).toFixed(1);
        if (wow >= 1.0) parts.push('<span class="hi-green">销量翻倍 ▲+' + wPct + '%</span>');
        else if (wow >= 0.3) parts.push('<span class="hi-green">强劲增长 ▲+' + wPct + '%</span>');
        else if (wow > 0) parts.push('微增 +' + wPct + '%');
        else if (wow <= -0.5) parts.push('<span class="hi">断崖下滑 ▼' + Math.abs(wPct) + '%</span>');
        else if (wow < 0) parts.push('<span class="hi">环比下滑 ▼' + Math.abs(wPct) + '%</span>');
      }

      // 4. 市场表现量级
      var amtKw = '';
      if (it.amount >= 100) amtKw = '<span class="hi">头部爆款</span>';
      else if (it.amount >= 50) amtKw = '<span class="hi-blue">主力大卖</span>';
      else if (it.amount >= 20) amtKw = '中腰部';
      else amtKw = '尾部';

      // 5. 竞品对标（创维 vs 竞品，精准价位差）
      var compStr = '';
      var isCw = brand === '创维';
      var targetBrand = isCw ? '海信' : '创维';
      var rival = d.top40.find(function(x) {
        return x.brand === targetBrand && x.size === sz && x.model !== it.model;
      });
      if (rival) {
        var priceDiff = ((avgP - rival.avg_price) / rival.avg_price * 100).toFixed(0);
        if (isCw) {
          compStr = '；对标海信 ' + rival.model;
          if (avgP < rival.avg_price) compStr += '（<span class="hi-green">低 ' + Math.abs(priceDiff) + '%</span>，性价比优势）';
          else compStr += '（<span class="hi">高 ' + priceDiff + '%</span>，溢价）';
        } else {
          compStr = '；对打创维 ' + rival.model;
          if (avgP > rival.avg_price) compStr += '（<span class="hi">高 ' + priceDiff + '%</span>）';
          else compStr += '（<span class="hi-blue">低 ' + Math.abs(priceDiff) + '%</span>）';
        }
        // 加销量对比
        var salesRatio = (it.sales / rival.sales * 100).toFixed(0);
        compStr += '，销量是对方的 <span class="hi">' + salesRatio + '%</span>';
      } else {
        // 找不到同尺寸 → 同价位对标
        var rivalBand = d.top40.find(function(x) {
          return x.brand === targetBrand && Math.abs(x.avg_price - avgP) / avgP < 0.2;
        });
        if (rivalBand) {
          compStr = '；同价位对标 ' + rivalBand.brand + ' ' + rivalBand.model;
        }
      }

      // 6. 行业排名
      var rank = labeled.findIndex(function(r2) { return r2.item.model === it.model && r2.item.brand === brand; }) + 1;
      var rankStr = rank <= 5 ? '<span class="hi">TOP' + rank + '</span>' : ('TOP' + rank);

      return amtKw + '，' + rankStr + '。' + parts.join('，') + compStr;
    }

    // 渲染表格
    var rowsHtml = rows.map(function(r) {
      var it = r.item;
      var bc = brandClass(it.brand);
      var firstWeek = firstSeenMap[it.brand + '|' + it.model];
      var ageHtml = firstWeek
        ? (firstWeek === curWeek
            ? '<span class="age-new">NEW</span>'
            : '<span style="font-size:0.68rem;color:var(--muted)">' + firstWeek + '</span>')
        : '<span class="hi-muted">—</span>';
      var wowHtml = it.wow_sales !== null && it.wow_sales !== undefined
        ? (it.wow_sales >= 0
            ? '<span class="trend-up">▲+' + (it.wow_sales*100).toFixed(0) + '%</span>'
            : '<span class="trend-down">▼' + Math.abs(it.wow_sales*100).toFixed(0) + '%</span>')
        : '<span class="hi-muted">—</span>';
      return '<tr>' +
        '<td class="brand-cell ' + bc + '"><span class="bchip">' + it.brand + '</span></td>' +
        '<td class="model-cell">' + it.model + (it.size ? ' <span style="color:var(--muted);font-size:0.72rem">' + it.size + '吋</span>' : '') + '</td>' +
        '<td class="launch-cell">' + ageHtml + '</td>' +
        '<td class="num" style="text-align:right">¥' + (it.avg_price > 0 ? (it.avg_price/1000).toFixed(1) + 'k' : '—') + '</td>' +
        '<td class="num" style="text-align:right">' + it.sales + '</td>' +
        '<td class="num" style="text-align:right">' + wowHtml + '</td>' +
        '<td class="num" style="text-align:right;font-weight:700">' + it.amount.toFixed(1) + '</td>' +
        '<td class="read">' + makeRead(r) + '</td>' +
      '</tr>';
    }).join('');
    tbody.innerHTML = rowsHtml;

    // 底部品牌汇总
    var brandStats = {};
    rows.forEach(function(r) {
      var b = r.item.brand;
      if (!brandStats[b]) brandStats[b] = { count: 0, amount: 0, sales: 0 };
      brandStats[b].count++;
      brandStats[b].amount += r.item.amount;
      brandStats[b].sales += r.item.sales;
    });
    var footItems = Object.keys(brandStats).sort(function(a,b) { return brandStats[b].amount - brandStats[a].amount; });
    var footHtml = footItems.map(function(b) {
      var s = brandStats[b];
      return '<span class="hi-kw">' + b + '</span> <span class="hi-num">' + s.count + '款</span>（合计销额 <span class="hi-num">' + s.amount.toFixed(0) + '万</span>，销量 ' + s.sales + '台）';
    }).join(' | ');
    if (foot) foot.innerHTML = footHtml;

    // 📊 品牌竞争格局速览（用 brandOverview 数据）
    if (brandSumEl && d.brandOverview) {
      var bs = d.brandOverview.slice(0, 6);
      var topBrand = bs[0], secondBrand = bs[1], thirdBrand = bs[2];
      var stance2 = [], problem2 = [], result2 = [];

      stance2.push('行业总销额 <span class="hi">' + (d.totals ? d.totals.hy.toFixed(0) : '—') + '万</span>，TOP3 合计 <span class="hi">' + (bs.slice(0,3).reduce(function(s,b){return s+b.amount},0).toFixed(0)) + '万</span>，占比 ' + (d.totals ? (bs.slice(0,3).reduce(function(s,b){return s+b.amount},0)/d.totals.hy*100).toFixed(1) : '—') + '%');
      stance2.push('第一名 <span class="hi-blue">' + topBrand.brand + '</span> ' + topBrand.amount.toFixed(0) + '万（市占 <span class="hi">' + (topBrand.ms_amount*100).toFixed(1) + '%</span>）');
      stance2.push('创维排名第 <span class="hi">' + (function(){ var cw = bs.find(function(b){return b.brand==='创维'}); return cw ? cw.rank : '—'; })() + '</span>');

      var cwB = bs.find(function(b){return b.brand==='创维'});
      if (cwB && topBrand) {
        var gap = topBrand.amount - cwB.amount;
        if (gap > 0) problem2.push('与第一名 <span class="hi-blue">' + topBrand.brand + '</span> 差距 <span class="hi">' + gap.toFixed(0) + '万</span>，缩小差距需要补充 <span class="hi">' + Math.ceil(gap/cwB.avg_price*100) + '</span> 台同价位中高端产品');
      }
      if (topBrand && secondBrand && topBrand.rank === 1 && secondBrand.rank === 2 && topBrand.brand !== '创维') {
        var gap12 = topBrand.amount - secondBrand.amount;
        if (gap12 < 50) problem2.push('前两名差距仅 <span class="hi">' + gap12.toFixed(0) + '万</span>，第一梯队竞争白热化');
      }

      // TOP40 品牌分布
      var brandCount = {};
      d.top40.forEach(function(it){ brandCount[it.brand] = (brandCount[it.brand]||0)+1; });
      var topBrandName = Object.keys(brandCount).sort(function(a,b){return brandCount[b]-brandCount[a]})[0];
      result2.push('TOP40 中 <span class="hi-blue">' + topBrandName + '</span> 占据 <span class="hi">' + brandCount[topBrandName] + '款</span>，' + (cwB ? '创维 ' + (brandCount['创维']||0) + '款' : '—'));

      brandSumEl.innerHTML =
        (stance2.length ? '<li class="blines-li"><span class="hi">📈 态势</span> ' + stance2.join('；') + '</li>' : '') +
        (problem2.length ? '<li class="blines-li"><span class="hi">⚠️ 问题</span> ' + problem2.join('；') + '</li>' : '') +
        (result2.length ? '<li class="blines-li"><span class="hi-green">✅ 亮点</span> ' + result2.join('；') + '</li>' : '');
    }
  }

  /* ========== 模块11: 成果与问题 ========== */
  function renderAchieveAndIssue(d) {
    var achieveEl = document.getElementById('achieve-list');
    var issueEl = document.getElementById('issue-list');
    if (!achieveEl || !issueEl) return;
    // 🔧 2026-11-03 核心修复：分公司视图必须用分公司自己的数据 d！
    var allData = d || getAllData();
    if (!allData) return;
    var isBranch = currentBranch !== '南部全部';
    var achieves = [], issues = [];
    var t = allData.totals || {};

    // ✅ 【板块1：整体达成 & 市场地位】—— 分公司视图只显示自己
    if (t.achieve >= 1.0) {
      achieves.push(isBranch
        ? '本周目标达成 <span class="hi-green">' + (t.achieve*100).toFixed(1) + '%</span>，完成目标线'
        : '总目标达成 <span class="hi-green">' + (t.achieve*100).toFixed(1) + '%</span>，超额完成目标线 <span class="hi-muted">' + ((t.target||0)*100).toFixed(1) + '%</span>');
    } else if (t.achieve < 0.95 && isBranch) {
      issues.push('目标达成 <span class="hi">仅 ' + (t.achieve*100).toFixed(1) + '%</span>，距目标线 ' + ((t.target||0)*100).toFixed(1) + '% 尚有差距');
    } else if (t.achieve < 0.95) {
      issues.push('总目标达成 <span class="hi">仅 ' + (t.achieve*100).toFixed(1) + '%</span>，距目标线 <span class="hi-muted">' + ((t.target||0)*100).toFixed(1) + '%</span> 尚有差距');
    }
    if (t.yoy !== undefined && t.yoy > 0) {
      achieves.push(isBranch
        ? '销额 <span class="hi-green">同比 +' + (t.yoy*100).toFixed(1) + '%</span>'
        : '创维销额 <span class="hi-green">同比 +' + (t.yoy*100).toFixed(1) + '%</span>，行业增长正循环');
    }
    if (t.ms !== undefined && t.ms_25 !== undefined && t.ms > t.ms_25) {
      achieves.push((isBranch ? '市占率 ' : '创维市占率 ') + '<span class="hi-green">' + (t.ms*100).toFixed(1) + '%</span>，同比提升 <span class="hi-green">' + ((t.ms - t.ms_25)*100).toFixed(1) + 'pct</span>');
    } else if (t.ms !== undefined && t.ms_25 !== undefined && t.ms < t.ms_25) {
      issues.push((isBranch ? '市占率 ' : '创维市占率 ') + '<span class="hi">' + (t.ms*100).toFixed(1) + '%</span>，较同期 <span class="hi">' + (t.ms_25*100).toFixed(1) + '%</span> 下滑 <span class="hi">' + ((t.ms_25 - t.ms)*100).toFixed(1) + 'pct</span>');
    }

    // ✅ 【板块2：分公司表现】—— 分公司视图只分析自己 vs 战区平均
    if (allData.msData) {
      if (isBranch && allData.msData.length === 1) {
        // 🔧 分公司专属分析：自己 vs 战区平均
        var self = allData.msData[0];
        var theater = getAllData(); // 战区数据做对比
        if (theater && theater.msData) {
          var theaterAchAvg = theater.msData.reduce(function(s,r){return s+r.achieve},0) / theater.msData.length;
          var theaterMsAvg = theater.msData.reduce(function(s,r){return s+r.cw_ms},0) / theater.msData.length;
          var theaterLeadAvg = theater.msData.reduce(function(s,r){return s+r.lead_hx},0) / theater.msData.length;
          var rankAch = theater.msData.slice().sort(function(a,b){return b.achieve-a.achieve}).findIndex(function(r){return r.branch===currentBranch}) + 1;
          var rankMs = theater.msData.slice().sort(function(a,b){return b.cw_ms-a.cw_ms}).findIndex(function(r){return r.branch===currentBranch}) + 1;

          if (self.achieve >= theaterAchAvg) achieves.push('达成率 <span class="hi-green">' + (self.achieve*100).toFixed(1) + '%</span>，超战区平均 <span class="hi-green">+' + ((self.achieve-theaterAchAvg)*100).toFixed(1) + 'pct</span>（战区排名 <span class="hi-green">第'+rankAch+'</span>）');
          else issues.push('达成率 <span class="hi">' + (self.achieve*100).toFixed(1) + '%</span>，低于战区平均 ' + ((theaterAchAvg-self.achieve)*100).toFixed(1) + 'pct（战区排名 第'+rankAch+'）');

          if (self.lead_hx >= 0) achieves.push('领先海信 <span class="hi-green">' + self.lead_hx.toFixed(0) + '万</span>');
          else issues.push('落后海信 <span class="hi">' + Math.abs(self.lead_hx).toFixed(0) + '万</span>');

          if (self.cw_ms >= theaterMsAvg) achieves.push('市占率 <span class="hi-green">' + (self.cw_ms*100).toFixed(1) + '%</span>，超战区平均（战区排名 <span class="hi-green">第'+rankMs+'</span>）');
          else issues.push('市占率 <span class="hi">' + (self.cw_ms*100).toFixed(1) + '%</span>，低于战区平均（战区排名 第'+rankMs+'）');
        }
      } else {
        // 战区视图：分析全部 11 家
        var overAch = allData.msData.filter(function(r) { return r.achieve >= 1.05; });
        if (overAch.length > 0) achieves.push('<span class="hi-green">' + overAch.length + '家</span> 分公司达成率 ≥ 105%：' + overAch.slice(0,4).map(function(r){return r.branch}).join('、') + (overAch.length>4?'等':''));
        var leadHx = allData.msData.filter(function(r) { return r.lead_hx >= 0; });
        if (leadHx.length > 0) achieves.push('领先海信 <span class="hi-green">' + leadHx.length + '家</span> 分公司');
        var lagHx = allData.msData.slice().sort(function(a, b) { return a.lead_hx - b.lead_hx; })[0];
        if (lagHx && lagHx.lead_hx < -30) issues.push(lagHx.branch + ' 落后海信 <span class="hi">' + Math.abs(lagHx.lead_hx).toFixed(0) + '万</span>，差距严重');
        var lowAch = allData.msData.slice().sort(function(a, b) { return a.achieve - b.achieve; })[0];
        if (lowAch && lowAch.achieve < 0.92) issues.push(lowAch.branch + ' 目标达成仅 <span class="hi">' + (lowAch.achieve*100).toFixed(1) + '%</span>');
        var veryLowAch = allData.msData.filter(function(r) { return r.achieve < 0.9; });
        if (veryLowAch.length > 0) issues.push('<span class="hi">' + veryLowAch.length + '家</span> 分公司达成率 < 90%：' + veryLowAch.map(function(r){return r.branch}).join('、'));
      }
    }

    // ✅ 【板块3：Q7H 产品力】
    if (allData.q7hData) {
      var q7hTotal = allData.q7hData.reduce(function(s, r) { return s + r.q7h_s; }, 0);
      var u7sTotal = allData.q7hData.reduce(function(s, r) { return s + r.u7s_s; }, 0);
      var totalBoth = q7hTotal + u7sTotal;
      if (totalBoth > 0 && q7hTotal / totalBoth >= 0.6) {
        achieves.push('Q7H vs U7S-PRO 控比 <span class="hi-green">' + (q7hTotal/totalBoth*100).toFixed(1) + '%</span>，产品力持续领先');
      } else if (totalBoth > 0 && u7sTotal > q7hTotal) {
        issues.push('Q7H vs U7S-PRO 控比 <span class="hi">' + (q7hTotal/totalBoth*100).toFixed(1) + '%</span>，U7S-PRO 反超');
      }
      var u7Lead = allData.q7hData.filter(function(r) { return r.u7s_s > r.q7h_s && r.u7s_s >= 3; });
      if (u7Lead.length > 0) issues.push('U7S-PRO 销量 ' + (isBranch ? '反超' : '领先') + ' Q7H');
    }

    // ✅ 【板块4：价格段 & 主战场】
    if (allData.priceBands) {
      var topBand = allData.priceBands.slice().sort(function(a, b) { return b.hy_share - a.hy_share; })[0];
      if (topBand && topBand.cw_share >= 30) achieves.push('主战场 <span class="hi-green">' + topBand.band + '</span> 行业占比 ' + topBand.hy_share.toFixed(1) + '%，创维控比 <span class="hi-green">' + topBand.cw_share.toFixed(1) + '%</span>');
      var weakCands = allData.priceBands.filter(function(b) { return b.hy_share >= 10 && b.cw_share < 20; });
      weakCands.sort(function(a, b) { return a.cw_share - b.cw_share; });
      var worstBand = weakCands[0];
      if (worstBand) issues.push('<span class="hi">' + worstBand.band + '</span> 行业占比 ' + worstBand.hy_share.toFixed(1) + '%，创维控比仅 <span class="hi">' + worstBand.cw_share.toFixed(1) + '%</span>，薄弱环节');
    }

    // ✅ 【板块5：98吋+ 大屏】—— 分公司 vs 战区对比
    if (allData.data98) {
      var totalCw98 = allData.data98.reduce(function(s, r){return s + r.cw_s}, 0);
      var totalHx98 = allData.data98.reduce(function(s, r){return s + r.hx_s}, 0);
      var totalHy98 = allData.data98.reduce(function(s, r){return s + (r.hy_s||0)}, 0);
      var ratio98 = totalHy98 > 0 ? (totalCw98/totalHy98*100).toFixed(1) : '—';
      if (isBranch && totalHy98 > 0) {
        // 分公司自己 98吋+ vs 战区平均
        var theater = getAllData();
        if (theater && theater.data98) {
          var theaterHy98 = theater.data98.reduce(function(s, r){return s + (r.hy_s||0)}, 0);
          var theaterCw98 = theater.data98.reduce(function(s, r){return s + r.cw_s}, 0);
          var theaterRatio98 = theaterHy98 > 0 ? theaterCw98/theaterHy98 : 0;
          if (totalCw98 > totalHx98) achieves.push('98吋+ 创维 <span class="hi-green">' + totalCw98 + '台</span> > 海信 ' + totalHx98 + '台');
          else issues.push('98吋+ 创维 ' + totalCw98 + '台 < 海信 <span class="hi">' + totalHx98 + '台</span>');
        }
      } else {
        // 战区整体判断
        if (totalHy98 > 0 && totalCw98 / totalHy98 >= 0.25) achieves.push('98吋+ 创维行业控比 <span class="hi-green">' + ratio98 + '%</span>，大屏阵地稳固');
        if (totalHy98 > 0 && totalCw98 / totalHy98 < 0.25 && totalHx98 > totalCw98) issues.push('98吋+ 创维 <span class="hi">' + totalCw98 + '台</span> < 海信 ' + totalHx98 + '台，行业控比仅 ' + ratio98 + '%，大屏失守');
      }
    }

    // ✅ 【板块6：TOP40 型号】
    if (allData.top40) {
      var cwInTop40 = allData.top40.filter(function(r) { return r.brand === '创维'; });
      if (cwInTop40.length > 0) {
        var topCw = cwInTop40.slice().sort(function(a,b){return b.amount - a.amount})[0];
        achieves.push('销额最高型号 <span class="hi-green">' + topCw.model + '</span> ' + topCw.amount.toFixed(1) + '万（' + topCw.size + '吋）');
        var wowPosCw = cwInTop40.filter(function(r){ return r.wow_sales !== null && r.wow_sales !== undefined && r.wow_sales > 0; });
        if (wowPosCw.length > 0) achieves.push(wowPosCw.length + ' 款创维型号环比正增长');
      }
      if (cwInTop40.length <= 3) issues.push('仅 <span class="hi">' + cwInTop40.length + '</span> 款创维型号进 TOP40');
    }

    // ✅ 【板块7：品牌格局】—— 分公司 vs 战区对比
    if (allData.brandOverview) {
      var cwBrand = allData.brandOverview.find(function(b){return b.brand === '创维'});
      if (cwBrand) {
        if (isBranch) {
          var theater = getAllData();
          var theaterCw = theater && theater.brandOverview ? theater.brandOverview.find(function(b){return b.brand==='创维'}) : null;
          achieves.push('创维市占率 <span class="hi-green">' + (cwBrand.ms_amount*100).toFixed(1) + '%</span>' + (theaterCw && cwBrand.ms_amount > theaterCw.ms_amount ? '，超战区平均' : ''));
        } else {
          if (cwBrand.rank <= 3) achieves.push('创维品牌排名第 <span class="hi-green">' + cwBrand.rank + '</span>');
          // TCL 反超
          var tclB = allData.brandOverview.find(function(b){return b.brand === 'TCL'});
          if (tclB && tclB.amount > cwBrand.amount) issues.push('<span class="hi-orange">TCL 已超过创维</span>（差 ' + (tclB.amount - cwBrand.amount).toFixed(0) + '万）');
        }
      }
    }

    achieveEl.innerHTML = achieves.length > 0
      ? achieves.map(function(x) { return '<li>' + x + '</li>'; }).join('')
      : '<li style="color:var(--muted)">' + (isBranch ? '分公司本周暂无可圈可点' : '本周暂无突出亮点') + '</li>';
    issueEl.innerHTML = issues.length > 0
      ? issues.map(function(x) { return '<li>' + x + '</li>'; }).join('')
      : '<li style="color:var(--green)">' + (isBranch ? '分公司本周无明显问题' : '本周无重大问题') + '</li>';
  }

  /* ========== 模块12: 下阶段行动建议 ========== */
  function renderActionCards(d) {
    var wrap = document.getElementById('action-cards');
    if (!wrap) return;
    var allData = getAllData();
    if (!allData) return;

    var cards = [];
    var t = allData.totals || {};

    // 1. 高达成分公司继续保持 / 低达成重点攻坚
    if (allData.msData) {
      var lowAchList = allData.msData.filter(function(r) { return r.achieve < 0.95; }).slice().sort(function(a, b) { return a.achieve - b.achieve; });
      if (lowAchList.length > 0) {
        var worst3 = lowAchList.slice(0, 3);
        cards.push({
          title: '<span class="hi">重点攻坚</span> ' + worst3.map(function(r){return r.branch}).join('、') + ' 分公司',
          meta: '<span class="kw-tag">优先级</span>达成率最低 ' + worst3.map(function(r){return r.branch + ' ' + (r.achieve*100).toFixed(0) + '%'}).join(' / ') + '，建议 Q7H + 大屏产品定向促销'
        });
      }
    }

    // 2. 落后海信分公司反超
    if (allData.msData) {
      var lagHxList = allData.msData.filter(function(r) { return r.lead_hx < -20; }).slice().sort(function(a, b) { return a.lead_hx - b.lead_hx; });
      if (lagHxList.length > 0) {
        cards.push({
          title: '<span class="hi-blue">反超海信</span> ' + lagHxList.length + '家落后分公司',
          meta: '<span class="kw-tag">竞品对标</span>最大缺口 ' + lagHxList[0].branch + '（差距 ' + Math.abs(lagHxList[0].lead_hx).toFixed(0) + '万），建议 85吋+ 大屏定向发力'
        });
      }
    }

    // 3. 薄弱价格段补强
    if (allData.priceBands) {
      var worstBand = allData.priceBands.slice().sort(function(a, b) { return a.cw_share - b.cw_share; })[0];
      if (worstBand && worstBand.cw_share < 20) {
        cards.push({
          title: '<span class="hi-orange">补强</span> ' + worstBand.band + ' 价格段',
          meta: '<span class="kw-tag">产品</span>创维控比仅 ' + worstBand.cw_share.toFixed(1) + '%，行业占比 ' + worstBand.hy_share.toFixed(1) + '%，建议针对性布局'
        });
      }
    }

    // 4. 主战场价格段加强
    if (allData.priceBands) {
      var topBand = allData.priceBands.slice().sort(function(a, b) { return b.hy_share - a.hy_share; })[0];
      if (topBand) {
        cards.push({
          title: '<span class="hi-green">巩固</span> ' + topBand.band + ' 主战场优势',
          meta: '<span class="kw-tag">市场</span>行业占比 ' + topBand.hy_share.toFixed(1) + '%，创维控比 ' + topBand.cw_share.toFixed(1) + '%，建议加大渠道推力'
        });
      }
    }

    // 5. Q7H 反超 U7S-PRO 的分公司加强
    if (allData.q7hData) {
      var u7LeadList = allData.q7hData.filter(function(r) { return r.u7s_s > r.q7h_s; });
      if (u7LeadList.length > 0) {
        cards.push({
          title: '<span class="hi">Q7H 控场</span> ' + u7LeadList.length + '家被 U7S-PRO 反超的分公司',
          meta: '<span class="kw-tag">产品力</span>' + u7LeadList.slice(0, 3).map(function(r){return r.branch + ' U7S ' + r.u7s_s + '台'}).join(' / ') + '，建议 Q7H 加强终端主推'
        });
      }
    }

    // 6. 新品上市跟进
    var firstSeenMap = getFirstSeenMap();
    var curWeek = currentKey;
    if (d && d.top40) {
      var newThisWeek = d.top40.filter(function(x) { return getModelAge(x.brand, x.model, curWeek) === 0; });
      var newCw = newThisWeek.filter(function(x) { return x.brand === '创维'; });
      if (newCw.length >= 2) {
        cards.push({
          title: '<span class="hi-green">新品</span> ' + newCw.length + ' 款本周首上榜型号跟踪',
          meta: '<span class="kw-tag">新品效率</span>' + newCw.map(function(x){return x.model}).join(' / ') + '，建议持续观察环比走势'
        });
      }
    }

    // 保证至少 4 张卡
    if (cards.length < 4 && allData.msData) {
      cards.push({
        title: '<span class="hi">持续复盘</span> 每周各分公司环比同比数据',
        meta: '<span class="kw-tag">节奏</span>及时介入下滑严重分公司，确保达成率稳步推进'
      });
    }

    var html = cards.map(function(c, i) {
      return '<div class="action-card">' +
        '<div class="action-num">' + (i+1) + '</div>' +
        '<div class="action-title">' + c.title + '</div>' +
        '<div class="action-meta">' + c.meta + '</div>' +
      '</div>';
    }).join('');
    wrap.innerHTML = html;
  }

  /* ========== 导出长图 ========== */
  function exportFullReport() {
    if (typeof html2canvas === 'undefined') { alert('html2canvas 未加载，请检查网络'); return; }
    var btn = document.getElementById('export-screenshot');
    if (!btn) return;

    btn.textContent = '⏳ 生成中...';
    btn.disabled = true;
    btn.style.opacity = '0.6';

    // Step 0: 隐藏 UI 元素
    var hiddenEls = [];
    var origStyles = [];
    function hide(el) {
      if (el) { hiddenEls.push(el); origStyles.push(el.style.display); el.style.display = 'none'; }
    }
    hide(document.querySelector('.nav-bar'));
    hide(btn);
    var footer = document.querySelector('footer');
    if (footer) { hiddenEls.push(footer); origStyles.push(footer.style.display); footer.style.display = 'none'; }

    // Step 1: 展开表格容器
    var tableWraps = document.querySelectorAll('.table-wrap');
    var wrapOrig = [];
    tableWraps.forEach(function(tw) {
      wrapOrig.push({ el: tw, mh: tw.style.maxHeight, ov: tw.style.overflow, oy: tw.style.overflowY });
      tw.style.maxHeight = 'none'; tw.style.overflow = 'visible'; tw.style.overflowY = 'visible';
    });

    // Step 2: 白底
    var body = document.body;
    var origBg = body.style.background;
    body.style.background = '#ffffff';

    // Step 3: ECharts → 图片
    var chartParents = [];
    allCharts.forEach(function(chart) {
      var dom = chart.getDom();
      if (dom && dom.parentNode) {
        var dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
        var img = document.createElement('img');
        img.src = dataUrl;
        img.style.width = dom.style.width || dom.offsetWidth + 'px';
        img.style.height = dom.style.height || dom.offsetHeight + 'px';
        img.style.display = 'block';
        chartParents.push({ parent: dom.parentNode, original: dom, img: img });
        dom.parentNode.replaceChild(img, dom);
      }
    });

    // Step 4: html2canvas 截取
    setTimeout(function() {
      var pageH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      var dynScale = Math.min(2, Math.max(0.5, 16000 / pageH));
      html2canvas(document.body, {
        useCORS: true,
        scale: dynScale,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: document.body.scrollWidth,
        windowHeight: pageH,
        height: pageH
      }).then(function(canvas) {
        // 恢复图表
        chartParents.forEach(function(p) { p.parent.replaceChild(p.original, p.img); });
        allCharts.forEach(function(c) { try { c.dispose(); } catch(e) {} });
        allCharts = [];
        chartParents.forEach(function(p) {
          var c = echarts.init(p.original, null, { renderer: 'svg' });
          allCharts.push(c);
        });
        renderAll();

        // 恢复 UI
        hiddenEls.forEach(function(el, i) { el.style.display = origStyles[i]; });
        wrapOrig.forEach(function(s) { s.el.style.maxHeight = s.mh; s.el.style.overflow = s.ov; s.el.style.overflowY = s.oy; });
        body.style.background = origBg;

        // 下载
        var ts = new Date().toISOString().slice(0,10);
        var link = document.createElement('a');
        link.download = '创维电视周报_' + (currentBranch === '南部全部' ? '全区' : currentBranch) + '_' + currentKey + '_' + ts + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();

        btn.textContent = '📷 导出长图';
        btn.disabled = false;
        btn.style.opacity = '1';
      }).catch(function(err) {
        chartParents.forEach(function(p) { p.parent.replaceChild(p.original, p.img); });
        allCharts.forEach(function(c) { try { c.dispose(); } catch(e) {} });
        allCharts = [];
        chartParents.forEach(function(p) {
          var c = echarts.init(p.original, null, { renderer: 'svg' });
          allCharts.push(c);
        });
        renderAll();
        hiddenEls.forEach(function(el, i) { el.style.display = origStyles[i]; });
        wrapOrig.forEach(function(s) { s.el.style.maxHeight = s.mh; s.el.style.overflow = s.ov; s.el.style.overflowY = s.oy; });
        body.style.background = origBg;
        btn.textContent = '📷 导出长图';
        btn.disabled = false;
        btn.style.opacity = '1';
        console.error('Screenshot failed:', err);
        alert('导出失败，请重试');
      });
    }, 600);
  }

  /* ========== 主渲染 ========== */
  // 🔧 2026-11-03 每个函数加 try-catch，单个崩溃不影响其他模块
  function safe(fn, name) {
    try { fn(); } catch(e) { console.error('❌ [' + name + '] 渲染失败:', e.message); console.error(e.stack); }
  }
  function renderAll() {
    disposeCharts();
    var d = getData();
    if (!d) { console.warn('week_report: 无法获取数据', currentKey, currentBranch); return; }
    safe(function(){ updateHeader(); }, 'updateHeader');
    safe(function(){ renderKPIs(d); }, 'renderKPIs');
    safe(function(){ renderBrand(d); }, 'renderBrand');
    safe(function(){ renderBranch(d); }, 'renderBranch');
    safe(function(){ renderTop40(d); }, 'renderTop40');
    safe(function(){ renderPriceBands(d); }, 'renderPriceBands');
    safe(function(){ renderSizeSegs(d); }, 'renderSizeSegs');
    safe(function(){ renderSize98(d); }, 'renderSize98');
    safe(function(){ renderQ7H(d); }, 'renderQ7H');
    safe(function(){ renderInsBrand(d); }, 'renderInsBrand');
    safe(function(){ renderInsBranch(d); }, 'renderInsBranch');
    safe(function(){ renderInsTop40(d); }, 'renderInsTop40');
    safe(function(){ renderInsPrice(d); }, 'renderInsPrice');
    safe(function(){ renderInsSize(d); }, 'renderInsSize');
    safe(function(){ renderIns98(d); }, 'renderIns98');
    safe(function(){ renderInsQ7H(d); }, 'renderInsQ7H');
    safe(function(){ renderNewProductTable(d); }, 'renderNewProductTable');
    safe(function(){ renderAchieveAndIssue(d); }, 'renderAchieveAndIssue');
  }

  /* ========== 事件绑定 ========== */
  // 周次选择
  var ws = document.getElementById('week-selector');
  if (ws) ws.addEventListener('change', function() { currentKey = this.value; currentMode = 'weekly'; switchSelectorUI(); renderAll(); });
  // 月度选择
  var ms = document.getElementById('month-selector');
  if (ms) ms.addEventListener('change', function() { currentKey = this.value; currentMode = 'monthly'; switchSelectorUI(); renderAll(); });
  // 模式切换
  var mt = document.getElementById('mode-toggle');
  if (mt) mt.addEventListener('click', function() {
    if (currentMode === 'weekly') { currentMode = 'monthly'; currentKey = (ms && ms.value) || '10月'; mt.textContent = '周度'; }
    else { currentMode = 'weekly'; currentKey = (ws && ws.value) || '26W43'; mt.textContent = '月度'; }
    switchSelectorUI(); renderAll();
  });
  function switchSelectorUI() {
    if (ws) ws.style.display = currentMode === 'weekly' ? '' : 'none';
    if (ms) ms.style.display = currentMode === 'monthly' ? '' : 'none';
  }
  // 分公司选择
  var bs = document.getElementById('branch-selector');
  if (bs) bs.addEventListener('change', function() { currentBranch = this.value; renderAll(); });

  // TOP40 切换按钮
  document.querySelectorAll('#top40-tab-amount, #top40-tab-wow').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#top40-tab-amount, #top40-tab-wow').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      top40ViewMode = btn.id === 'top40-tab-wow' ? 'wow' : 'amount';
      renderTop40(getData());
    });
  });
  // 分公司指标切换
  document.querySelectorAll('#sec-branch .toggle-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#sec-branch .toggle-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderBranch(getData());
    });
  });

  // 窗口 resize 自适应
  window.addEventListener('resize', function() {
    allCharts.forEach(function(c) { try { c.resize(); } catch(e) {} });
  });

  // 导出长图按钮
  var exportBtn = document.getElementById('export-screenshot');
  if (exportBtn) exportBtn.addEventListener('click', exportFullReport);

  // 初始渲染
  if (window.DASHBOARD_ALL) {
    // 动态重建周次 option 列表（从最新到最旧）
    if (ws && DASHBOARD_ALL.allWeeks) {
      ws.innerHTML = '';
      var weeksSorted = DASHBOARD_ALL.allWeeks.slice().reverse();
      weeksSorted.forEach(function(w) {
        var opt = document.createElement('option');
        opt.value = w; opt.textContent = w;
        if (w === DASHBOARD_ALL.currentWeek) opt.selected = true;
        ws.appendChild(opt);
      });
    }
    // 自动更新到最新周
    if (DASHBOARD_ALL.currentWeek) {
      currentKey = DASHBOARD_ALL.currentWeek;
    }
    renderAll();
  } else {
    console.error('week_report.js: DASHBOARD_ALL 未加载，请检查 all_data.js');
  }
})();

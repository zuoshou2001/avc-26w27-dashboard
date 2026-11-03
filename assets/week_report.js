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
      var wowStr = r.wow !== undefined && r.wow !== null ?
        '<span style="color:' + (r.wow >= 0 ? 'var(--green)' : 'var(--accent)') + '">' + (r.wow >= 0 ? '+' : '') + (r.wow*100).toFixed(1) + '%</span>' : '-';
      var yoyStr = r.yoy !== undefined && r.yoy !== null ?
        '<span style="color:' + (r.yoy >= 0 ? 'var(--green)' : 'var(--accent)') + '">' + (r.yoy >= 0 ? '+' : '') + (r.yoy*100).toFixed(1) + '%</span>' : '-';
      var achTag = r.achieve >= 1.0 ? 'tag-green' : r.achieve >= 0.9 ? 'tag-yellow' : 'tag-red';
      html += '<tr><td class="rank">' + (i+1) + '</td><td><strong>' + r.branch + '</strong></td>';
      html += '<td class="num">' + r.cw.toFixed(2) + '万</td>';
      html += '<td class="num">' + (r.cw_ms*100).toFixed(1) + '%</td>';
      html += '<td class="num">' + (r.target*100).toFixed(1) + '%</td>';
      html += '<td class="num"><span class="tag ' + achTag + '">' + (r.achieve*100).toFixed(1) + '%</span></td>';
      html += '<td class="num">' + wowStr + '</td><td class="num">' + yoyStr + '</td>';
      var gapCls = r.lead_hx >= 0 ? 'var(--green)' : 'var(--accent)';
      html += '<td class="num" style="color:' + gapCls + '">' + (r.lead_hx >= 0 ? '+' : '') + r.lead_hx.toFixed(1) + '</td></tr>';
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
      var wowStr = r.wow_sales !== null ?
        '<span style="color:' + (r.wow_sales >= 0 ? 'var(--green)' : 'var(--accent)') + '">' +
        (r.wow_sales >= 0 ? '▲ +' : '▼ ') + (r.wow_sales*100).toFixed(1) + '%</span>' : '-';

      html += '<tr>';
      html += '<td class="rank">' + (i+1) + '</td>';
      html += '<td><span class="tag ' + bTag + '">' + r.brand + '</span></td>';
      html += '<td><strong>' + r.model + '</strong></td>';
      html += '<td>' + (r.size || '-') + '</td>';
      html += '<td class="num">' + r.sales + '</td>';
      html += '<td class="num">' + totalSales > 0 ? ((r.sales/totalSales*100).toFixed(1) + '%') : '-</td>';
      html += '<td class="num"><strong>' + r.amount.toFixed(2) + '</strong></td>';
      html += '<td class="num">' + totalAmount > 0 ? ((r.amount/totalAmount*100).toFixed(1) + '%') : '-</td>';
      html += '<td class="num">' + totalAmount > 0 ? ((cumAmt/totalAmount*100).toFixed(1) + '%') : '-</td>';
      html += '<td class="num">¥' + r.avg_price.toLocaleString() + '</td>';
      html += '<td class="num">' + wowStr + '</td>';
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
      html += '<td class="num" style="color:' + (avgDiff >= 0 ? 'var(--green)' : 'var(--accent)') + '">' + (avgDiff >= 0 ? '+' : '') + avgDiff.toFixed(1) + '%</td></tr>';
    });
    document.getElementById('price-table-body').innerHTML = html;
  }

  /* ========== 模块6: 尺寸段 ========== */
  function renderSizeSegs(d) {
    if (!d) return;
    // 行业饼图
    mkChart(document.getElementById('chart-size-pie-hy'), {
      animation: false, tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: ink, fontSize: 10 } },
      series: [{ type: 'pie', radius: ['40%', '70%'], data: (d.sizeList||[]).map(function(r) { return { name: r.size, value: r.amount }; }),
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

    // 表格
    var html = '';
    (d.sizeList||[]).forEach(function(r) {
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
      var ratioHx = r.hx_s > 0 ? (r.cw_s / r.hx_s).toFixed(1) : '-';
      html += '<tr><td><strong>' + r.branch + '</strong></td>';
      html += '<td class="num">' + r.cw_s + '</td><td class="num">' + r.cw_e.toFixed(2) + '</td>';
      html += '<td class="num">' + r.hx_s + '</td><td class="num">' + r.tcl_s + '</td>';
      html += '<td class="num" style="color:' + (ratioHx !== '-' && +ratioHx >= 1 ? 'var(--green)' : 'var(--accent)') + '">' + ratioHx + 'x</td></tr>';
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
        var ratio = r.u7s_s > 0 ? (r.q7h_s / r.u7s_s).toFixed(1) : '∞';
        html += '<tr><td><strong>' + r.branch + '</strong></td>';
        html += '<td class="num" style="color:var(--accent)">' + r.q7h_s + '</td><td class="num">' + r.q7h_e.toFixed(2) + '</td>';
        html += '<td class="num" style="color:var(--blue)">' + r.u7s_s + '</td><td class="num">' + r.u7s_e.toFixed(2) + '</td>';
        html += '<td class="num"><strong>' + ratio + 'x</strong></td></tr>';
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

  /* ========== 模块9: 结论与建议（自动生成）========== */
  function generateInsights(d) {
    var problems = [], suggestions = [];
    var allData = getAllData(); if (!allData) return;

    // 主要问题
    // 1. 环比负分公司
    if (allData.msData) {
      allData.msData.forEach(function(r) {
        if (r.wow !== undefined && r.wow !== null && r.wow < 0) {
          problems.push(r.branch + ' 环比 ▼ ' + (r.wow*100).toFixed(1) + '%');
        }
        if (r.achieve !== undefined && r.achieve < 0.9) {
          problems.push(r.branch + ' 目标达成仅 ' + (r.achieve*100).toFixed(1) + '%（低于 90%）');
        }
      });
    }
    // 2. TOP40 集中度
    if (allData.top40 && allData.totals) {
      var top2Amt = allData.top40.slice(0, 2).reduce(function(s, r) { return s + r.amount; }, 0);
      var conc = allData.totals.hy > 0 ? (top2Amt / allData.totals.hy * 100) : 0;
      if (conc > 25) {
        problems.push('TOP2 型号集中度高达 ' + conc.toFixed(1) + '%，头部依赖风险较大');
      }
    }
    // 3. 落后海信的分公司
    if (allData.msData) {
      var lagging = allData.msData.filter(function(r) { return r.lead_hx < 0; });
      if (lagging.length > 0) {
        lagging.sort(function(a, b) { return a.lead_hx - b.lead_hx; });
        var worst = lagging[0];
        problems.push(worst.branch + ' 落后海信最多（' + Math.abs(worst.lead_hx).toFixed(1) + '万）');
      }
    }

    // 行动建议
    // 1. 价格带分析
    if (allData.priceBands) {
      allData.priceBands.sort(function(a, b) { return b.hy_share - a.hy_share; });
      var topBand = allData.priceBands[0];
      suggestions.push(topBand.band + ' 价格带是行业主战场（占行业销额 ' + topBand.hy_share.toFixed(1) + '%），创维占比 ' + topBand.cw_share.toFixed(1) + '%，应加强该价位段产品力');
      // 低份额价格带
      var lowBand = allData.priceBands.slice().sort(function(a, b) { return a.cw_share - b.cw_share; })[0];
      if (lowBand.cw_share < 15) {
        suggestions.push(lowBand.band + ' 份额仅 ' + lowBand.cw_share.toFixed(1) + '%，考虑针对性布局');
      }
    }
    // 2. 尺寸带
    if (allData.sizeList && allData.totals) {
      allData.sizeList.sort(function(a, b) { return b.amount - a.amount; });
      var topSize = allData.sizeList[0];
      suggestions.push(topSize.size + ' 是第一大尺寸段（销额 ' + topSize.amount.toFixed(1) + '万），建议巩固优势');
    }
    // 3. 海信领先的分公司应加强 Q7H 控场
    if (allData.q7hData) {
      allData.q7hData.forEach(function(r) {
        if (r.u7s_s > r.q7h_s && r.u7s_s >= 5) {
          suggestions.push(r.branch + ' U7S-PRO 销量（' + r.u7s_s + '台）超过 Q7H（' + r.q7h_s + '台），建议加强 Q7H 控场');
        }
      });
    }

    // 渲染
    var pp = document.getElementById('insight-problems'); if (pp) {
      pp.innerHTML = problems.length > 0 ? problems.map(function(p) { return '<li>' + p + '</li>'; }).join('') : '<li style="color:var(--green)">本周无重大问题</li>';
    }
    var ss = document.getElementById('insight-suggestions'); if (ss) {
      ss.innerHTML = suggestions.length > 0 ? suggestions.map(function(s) { return '<li>' + s + '</li>'; }).join('') : '<li>继续观察</li>';
    }
  }

  /* ========== 主渲染 ========== */
  function renderAll() {
    disposeCharts();
    var d = getData();
    if (!d) { console.warn('week_report: 无法获取数据', currentKey, currentBranch); return; }
    updateHeader();
    renderKPIs(d);
    renderBrand(d);
    renderBranch(d);
    renderTop40(d);
    renderPriceBands(d);
    renderSizeSegs(d);
    renderSize98(d);
    renderQ7H(d);
    generateInsights(d);
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

  // 初始渲染
  if (window.DASHBOARD_ALL) {
    // 自动更新到最新周
    if (DASHBOARD_ALL.currentWeek) {
      currentKey = DASHBOARD_ALL.currentWeek;
      if (ws) ws.value = currentKey;
    }
    renderAll();
  } else {
    console.error('week_report.js: DASHBOARD_ALL 未加载，请检查 all_data.js');
  }
})();

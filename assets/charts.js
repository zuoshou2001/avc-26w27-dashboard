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
  var currentKey = '26W27';

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
    if (currentMode === 'weekly') {
      return DASHBOARD_ALL.data[currentKey] || DASHBOARD_ALL.data['26W27'];
    } else {
      return DASHBOARD_ALL.monthly[currentKey] || DASHBOARD_ALL.monthly['7月'];
    }
  }

  function updateHeader() {
    var headerWeek = document.getElementById('header-week');
    var headerDate = document.getElementById('header-date');
    var headerYoy = document.getElementById('header-yoy-ref');
    if (!headerWeek) return;

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
    // Sections that only exist in weekly data
    var weeklyOnlySections = ['size-98', 'top20', 'size-analysis', 'size-top5', 'q7h-compare'];
    weeklyOnlySections.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.style.display = (currentMode === 'weekly') ? '' : 'none';
      }
    });

    // TOC items for weekly-only sections
    var tocItems = document.querySelectorAll('.toc-item');
    tocItems.forEach(function(item) {
      var href = item.getAttribute('href');
      if (href === '#size-98' || href === '#top20' || href === '#size-analysis') {
        item.style.display = (currentMode === 'weekly') ? '' : 'none';
      }
    });

    // Update TOC grid columns
    var tocGrid = document.querySelector('.toc-grid');
    if (tocGrid) {
      tocGrid.style.gridTemplateColumns = (currentMode === 'weekly') ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)';
    }

    // Update badge text
    var badges = document.querySelectorAll('.section-header .badge');
    badges.forEach(function(b) {
      if (currentMode === 'weekly') {
        b.textContent = currentKey + ' 南部战区';
      } else {
        b.textContent = currentKey + ' 南部战区';
      }
    });
  }

  function renderAll() {
    // Dispose old charts
    allCharts.forEach(function(c) { c.dispose(); });
    allCharts = [];

    var d = getData();
    if (!d) return;

    updateHeader();
    updateKPIs(d);
    updateSectionVisibility(d);

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
      // Totals row
      if (d.totals) {
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

    // ========== WEEKLY-ONLY SECTIONS ==========
    if (currentMode === 'weekly') {

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

    } // end weekly-only

    // ===== Monthly mode: show monthly overview =====
    if (currentMode === 'monthly') {
      // Monthly mode only has brand overview + MS overview, already rendered above
      // Add a monthly summary insight card
      var msSection = document.getElementById('ms-overview');
      var existingInsight = msSection ? msSection.querySelector('.insight-card') : null;
      if (existingInsight) {
        var months = DASHBOARD_ALL.allMonths || [];
        var insightHtml = '';
        if (months.length > 1) {
          var prevMonth = months[months.indexOf(currentKey) - 1];
          if (prevMonth && DASHBOARD_ALL.monthly[prevMonth]) {
            var prevData = DASHBOARD_ALL.monthly[prevMonth];
            var msChange = d.totals ? ((d.totals.ms - prevData.totals.ms)*100).toFixed(1) : '0';
            var cwChange = d.totals ? (d.totals.cw - prevData.totals.cw).toFixed(1) : '0';
            insightHtml = '<h4>💡 月度关键洞察</h4><p>创维' + currentKey + '累计销额' + d.totals.cw.toFixed(1) + '万，市占率' + (d.totals.ms*100).toFixed(1) + '%。';
            if (prevMonth) {
              insightHtml += '相比' + prevMonth + '累计，市占率变化' + (msChange >= 0 ? '+' : '') + msChange + '%，销额变化' + (cwChange >= 0 ? '+' : '') + cwChange + '万。';
            }
            insightHtml += '</p>';
          } else {
            insightHtml = '<h4>💡 月度关键洞察</h4><p>创维' + currentKey + '累计销额' + d.totals.cw.toFixed(1) + '万，市占率' + (d.totals.ms*100).toFixed(1) + '%。海信以' + d.totals.hx.toFixed(1) + '万领先，差距' + (d.totals.cw - d.totals.hx).toFixed(1) + '万。</p>';
          }
        } else {
          insightHtml = '<h4>💡 月度关键洞察</h4><p>创维' + currentKey + '累计销额' + d.totals.cw.toFixed(1) + '万，市占率' + (d.totals.ms*100).toFixed(1) + '%。海信以' + d.totals.hx.toFixed(1) + '万领先，差距' + (d.totals.cw - d.totals.hx).toFixed(1) + '万。</p>';
        }
        existingInsight.innerHTML = insightHtml;
      }
    }
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

  window.addEventListener('resize', function() {
    allCharts.forEach(function(c) { c.resize(); });
  });
})();
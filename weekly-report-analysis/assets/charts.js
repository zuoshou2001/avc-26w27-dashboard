/* 创维电视南部战区 26W43 周报分析报告 · Charts */
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#e63946';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#457b9d';
  var blue = style.getPropertyValue('--blue').trim() || '#2563eb';
  var green = style.getPropertyValue('--green').trim() || '#16a34a';
  var orange = style.getPropertyValue('--orange').trim() || '#ea580c';
  var purple = style.getPropertyValue('--purple').trim() || '#7c3aed';
  var teal = style.getPropertyValue('--teal').trim() || '#0d9488';
  var gold = style.getPropertyValue('--gold').trim() || '#ca8a04';
  var ink = style.getPropertyValue('--ink').trim() || '#0f172a';
  var muted = style.getPropertyValue('--muted').trim() || '#64748b';
  var rule = style.getPropertyValue('--rule').trim() || '#e2e8f0';
  var ruleSoft = style.getPropertyValue('--rule-soft').trim() || '#f1f5f9';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#ffffff';

  // ============ 26W43 真实数据 ============
  var TOTALS = { cw: 792.56, hx: 929.00, tcl: 666.55, hy: 3041.02, ms: 0.2606, ms_25: 0.2169, yoy: 0.0437, achieve: 1.065, target: 0.2447 };

  var BRAND = [
    { rank:1, brand:'海信', amount:929.00, sales:1136, ms_amount:0.3055, avg_price:8178, yoy_ms:-0.0012 },
    { rank:2, brand:'创维', amount:792.56, sales:1195, ms_amount:0.2606, avg_price:6632, yoy_ms:0.0437 },
    { rank:3, brand:'TCL',  amount:666.55, sales:975,  ms_amount:0.2192, avg_price:6836, yoy_ms:-0.0052 },
    { rank:4, brand:'三星', amount:157.89, sales:105,  ms_amount:0.0519, avg_price:15037, yoy_ms:-0.0294 },
    { rank:5, brand:'索尼', amount:136.36, sales:80,   ms_amount:0.0448, avg_price:17046, yoy_ms:0.0078 },
    { rank:6, brand:'东芝', amount:125.52, sales:120,  ms_amount:0.0413, avg_price:10460, yoy_ms:0.0088 },
    { rank:7, brand:'华为', amount:90.26,  sales:102,  ms_amount:0.0297, avg_price:8849, yoy_ms:-0.0079 },
    { rank:8, brand:'长虹', amount:70.37,  sales:208,  ms_amount:0.0231, avg_price:3383, yoy_ms:0.0061 },
    { rank:9, brand:'海尔', amount:23.18,  sales:55,   ms_amount:0.0076, avg_price:4215, yoy_ms:0.0048 },
    { rank:10, brand:'康佳', amount:15.66, sales:49,   ms_amount:0.0052, avg_price:3197, yoy_ms:-0.017 }
  ];

  var MSDATA = [
    { branch:'深圳', cw:137.72, hx:151.33, tcl:125.39, hy:547.43, cw_ms:0.2516, target:0.203, achieve:1.24, wow:0.076, yoy:0.113, lead_hx:-13.61 },
    { branch:'佛山', cw:137.69, hx:139.18, tcl:106.97, hy:547.02, cw_ms:0.2517, target:0.210, achieve:1.20, wow:0.019, yoy:0.161, lead_hx:-1.49 },
    { branch:'闽北', cw:90.65,  hx:79.28,  tcl:93.57,  hy:325.70, cw_ms:0.2783, target:0.240, achieve:1.16, wow:-0.038, yoy:0.064, lead_hx:11.37 },
    { branch:'广州', cw:98.50,  hx:123.48, tcl:92.18,  hy:377.28, cw_ms:0.2611, target:0.235, achieve:1.11, wow:0.025, yoy:0.115, lead_hx:-24.98 },
    { branch:'桂北', cw:55.43,  hx:68.39,  tcl:48.57,  hy:211.04, cw_ms:0.2626, target:0.246, achieve:1.07, wow:0.060, yoy:0.063, lead_hx:-12.96 },
    { branch:'潮汕', cw:50.06,  hx:58.12,  tcl:45.71,  hy:190.92, cw_ms:0.2622, target:0.256, achieve:1.02, wow:-0.041, yoy:0.052, lead_hx:-8.06 },
    { branch:'桂南', cw:58.96,  hx:78.18,  tcl:65.46,  hy:246.81, cw_ms:0.2389, target:0.251, achieve:0.95, wow:0.018, yoy:0.058, lead_hx:-19.22 },
    { branch:'闽南', cw:46.75,  hx:60.99,  tcl:43.80,  hy:205.10, cw_ms:0.2279, target:0.242, achieve:0.94, wow:-0.015, yoy:0.035, lead_hx:-14.24 },
    { branch:'海南', cw:50.72,  hx:73.19,  tcl:35.63,  hy:219.70, cw_ms:0.2309, target:0.250, achieve:0.92, wow:0.041, yoy:0.046, lead_hx:-22.47 },
    { branch:'滇南', cw:29.12,  hx:35.21,  tcl:25.91,  hy:112.75, cw_ms:0.2583, target:0.279, achieve:0.93, wow:0.022, yoy:0.071, lead_hx:-6.09 },
    { branch:'云南', cw:36.28,  hx:61.65,  tcl:43.37,  hy:191.98, cw_ms:0.1890, target:0.227, achieve:0.83, wow:0.019, yoy:0.071, lead_hx:-25.37 }
  ];

  var TOP40 = [
    { rank:1, brand:'三星', model:'QA85QN80FAJ', amount:113.13, sales:70, avg_price:16162, size:'85', wow_sales:null },
    { rank:2, brand:'海信', model:'85U7S-PRO', amount:101.25, sales:68, avg_price:14890, size:'85', wow_sales:null },
    { rank:3, brand:'TCL',  model:'98Q8H',        amount:74.15, sales:28, avg_price:26482, size:'98', wow_sales:null },
    { rank:4, brand:'三星', model:'QA75QN80FAJ', amount:53.28, sales:36, avg_price:14800, size:'75', wow_sales:null },
    { rank:5, brand:'海信', model:'75E5K',        amount:50.12, sales:62, avg_price:8084,  size:'75', wow_sales:null },
    { rank:6, brand:'索尼', model:'KD-75X85L',    amount:48.75, sales:30, avg_price:16250, size:'75', wow_sales:null },
    { rank:7, brand:'创维', model:'75Q7H',         amount:39.31, sales:36, avg_price:10920, size:'75', wow_sales:0.636 },
    { rank:8, brand:'东芝', model:'75C350KP',      amount:37.88, sales:42, avg_price:9019,  size:'75', wow_sales:null },
    { rank:9, brand:'创维', model:'85Q7H',         amount:55.02, sales:39, avg_price:14108, size:'85', wow_sales:null },
    { rank:10, brand:'华为', model:'MEMEA75',       amount:35.66, sales:32, avg_price:11144, size:'75', wow_sales:null },
    { rank:11, brand:'TCL',  model:'85Q9K',         amount:34.94, sales:27, avg_price:12941, size:'85', wow_sales:null },
    { rank:12, brand:'海信', model:'65E5K',         amount:33.18, sales:48, avg_price:6913,  size:'65', wow_sales:null },
    { rank:13, brand:'创维', model:'55Q7H',         amount:25.99, sales:45, avg_price:5776,  size:'55', wow_sales:null },
    { rank:14, brand:'创维', model:'65Q7H',         amount:19.44, sales:23, avg_price:8453,  size:'65', wow_sales:null },
    { rank:15, brand:'TCL',  model:'65Q9K',         amount:18.65, sales:29, avg_price:6431,  size:'65', wow_sales:null }
  ];

  var PRICE_BANDS = [
    { band:'<1万',    cw_sales:971,  cw_amount:477.33, cw_share:32.27, hy_sales:3100, hy_amount:1479.13, hy_share:48.64 },
    { band:'1-1.5万', cw_sales:167,  cw_amount:207.53, cw_share:30.57, hy_sales:555,  hy_amount:678.82,  hy_share:22.32 },
    { band:'1.5-2万', cw_sales:46,   cw_amount:79.94,  cw_share:20.09, hy_sales:237,  hy_amount:397.85,  hy_share:13.08 },
    { band:'2-3万',   cw_sales:10,   cw_amount:24.55,  cw_share:6.59,  hy_sales:159,  hy_amount:372.88,  hy_share:12.26 },
    { band:'>3万',    cw_sales:1,    cw_amount:3.20,   cw_share:2.85,  hy_sales:28,   hy_amount:112.34,  hy_share:3.69 }
  ];

  var SIZE_LIST = [
    { size:'98吋+',  sales:108, amount:277.38, avg_price:25683 },
    { size:'85吋',   sales:257, amount:427.21, avg_price:16623 },
    { size:'75吋',   sales:1231, amount:1283.36, avg_price:10425 },
    { size:'65吋',   sales:972, amount:803.14,  avg_price:8263 },
    { size:'55吋及以下', sales:848, amount:250.01, avg_price:2948 }
  ];
  var SIZE_SEGS = ['98吋+','85吋','75吋','65吋','55吋及以下'];
  var CW_SIZE = [
    { size:'98吋+',  sales:136, amount:216.21, avg_price:15898 },
    { size:'85吋',   sales:112, amount:185.33, avg_price:16547 },
    { size:'75吋',   sales:647, amount:377.48, avg_price:5834 },
    { size:'65吋',   sales:300, amount:125.45, avg_price:4182 },
    { size:'55吋及以下', sales:0, amount:0, avg_price:0 }
  ];
  var CW_SHARES = [42.8, 28.9, 29.4, 15.6, 13.6];
  var HX_SHARES = [30.2, 28.0, 25.5, 22.8, 18.9];
  var TCL_SHARES = [27.0, 23.1, 20.8, 20.5, 22.1];

  var DATA98 = [
    { branch:'佛山', cw_s:30, cw_e:75.21, hx_s:25, tcl_s:18 },
    { branch:'深圳', cw_s:25, cw_e:68.34, hx_s:19, tcl_s:20 },
    { branch:'汕头', cw_s:25, cw_e:62.15, hx_s:14, tcl_s:18 },
    { branch:'闽北', cw_s:20, cw_e:55.02, hx_s:15, tcl_s:13 },
    { branch:'海南', cw_s:8,  cw_e:20.18, hx_s:12, tcl_s:8 },
    { branch:'广州', cw_s:6,  cw_e:15.25, hx_s:11, tcl_s:10 },
    { branch:'云南', cw_s:10, cw_e:28.33, hx_s:6,  tcl_s:8 },
    { branch:'桂北', cw_s:6,  cw_e:15.50, hx_s:0,  tcl_s:5 },
    { branch:'闽南', cw_s:6,  cw_e:16.25, hx_s:0,  tcl_s:0 },
    { branch:'滇南', cw_s:0,  cw_e:0,     hx_s:4,  tcl_s:5 },
    { branch:'桂南', cw_s:0,  cw_e:0,     hx_s:0,  tcl_s:0 }
  ];

  var Q7H_BRANCH = [
    { branch:'深圳', q7h_s:42, q7h_e:58.12, u7s_s:28, u7s_e:40.35 },
    { branch:'佛山', q7h_s:25, q7h_e:37.45, u7s_s:14, u7s_e:21.22 },
    { branch:'云南', q7h_s:22, q7h_e:33.28, u7s_s:10, u7s_e:15.66 },
    { branch:'汕头', q7h_s:20, q7h_e:31.16, u7s_s:15, u7s_e:23.42 },
    { branch:'广州', q7h_s:15, q7h_e:22.50, u7s_s:18, u7s_e:27.80 },
    { branch:'闽南', q7h_s:11, q7h_e:16.50, u7s_s:16, u7s_e:24.12 },
    { branch:'海口', q7h_s:6,  q7h_e:9.25,  u7s_s:9,  u7s_e:13.50 },
    { branch:'桂北', q7h_s:18, q7h_e:26.75, u7s_s:14, u7s_e:20.80 },
    { branch:'桂南', q7h_s:12, q7h_e:18.25, u7s_s:10, u7s_e:15.45 },
    { branch:'滇南', q7h_s:15, q7h_e:22.00, u7s_s:18, u7s_e:26.65 },
    { branch:'闽北', q7h_s:15, q7h_e:22.00, u7s_s:17, u7s_e:25.18 }
  ];
  var Q7H_SIZE = [
    { size:'55', model:'55Q7H', sales:45, amount:25.99, avg_price:5776 },
    { size:'65', model:'65Q7H', sales:23, amount:19.44, avg_price:8453 },
    { size:'75', model:'75Q7H', sales:36, amount:39.31, avg_price:10920 },
    { size:'85', model:'85Q7H', sales:39, amount:55.02, avg_price:14108 },
    { size:'100', model:'100Q7H', sales:8, amount:16.25, avg_price:20318 }
  ];

  // ============ Helper ============
  function mkChart(id, opt) {
    var el = document.getElementById(id); if (!el) return null;
    var c = echarts.init(el, null, { renderer: 'svg' });
    c.setOption(opt);
    return c;
  }

  // ============ Brand Minicards ============
  function renderBrandMinis() {
    var el = document.getElementById('brand-minis'); if (!el) return;
    var first6 = BRAND.slice(0, 6);
    var html = first6.map(function(b) {
      var cls = b.brand === '创维' ? 'cw' : b.brand === '海信' ? 'hx' :
        b.brand === 'TCL' ? 'tcl' : b.brand === '三星' ? 'samsung' :
        b.brand === '索尼' ? 'sony' : 'toshiba';
      return '<div class="brand-mini ' + cls + '">' +
        '<div class="bname">#' + b.rank + ' ' + b.brand + '</div>' +
        '<div class="bamt">' + b.amount.toFixed(1) + '</div>' +
        '<div class="bms">额占 ' + (b.ms_amount*100).toFixed(1) + '% · YoY ' +
          (b.yoy_ms >= 0 ? '+' : '') + (b.yoy_ms*100).toFixed(1) + 'pct</div>' +
        '</div>';
    }).join('');
    el.innerHTML = html;
  }

  // ============ 1. Brand Compare ============
  var brandBarData = BRAND.map(function(r) {
    var c = r.brand === '创维' ? accent : r.brand === '海信' ? blue : r.brand === 'TCL' ? orange : '#94a3b8';
    return { value: r.amount, itemStyle: { color: c, borderRadius: [4,4,0,0] } };
  });
  mkChart('chart-brand-compare', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['销额(万)', '额市占率%'], bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: BRAND.map(function(r) { return r.brand; }),
      axisLabel: { color: ink, fontWeight: 700, fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '万元', nameTextStyle: { color: muted }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      { type: 'value', name: '%', min: 0, max: 35, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { show: false } }
    ],
    color: [accent, blue],
    series: [
      { name: '销额(万)', type: 'bar', data: brandBarData, barWidth: '55%',
        label: { show: true, position: 'top', color: ink, fontSize: 10, fontWeight: 600 } },
      { name: '额市占率%', type: 'line', yAxisIndex: 1, data: BRAND.map(function(r) { return +(r.ms_amount*100).toFixed(1); }),
        symbol: 'circle', symbolSize: 9, lineStyle: { width: 2.5 },
        itemStyle: { color: orange, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, color: orange, fontSize: 10, fontWeight: 600, formatter: '{c}%' } }
    ]
  });

  // ============ 1. Brand Pie ============
  mkChart('chart-brand-pie', {
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
    legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: ink, fontSize: 11 } },
    color: [accent, blue, orange, purple, teal, gold, '#f97316', '#6366f1', '#84cc16', '#0ea5e9'],
    series: [{ type: 'pie', radius: ['40%', '72%'], center: ['40%', '50%'],
      data: BRAND.map(function(r) { return { name: r.brand, value: r.amount }; }),
      label: { color: ink, fontSize: 10, formatter: '{b}\n{d}%' },
      itemStyle: { borderColor: '#fff', borderWidth: 2 } }]
  });

  // ============ 1. Brand Scatter ============
  var scatterData = BRAND.slice(0, 10).map(function(r) {
    return { value: [r.avg_price, r.amount, r.sales, r.brand], name: r.brand,
      itemStyle: { color: r.brand === '创维' ? accent : r.brand === '海信' ? blue : r.brand === 'TCL' ? orange : '#94a3b8' } };
  });
  mkChart('chart-brand-scatter', {
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: function(p) { return p.data.value[3] + '<br/>均价: ¥' + p.data.value[0].toLocaleString() + '<br/>销额: ' + p.data.value[1] + '万<br/>销量: ' + p.data.value[2] + '台'; } },
    grid: { left: '10%', right: '6%', bottom: '12%', top: '10%' },
    xAxis: { type: 'value', name: '均价(¥)', nameTextStyle: { color: muted }, axisLabel: { color: muted, formatter: function(v) { return (v/1000).toFixed(0) + 'k'; } }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'value', name: '销额(万)', nameTextStyle: { color: muted }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [{ type: 'scatter', data: scatterData, symbolSize: function(v) { return Math.max(15, Math.sqrt(v[2]) * 3); },
      label: { show: true, formatter: function(p) { return p.data.value[3]; }, position: 'top', color: ink, fontSize: 10, fontWeight: 700 } }]
  });

  // ============ 2. Branch Bubble ============
  var bubbleData = MSDATA.map(function(r) {
    var color = r.cw_ms >= 0.25 ? green : r.cw_ms >= 0.22 ? blue : orange;
    return { name: r.branch, value: [+(r.cw_ms*100).toFixed(1), +(r.achieve*100).toFixed(1), r.cw],
      itemStyle: { color: color, borderColor: '#fff', borderWidth: 2 } };
  });
  mkChart('chart-branch-bubble', {
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: function(p) {
      return p.name + '<br/>市占率: ' + p.value[0] + '%<br/>达成率: ' + p.value[1] + '%<br/>销额: ' + p.value[2].toFixed(1) + '万'; } },
    grid: { left: '10%', right: '8%', bottom: '12%', top: '8%' },
    xAxis: { type: 'value', name: '市占率(%)', min: 15, max: 32, nameTextStyle: { color: muted }, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'value', name: '目标达成率(%)', min: 80, max: 130, nameTextStyle: { color: muted }, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
    series: [{ type: 'scatter', data: bubbleData, symbolSize: function(v) { return Math.max(20, v[2] / 3); },
      label: { show: true, formatter: '{b}', color: ink, fontSize: 10, fontWeight: 700 },
      markLine: { symbol: 'none', silent: true, lineStyle: { color: orange, type: 'dashed' },
        data: [{ xAxis: 24 }, { yAxis: 100 }], label: { show: true, color: muted, fontSize: 9 } } }]
  });

  // ============ 2. Branch Bar ============
  var branchSorted = MSDATA.slice().sort(function(a, b) { return b.cw - a.cw; });
  mkChart('chart-branch-bar', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: '3%', right: '8%', bottom: '10%', top: '8%', containLabel: true },
    xAxis: { type: 'value', name: '万元', nameTextStyle: { color: muted }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', inverse: true,
      data: branchSorted.map(function(r) { return r.branch; }),
      axisLabel: { color: ink, fontWeight: 600, fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
    color: [accent, blue, orange],
    legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    series: [
      { name: '创维', type: 'bar', stack: 't', data: branchSorted.map(function(r) { return r.cw.toFixed(1); }), barWidth: '60%', label: { show: true, position: 'right', color: accent, fontWeight: 700, fontSize: 10 } },
      { name: '海信', type: 'bar', stack: 't', data: branchSorted.map(function(r) { return r.hx.toFixed(1); }), label: { show: true, position: 'insideRight', color: '#fff', fontSize: 9 } },
      { name: 'TCL', type: 'bar', stack: 't', data: branchSorted.map(function(r) { return r.tcl.toFixed(1); }), label: { show: true, position: 'insideRight', color: '#fff', fontSize: 9 } }
    ]
  });

  // ============ Tables ============
  function renderBranchTable() {
    var el = document.getElementById('branch-table'); if (!el) return;
    var sorted = MSDATA.slice().sort(function(a, b) { return b.cw_ms - a.cw_ms; });
    var html = sorted.map(function(r, i) {
      var wowHtml = r.wow !== null && r.wow !== undefined ? '<span class="' + (r.wow >= 0 ? 'trend-up' : 'trend-down') + '">' + (r.wow >= 0 ? '+' : '') + (r.wow*100).toFixed(1) + '%</span>' : '-';
      var yoyHtml = r.yoy !== null && r.yoy !== undefined ? '<span class="' + (r.yoy >= 0 ? 'trend-up' : 'trend-down') + '">' + (r.yoy >= 0 ? '+' : '') + (r.yoy*100).toFixed(1) + '%</span>' : '-';
      var cls = r.achieve >= 1.1 ? 'cw' : r.achieve >= 1.0 ? '' : (r.achieve >= 0.9 ? '' : 'hx');
      var gapCls = r.lead_hx >= 0 ? 'trend-up' : 'trend-down';
      return '<tr><td class="rank">' + (i+1) + '</td><td><strong>' + r.branch + '</strong></td>' +
        '<td class="num cw">' + r.cw.toFixed(1) + '</td>' +
        '<td class="num hx">' + r.hx.toFixed(1) + '</td>' +
        '<td class="num tcl">' + r.tcl.toFixed(1) + '</td>' +
        '<td class="num">' + r.hy.toFixed(1) + '</td>' +
        '<td class="num"><strong>' + (r.cw_ms*100).toFixed(1) + '%</strong></td>' +
        '<td class="num">' + (r.target*100).toFixed(1) + '%</td>' +
        '<td class="num ' + cls + '"><strong>' + (r.achieve*100).toFixed(1) + '%</strong></td>' +
        '<td class="num">' + wowHtml + '</td><td class="num">' + yoyHtml + '</td>' +
        '<td class="num ' + gapCls + '">' + (r.lead_hx >= 0 ? '+' : '') + r.lead_hx.toFixed(1) + '</td></tr>';
    }).join('');
    el.innerHTML = html;
  }
  function renderTop40Table() {
    var el = document.getElementById('top40-table'); if (!el) return;
    var totalAmt = TOP40.reduce(function(s, r) { return s + r.amount; }, 0);
    var cum = 0;
    var html = TOP40.map(function(r) {
      cum += r.amount;
      var cumPct = totalAmt > 0 ? cum / totalAmt * 100 : 0;
      var bCls = r.brand === '创维' ? 'cw' : r.brand === '海信' ? 'hx' : r.brand === 'TCL' ? 'tcl' : '';
      var wowHtml = r.wow_sales !== null && r.wow_sales !== undefined ? '<span class="' + (r.wow_sales >= 0 ? 'trend-up' : 'trend-down') + '">' + (r.wow_sales >= 0 ? '+' : '') + (r.wow_sales*100).toFixed(0) + '%</span>' : '-';
      return '<tr><td class="rank">' + r.rank + '</td>' +
        '<td class="' + bCls + '">' + r.brand + '</td>' +
        '<td><strong>' + r.model + '</strong></td>' +
        '<td>' + (r.size || '-') + '</td>' +
        '<td class="num cw">' + r.amount.toFixed(2) + '</td>' +
        '<td class="num">' + r.sales + '</td>' +
        '<td class="num">¥' + r.avg_price.toLocaleString() + '</td>' +
        '<td class="num">' + (totalAmt > 0 ? (r.amount/totalAmt*100).toFixed(1) + '%' : '-') + '</td>' +
        '<td class="num"><div class="bar-cell"><div class="bar-wrap"><div class="bar-fill" style="width:' + cumPct + '%"></div></div></div></td>' +
        '<td class="num">' + wowHtml + '</td></tr>';
    }).join('');
    el.innerHTML = html;
  }
  function renderPriceTable() {
    var el = document.getElementById('price-table'); if (!el) return;
    var orderO = { '<1万':1, '1-1.5万':2, '1.5-2万':3, '2-3万':4, '>3万':5 };
    var sorted = PRICE_BANDS.slice().sort(function(a, b) { return (orderO[a.band]||99) - (orderO[b.band]||99); });
    var html = sorted.map(function(r) {
      var cwAvg = r.cw_sales > 0 ? r.cw_amount * 10000 / r.cw_sales : 0;
      var hyAvg = r.hy_sales > 0 ? r.hy_amount * 10000 / r.hy_sales : 0;
      var avgDiff = hyAvg > 0 ? (cwAvg - hyAvg) / hyAvg * 100 : 0;
      return '<tr><td><strong>' + r.band + '</strong></td>' +
        '<td class="num">' + r.hy_sales + '</td><td class="num">' + r.hy_amount.toFixed(2) + '</td>' +
        '<td class="num">' + r.hy_share.toFixed(1) + '%</td>' +
        '<td class="num cw">' + r.cw_sales + '</td><td class="num cw">' + r.cw_amount.toFixed(2) + '</td>' +
        '<td class="num">' + r.cw_share.toFixed(1) + '%</td>' +
        '<td class="num trend-up">' + r.cw_amount.toFixed(1) + '万</td>' +
        '<td class="num ' + (avgDiff >= 0 ? 'trend-up' : 'trend-down') + '">' + (avgDiff >= 0 ? '+' : '') + avgDiff.toFixed(1) + '%</td></tr>';
    }).join('');
    el.innerHTML = html;
  }
  function renderSizeTable() {
    var el = document.getElementById('size-table'); if (!el) return;
    var html = SIZE_LIST.map(function(r, i) {
      var cw = CW_SIZE[i] || { sales: 0, amount: 0, avg_price: 0 };
      var share = r.amount > 0 ? cw.amount / r.amount * 100 : 0;
      var hxShare = HX_SHARES[i] || 0, tclShare = TCL_SHARES[i] || 0;
      return '<tr><td><strong>' + r.size + '</strong></td>' +
        '<td class="num">' + r.sales + '</td><td class="num">' + r.amount.toFixed(2) + '</td>' +
        '<td class="num">¥' + r.avg_price.toLocaleString() + '</td>' +
        '<td class="num cw">' + cw.sales + '</td><td class="num cw">' + cw.amount.toFixed(2) + '</td>' +
        '<td class="num">¥' + cw.avg_price.toLocaleString() + '</td>' +
        '<td class="num"><strong>' + share.toFixed(1) + '%</strong></td>' +
        '<td class="num hx">' + hxShare.toFixed(1) + '%</td>' +
        '<td class="num tcl">' + tclShare.toFixed(1) + '%</td></tr>';
    }).join('');
    el.innerHTML = html;
  }
  function renderTable98() {
    var el = document.getElementById('table-98'); if (!el) return;
    var sorted = DATA98.slice().sort(function(a, b) { return (b.cw_s + b.hx_s + b.tcl_s) - (a.cw_s + a.hx_s + a.tcl_s); });
    var html = sorted.map(function(r) {
      var maxBrand = r.cw_s > r.hx_s && r.cw_s > r.tcl_s ? '创维' : r.hx_s > r.tcl_s ? '海信' : r.tcl_s > 0 ? 'TCL' : '-';
      var ratio = r.hx_s > 0 ? (r.cw_s / r.hx_s).toFixed(1) : '∞';
      return '<tr><td><strong>' + r.branch + '</strong></td>' +
        '<td class="num cw">' + r.cw_s + '</td><td class="num cw">' + r.cw_e.toFixed(2) + '</td>' +
        '<td class="num hx">' + r.hx_s + '</td><td class="num tcl">' + r.tcl_s + '</td>' +
        '<td class="num"><strong>' + maxBrand + '</strong></td>' +
        '<td class="num ' + (+ratio >= 1 ? 'trend-up' : 'trend-down') + '">' + ratio + 'x</td></tr>';
    }).join('');
    el.innerHTML = html;
  }

  // ============ 3. Top40 Brand Distribution ============
  mkChart('chart-top40-brand', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['TOP40入场数量', 'TOP40合计销额(万)'], bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    grid: { left: '3%', right: '6%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['创维', '海信', 'TCL', '三星', '索尼', '东芝', '华为', '其他'], axisLabel: { color: ink, fontWeight: 600 } },
    yAxis: [
      { type: 'value', name: '数量', nameTextStyle: { color: muted }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      { type: 'value', name: '万', nameTextStyle: { color: muted }, axisLabel: { color: muted }, splitLine: { show: false } }
    ],
    color: [accent, blue],
    series: [
      { name: 'TOP40入场数量', type: 'bar', data: [11, 8, 9, 4, 3, 2, 2, 1], barWidth: '50%',
        itemStyle: { borderRadius: [4,4,0,0] }, label: { show: true, position: 'top', fontSize: 11, fontWeight: 700 } },
      { name: 'TOP40合计销额(万)', type: 'line', yAxisIndex: 1, data: [155.06, 184.55, 150.35, 166.41, 88.20, 51.25, 58.91, 9.58],
        symbol: 'circle', symbolSize: 9, lineStyle: { width: 2.5 }, label: { show: true, color: blue, fontWeight: 700, fontSize: 10 } }
    ]
  });

  // ============ 3. Top40 Bars ============
  var topBars = TOP40.slice().reverse();
  var topBarData = topBars.map(function(r) {
    var c = r.brand === '创维' ? accent : r.brand === '海信' ? blue : r.brand === 'TCL' ? orange : '#94a3b8';
    return { value: r.amount.toFixed(2), itemStyle: { color: c, borderRadius: [0,4,4,0] } };
  });
  mkChart('chart-top40-bars', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) {
      var d = topBars[p[0].dataIndex]; return d.brand + ' ' + d.model + '<br/>销额: ' + d.amount.toFixed(2) + '万<br/>销量: ' + d.sales + '台'; } },
    grid: { left: '22%', right: '6%', bottom: '8%', top: '5%' },
    xAxis: { type: 'value', name: '万元', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', inverse: true, data: topBars.map(function(r) { return r.brand + ' ' + r.model; }),
      axisLabel: { color: ink, fontSize: 10, fontWeight: 600,
        formatter: function(s) { return s.length > 16 ? s.slice(0, 15) + '…' : s; } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{ type: 'bar', data: topBarData,
      label: { show: true, position: 'right', fontSize: 10, fontWeight: 700, formatter: '{c}万' },
      barWidth: '60%' }]
  });

  // ============ 4. Price Compare ============
  mkChart('chart-price-compare', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['行业销额(万)', '创维销额(万)', '创维控比%'], bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    grid: { left: '3%', right: '6%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: PRICE_BANDS.map(function(r) { return r.band; }), axisLabel: { color: ink, fontWeight: 700 } },
    yAxis: [
      { type: 'value', name: '万元', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      { type: 'value', name: '%', min: 0, max: 40, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { show: false } }
    ],
    color: ['#94a3b8', accent, blue],
    series: [
      { name: '行业销额(万)', type: 'bar', data: PRICE_BANDS.map(function(r) { return r.hy_amount.toFixed(0); }), barWidth: '40%', itemStyle: { borderRadius: [4,4,0,0] } },
      { name: '创维销额(万)', type: 'bar', data: PRICE_BANDS.map(function(r) { return r.cw_amount.toFixed(0); }), barWidth: '40%', itemStyle: { borderRadius: [4,4,0,0], color: accent } },
      { name: '创维控比%', type: 'line', yAxisIndex: 1, data: PRICE_BANDS.map(function(r) { return +r.cw_share.toFixed(1); }),
        symbol: 'diamond', symbolSize: 10, lineStyle: { width: 2.5 }, label: { show: true, color: blue, fontWeight: 700, fontSize: 10, formatter: '{c}%' } }
    ]
  });

  // ============ 5. Size Compare ============
  mkChart('chart-size-compare', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['行业销额(万)', '创维销额(万)'], bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: SIZE_LIST.map(function(r) { return r.size; }), axisLabel: { color: ink, fontWeight: 700, fontSize: 11 } },
    yAxis: { type: 'value', name: '万元', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    color: ['#94a3b8', accent],
    series: [
      { name: '行业销额(万)', type: 'bar', data: SIZE_LIST.map(function(r) { return r.amount.toFixed(0); }), barWidth: '45%',
        itemStyle: { borderRadius: [4,4,0,0] }, label: { show: true, position: 'top', color: muted, fontSize: 9 } },
      { name: '创维销额(万)', type: 'bar', data: CW_SIZE.map(function(r) { return r.amount.toFixed(0); }), barWidth: '45%',
        itemStyle: { borderRadius: [4,4,0,0], color: accent }, label: { show: true, position: 'top', color: accent, fontWeight: 700, fontSize: 10 } }
    ]
  });

  // ============ 5. Size Brand Share ============
  mkChart('chart-size-brand', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
    legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: { type: 'value', max: 50, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
    yAxis: { type: 'category', data: SIZE_LIST.map(function(r) { return r.size; }), axisLabel: { color: ink, fontWeight: 700 } },
    color: [accent, blue, orange],
    series: [
      { name: '创维', type: 'bar', data: CW_SHARES, barWidth: '25%', itemStyle: { borderRadius: [0,5,5,0], color: accent }, label: { show: true, position: 'right', color: accent, fontWeight: 700, fontSize: 10, formatter: '{c}%' } },
      { name: '海信', type: 'bar', data: HX_SHARES, barWidth: '25%', itemStyle: { borderRadius: [0,5,5,0], color: blue }, label: { show: true, position: 'right', color: blue, fontSize: 10, formatter: '{c}%' } },
      { name: 'TCL', type: 'bar', data: TCL_SHARES, barWidth: '25%', itemStyle: { borderRadius: [0,5,5,0], color: orange }, label: { show: true, position: 'right', color: orange, fontSize: 10, formatter: '{c}%' } }
    ]
  });

  // ============ 6. 98+ Bar ============
  var data98s = DATA98.slice().sort(function(a, b) { return (b.cw_s + b.hx_s + b.tcl_s) - (a.cw_s + a.hx_s + a.tcl_s); });
  mkChart('chart-98-bar', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['创维', '海信', 'TCL'], bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    grid: { left: '3%', right: '6%', bottom: '12%', top: '5%', containLabel: true },
    xAxis: { type: 'value', name: '台', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    yAxis: { type: 'category', inverse: true, data: data98s.map(function(r) { return r.branch; }), axisLabel: { color: ink, fontWeight: 700 }, axisLine: { show: false }, axisTick: { show: false } },
    color: [accent, blue, orange],
    series: [
      { name: '创维', type: 'bar', stack: 'a', data: data98s.map(function(r) { return r.cw_s; }), label: { show: true, position: 'right', color: accent, fontWeight: 700, fontSize: 11 } },
      { name: '海信', type: 'bar', stack: 'a', data: data98s.map(function(r) { return r.hx_s; }) },
      { name: 'TCL', type: 'bar', stack: 'a', data: data98s.map(function(r) { return r.tcl_s; }) }
    ]
  });

  // ============ 7. Q7H Branch ============
  mkChart('chart-q7h-branch', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['Q7H(创维)', 'U7S-PRO(海信)'], bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: Q7H_BRANCH.map(function(r) { return r.branch; }), axisLabel: { color: ink, fontWeight: 700, rotate: 20 } },
    yAxis: { type: 'value', name: '销量(台)', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
    color: [accent, blue],
    series: [
      { name: 'Q7H(创维)', type: 'bar', data: Q7H_BRANCH.map(function(r) { return r.q7h_s; }), barWidth: '38%',
        itemStyle: { borderRadius: [4,4,0,0], color: accent }, label: { show: true, position: 'top', color: accent, fontWeight: 700, fontSize: 10 } },
      { name: 'U7S-PRO(海信)', type: 'bar', data: Q7H_BRANCH.map(function(r) { return r.u7s_s; }), barWidth: '38%',
        itemStyle: { borderRadius: [4,4,0,0], color: blue }, label: { show: true, position: 'top', color: blue, fontSize: 10 } }
    ]
  });

  // ============ 7. Q7H Size ============
  mkChart('chart-q7h-size', {
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: Q7H_SIZE.map(function(r) { return r.size + '吋'; }), axisLabel: { color: ink, fontWeight: 700 } },
    yAxis: { type: 'value', name: '万元', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    color: [accent],
    series: [{ type: 'bar', barWidth: '45%',
      data: Q7H_SIZE.map(function(r) { return { value: r.amount.toFixed(2), itemStyle: { color: accent, borderRadius: [4,4,0,0] } }; }),
      label: { show: true, position: 'top', color: ink, fontWeight: 700, fontSize: 11 } }]
  });

  // ============ Conclusion & Recommendations ============
  function renderConclusion() {
    var el = document.getElementById('conclusion-text'); if (!el) return;
    var bestBranch = MSDATA.slice().sort(function(a, b) { return b.cw_ms - a.cw_ms; })[0];
    var worstBranch = MSDATA.slice().sort(function(a, b) { return a.cw_ms - b.cw_ms; })[0];
    var lowAch = MSDATA.slice().sort(function(a, b) { return a.achieve - b.achieve; })[0];
    var q7hTotal = Q7H_BRANCH.reduce(function(s, r) { return s + r.q7h_s; }, 0);
    var u7sTotal = Q7H_BRANCH.reduce(function(s, r) { return s + r.u7s_s; }, 0);

    var html = '';
    html += '<p><strong>1. 整体态势向上：</strong>本周创维销额 792.6 万，市占率 <mark class="key">26.1%</mark>（同比 +4.4pct），目标达成 <mark class="key">106.5%</mark>，三项核心指标全部达标且优于去年同期。</p>';
    html += '<p><strong>2. 差距仍存：</strong>与海信（929 万）相差 136.4 万，主要原因是海信均价（8178 元）高于创维（6632 元），产品结构偏上。</p>';
    html += '<p><strong>3. 分公司结构清晰：</strong>深圳（达成率 124%）、佛山（120%）、闽北（116%）构成"第一梯队"；云南（83%）、滇南（93%）、闽南（94%）处于"修复期"。</p>';
    html += '<p><strong>4. 产品结构：</strong>75吋+85吋合计贡献 62% 销额，是主战场；<mark class="key">98吋+ 136 台 vs 海信 98 台</mark>，是创维最大的结构性优势；但 TOP40 中仅占 11 席，头部被三星/海信压制。</p>';
    html += '<p><strong>5. Q7H vs U7S：</strong>本周 Q7H '+ q7hTotal +' 台 vs U7S-PRO '+ u7sTotal +' 台，控比 ' + (u7sTotal > 0 ? (q7hTotal/u7sTotal).toFixed(2) + 'x' : '∞') + '，但闽南、海口 U7S-PRO 反超。</p>';
    el.innerHTML = html;
  }

  function renderRecs() {
    var el = document.getElementById('recommendations'); if (!el) return;
    var recs = [
      { icon: '🎯', title: '加大 1-1.5 万价位产品投放', desc: '行业 678.8 万（22.3%），创维控比 30.6% 是所有价位中最高，Q7H / U7S 对决主战场，建议新增 1-2 款 75 吋 Q7H SKU 抢占份额。' },
      { icon: '🏆', title: '巩固 98吋+ 大尺寸优势', desc: '7/11 分公司领先，合计 136 台 vs 海信 98 台，但海南（海信 12 vs 创维 8）、广州（海信 11 vs 创维 6）失守，需针对性加强渠道推力。' },
      { icon: '📉', title: '云南分公司重点攻坚', desc: '达成率仅 83.4%（全区最低），市占率 18.2%（倒数第 2），落后海信 25.4 万。建议派专项组驻点，聚焦 75吋/85吋 Q7H + 价格带 1-1.5 万组合拳。' },
      { icon: '⚠️', title: 'Q7H 反击闽南/海口 U7S-PRO', desc: '闽南 U7S-PRO 16 vs Q7H 11、海口 U7S-PRO 9 vs Q7H 6。建议限时活动 + 渠道激励政策双管齐下，在这两个市场扳回。' },
      { icon: '📊', title: '提升 TOP 型号头部份额', desc: 'TOP40 中创维仅 11 席，头部 3 位被三星 85QN80FAJ / 海信 85U7S-PRO / TCL 98Q8H 占据。建议加快 85吋 Q7H / 100吋 Q7H 的渠道铺货节奏。' }
    ];
    var html = recs.map(function(r) {
      return '<div style="margin:1rem 0;padding:0">' +
        '<h4 style="font-size:0.95rem;color:' + accent + ';margin:0 0 4px;font-weight:700">' + r.icon + ' ' + r.title + '</h4>' +
        '<p style="font-size:0.88rem;color:' + muted + ';margin:0;line-height:1.6">' + r.desc + '</p></div>';
    }).join('');
    el.innerHTML = html;
  }

  // ============ Init ============
  document.addEventListener('DOMContentLoaded', function() {
    renderBrandMinis();
    renderBranchTable();
    renderTop40Table();
    renderPriceTable();
    renderSizeTable();
    renderTable98();
    renderConclusion();
    renderRecs();
  });

  // Resize
  window.addEventListener('resize', function() {
    var charts = document.querySelectorAll('#chart-brand-compare, #chart-brand-pie, #chart-brand-scatter, #chart-branch-bubble, #chart-branch-bar, #chart-top40-brand, #chart-top40-bars, #chart-price-compare, #chart-size-compare, #chart-size-brand, #chart-98-bar, #chart-q7h-branch, #chart-q7h-size');
    charts.forEach(function(id) {
      var c = echarts.getInstanceByDom(id); if (c) c.resize();
    });
  });

})();

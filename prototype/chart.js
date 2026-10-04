(() => {
  const root = document.getElementById('perfume-matrix-prototype');
  const data = JSON.parse(root.querySelector('#pm-matrix-data').textContent);
  const sources = JSON.parse(root.querySelector('#pm-source-data').textContent);
  const perfumes = JSON.parse(root.querySelector('#pm-perfume-data').textContent);
  const categoryIcons = JSON.parse(root.querySelector('#pm-icon-data').textContent);
  const iconByCategory = new Map(categoryIcons.map(icon => [icon.category_id, icon]));
  const perfumeById = new Map(perfumes.map(p => [p.id, p]));
  const sourceById = new Map(sources.map(s => [s.id, s]));
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const dateLabels = {list_created: '榜單製作', updated: '更新', published: '發布', displayed_date: '頁面標示日期'};
  const retrievalLabels = {official_page_open: '直接讀取官方頁', official_page_search_extract: '官方頁搜尋擷取'};
  function sourceItem(source) {
    const item = element('li', 'pm-source-item');
    item.dataset.sourceId = source.id;
    const title = element('h3', 'pm-source-title');
    title.append(element('span', 'pm-source-id', `${source.id} `));
    const link = element('a', '', source.title);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    title.append(link);
    item.append(title);
    const date = source.date ? `${dateLabels[source.date_kind] || '日期'}：${source.date}` : '發布日期：未標示';
    const meta = [source.publisher, source.author && `作者：${source.author}`, date, `查閱：${source.accessed_at}`].filter(Boolean);
    item.append(element('p', 'pm-source-meta', meta.join(' · ')));
    if (source.perfumes.length) {
      const names = source.perfumes.map(p => p.name_zh ? `${p.name_zh}（${p.name}，${p.concentration}）` : `${p.name}（${p.concentration}）`);
      item.append(element('p', '', `對應樣本：${names.join('；')}`));
    }
    if (source.section_used) item.append(element('p', '', `採用區段：${source.section_used}`));
    const sectionPrefix = source.section_used ? `採用區段：${source.section_used}。` : '';
    const note = sectionPrefix && source.notes.startsWith(sectionPrefix) ? source.notes.slice(sectionPrefix.length) : source.notes;
    if (note) item.append(element('p', '', `採用說明：${note}`));
    if (source.retrieval_method) item.append(element('p', 'pm-source-meta', `取得方式：${retrievalLabels[source.retrieval_method] || source.retrieval_method}`));
    item.append(element('p', 'pm-source-url', source.url));
    return item;
  }
  for (const source of sources.filter(s => s.role === 'brand_selection')) root.querySelector('.pm-brand-sources').append(sourceItem(source));
  for (const source of sources.filter(s => s.role === 'perfume_recommendation')) root.querySelector('.pm-recommendation-sources').append(sourceItem(source));
  for (const brand of data.brands) {
    const official = sources.filter(s => s.role.startsWith('official_') && s.perfumes.some(p => p.brand === brand.brand));
    const disclosure = element('details', 'pm-source-brand');
    disclosure.append(element('summary', '', `${brand.brand} · ${official.length} 筆`));
    const list = element('ol', 'pm-source-list');
    official.forEach(s => list.append(sourceItem(s)));
    disclosure.append(list);
    root.querySelector('.pm-official-sources').append(disclosure);
  }
  const illustrated = perfumes.filter(p => p.image);
  root.querySelector('.pm-source-count').textContent = `${sources.length} 筆資料 · ${illustrated.length} 筆圖片 · ${categoryIcons.length} 枚圖示`;
  for (const icon of categoryIcons) {
    const item = element('li', 'pm-source-item');
    const category = data.categories.find(c => c.id === icon.category_id);
    const link = element('a', '', `${category.name_zh} · ${icon.label} · ${icon.icon}`);
    link.href = icon.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link, element('p', 'pm-source-meta', `${icon.author} · Game Icons · ${icon.license} · 查閱：${icon.accessed_at}`));
    root.querySelector('.pm-icon-sources').append(item);
  }
  root.querySelector('#pm-image-sources-heading').textContent = `官方商品圖片 · ${illustrated.length} 筆`;
  const imageLists = new Map();
  for (const brand of data.brands) {
    const count = illustrated.filter(p => p.brand === brand.brand).length;
    const disclosure = element('details', 'pm-source-brand');
    disclosure.append(element('summary', '', `${brand.brand} · ${count} 張`));
    const list = element('ol', 'pm-source-list');
    disclosure.append(list);
    root.querySelector('.pm-image-sources').append(disclosure);
    imageLists.set(brand.brand, list);
  }
  for (const perfume of illustrated) {
    const source = perfume.image;
    const item = element('li', 'pm-source-item');
    item.dataset.sourceId = source.source_id;
    const title = element('h3', 'pm-source-title');
    title.append(element('span', 'pm-source-id', `${source.source_id} `));
    const link = element('a', '', [source.name_zh, source.title].filter(Boolean).join(' · '));
    link.href = source.product_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    title.append(link);
    item.append(title);
    item.append(element('p', 'pm-source-meta', `${source.publisher} · 官方商品圖片 · 查閱：${source.accessed_at}`));
    item.append(element('p', '', source.processing));
    item.append(element('p', 'pm-source-meta', `對應香氣資料：${source.related_note_source_id}`));
    item.append(element('p', 'pm-source-url', source.product_url));
    const original = element('a', 'pm-source-url', '官方原始圖片');
    original.href = source.image_url;
    original.target = '_blank';
    original.rel = 'noopener noreferrer';
    item.append(original);
    imageLists.get(perfume.brand).append(item);
  }
  if (!window.d3) {
    const error = root.querySelector('.pm-error');
    error.hidden = false;
    error.textContent = 'D3.js 尚未載入，請確認網路連線後重新開啟。';
    return;
  }
  const d3 = window.d3;
  const plotHost = root.querySelector('.pm-plots');
  const detailPanel = root.querySelector('.pm-selection');
  const closeDetails = root.querySelector('.pm-close');
  let selected = null;
  const isSelected = d => selected?.brand === d.brand && selected?.categoryId === d.category.id;
  function syncSelection() {
    d3.select(plotHost).selectAll('.pm-cell').classed('pm-cell-selected', isSelected);
    d3.select(plotHost).selectAll('.pm-hit-target').attr('aria-expanded', d => String(isSelected(d)));
  }
  function saveSelection() {
    if (window.openai?.setWidgetState) {
      const modelContent = selected ? {brand: selected.brand, category: data.categories.find(c => c.id === selected.categoryId).name_zh} : null;
      window.openai.setWidgetState({modelContent, privateContent: {selected}}).catch(() => {});
    }
  }
  function perfumeItem(perfume, category) {
    const item = element('li', 'pm-perfume');
    item.dataset.perfumeId = perfume.id;
    const info = element('div', 'pm-perfume-info');
    if (perfume.image) {
      item.classList.add('pm-perfume-with-image');
      const photo = element('div', 'pm-perfume-photo');
      const crop = element('div', 'pm-photo-crop');
      const {x, y, width, height} = perfume.image.display_bounds;
      crop.style.width = `calc(var(--pm-photo-height) * ${width / height})`;
      const image = element('img', 'pm-product-image');
      image.src = perfume.image.src;
      image.alt = `${perfume.brand} ${perfume.name} ${perfume.concentration} 瓶身`;
      image.width = perfume.image.width;
      image.height = perfume.image.height;
      image.decoding = 'async';
      image.style.width = `${perfume.image.width / width * 100}%`;
      image.style.left = `${-x / width * 100}%`;
      image.style.top = `${-y / height * 100}%`;
      crop.append(image);
      photo.append(crop);
      item.append(photo);
    }
    item.append(info);
    info.append(element('h3', '', perfume.name_zh || perfume.name));
    info.append(element('p', 'pm-perfume-meta', [perfume.name_zh && perfume.name, perfume.concentration].filter(Boolean).join(' · ')));
    if (perfume.fragrance_family) info.append(element('p', 'pm-perfume-meta', `官方整體香調：${perfume.fragrance_family.name_zh}`));
    const primary = perfume.notes.filter(n => n.evidence_scope === 'primary_notes');
    const matched = [...new Set(primary.filter(n => n.category_id === category.id).map(n => n.name_zh))];
    info.append(element('p', 'pm-matching-notes', `本次「${category.name_zh}」計數依據：${matched.join('、')}`));
    if (perfume.note_pyramid_status !== 'published_in_selected_source') {
      info.append(element('p', 'pm-perfume-meta', '官方採用區段未公布完整前、中、後調，以下保留未分層清單。'));
    }
    const notesList = element('dl', 'pm-notes');
    const addNotes = (label, notes, isPrimary) => {
      if (!notes.length) return;
      const row = element('div', 'pm-note-row');
      row.append(element('dt', '', label));
      const value = element('dd', '');
      notes.forEach((note, index) => {
        if (index) value.append(document.createTextNode('、'));
        const text = note.raw_name === note.name_zh ? note.name_zh : `${note.name_zh}（${note.raw_name}）`;
        const noteElement = element('span', isPrimary && note.category_id === category.id ? 'pm-note-match' : '', text);
        noteElement.dataset.noteId = note.note_id;
        noteElement.dataset.scope = note.evidence_scope;
        value.append(noteElement);
      });
      row.append(value);
      notesList.append(row);
    };
    const stages = [['top', '前調'], ['middle', '中調'], ['base', '後調'], ['unspecified', '主要香氣']];
    stages.forEach(([stage, label]) => addNotes(label, primary.filter(n => n.stage === stage), true));
    addNotes('補充描述', perfume.notes.filter(n => n.evidence_scope === 'additional_description'), false);
    info.append(notesList);
    const references = element('div', 'pm-perfume-sources');
    perfume.note_source_ids.forEach(id => {
      const source = sourceById.get(id);
      const link = element('a', '', `${id} · ${source.publisher} 官方香氣來源`);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      references.append(link);
    });
    if (perfume.image) {
      const imageLink = element('a', '', `${perfume.image.source_id} · 圖片原始來源`);
      imageLink.href = perfume.image.product_url;
      imageLink.target = '_blank';
      imageLink.rel = 'noopener noreferrer';
      references.append(imageLink);
    }
    info.append(references);
    return item;
  }
  function showDetails(brand, category, panel, moveFocus = false) {
    const members = data.brands.find(b => b.brand === brand).members[category.id];
    if (!members.length) return;
    selected = {brand, categoryId: category.id};
    root.querySelector('#pm-selection-heading').textContent = `${brand} · ${category.name_zh} · ${members.length} 款`;
    const list = root.querySelector('.pm-perfumes');
    list.replaceChildren(...members.map(id => perfumeItem(perfumeById.get(id), category)));
    panel.append(detailPanel);
    detailPanel.hidden = false;
    syncSelection();
    if (moveFocus) {
      root.querySelector('.pm-selection-status').textContent = `已顯示 ${brand} 的${category.name_zh}香水，共 ${members.length} 款。`;
      closeDetails.focus({preventScroll: true});
      detailPanel.scrollIntoView({behavior: 'auto', block: 'start'});
      saveSelection();
    }
  }
  function hideDetails(restoreFocus = false) {
    const previous = selected;
    selected = null;
    detailPanel.hidden = true;
    syncSelection();
    if (restoreFocus && previous) {
      const trigger = [...root.querySelectorAll('.pm-hit-target')].find(b => b.dataset.brand === previous.brand && b.dataset.category === previous.categoryId);
      trigger?.focus();
      root.querySelector('.pm-selection-status').textContent = '已收起香水明細。';
      saveSelection();
    }
  }
  closeDetails.addEventListener('click', () => hideDetails(true));
  detailPanel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); hideDetails(true); }
  });
  const radius = d3.scaleSqrt().domain([0, data.perBrand]).range([0, 18]);
  const palette = {
    floral: '#d7afb9', fruity: '#dfb7a1', citrus: '#ded09a', herbal_green: '#b7c8ad',
    woody: '#baad94', spicy: '#cda78a', resin: '#b6a4ae', amber_musk: '#c5bad2',
    gourmand: '#cfb68f', tea: '#aebd9b', beverage: '#c1a3a7', marine: '#adc6cc',
    leather: '#b7a89a', abstract: '#bec1bc'
  };
  const labels = {
    floral: ['花香', 'Floral'], fruity: ['果香', 'Fruity'], citrus: ['柑橘', 'Citrus'],
    herbal_green: ['草本與綠意', 'Green'], woody: ['木質與根莖', 'Woody'], spicy: ['辛香', 'Spicy'],
    resin: ['樹脂與焚香', 'Resin'], amber_musk: ['琥珀與麝香', 'Amber / musk'],
    gourmand: ['香草、穀物', '與堅果', 'Gourmand'], tea: ['茶香', 'Tea'],
    beverage: ['酒香', 'Beverage'], marine: ['海洋與鹽感', 'Marine'],
    leather: ['皮革', 'Leather'], abstract: ['其他抽象', '香氣', 'Other']
  };
  const legend = d3.select(root.querySelector('.pm-size-legend'));
  legend.selectAll('g').data(d3.range(1, data.perBrand + 1)).join('g')
    .attr('transform', d => `translate(${22 + (d - 1) * 48},20)`)
    .call(g => g.append('circle').attr('r', radius).attr('fill', '#b8bfaa'))
    .call(g => g.append('text').attr('text-anchor', 'middle').attr('y', 34).text(d => d + ' 款'));
  const table = d3.select(root.querySelector('.pm-data-table')).append('table');
  table.append('caption').text('各品牌五款樣本中，官方主要香氣清單提及各類別的款數');
  const header = table.append('thead').append('tr');
  header.append('th').attr('scope', 'col').text('品牌');
  header.selectAll('th.category').data(data.categories).join('th').attr('scope', 'col').text(d => d.name_zh);
  const tableRows = table.append('tbody').selectAll('tr').data(data.brands).join('tr');
  tableRows.append('th').attr('scope', 'row').text(d => d.brand);
  tableRows.selectAll('td').data(d => data.categories.map(c => d.counts[c.id])).join('td').text(d => d);
  let lastWidth = 0;
  function draw() {
    const width = Math.floor(plotHost.getBoundingClientRect().width);
    if (!width || width === lastWidth) return;
    lastWidth = width;
    const labelWidth = width < 500 ? 116 : 158;
    const available = width - labelWidth - 16;
    const fit = Math.max(2, Math.min(14, Math.floor(available / 68)));
    const panelCount = Math.ceil(data.categories.length / fit);
    const perPanel = Math.ceil(data.categories.length / panelCount);
    const chunks = d3.range(panelCount).map(i => data.categories.slice(i * perPanel, (i + 1) * perPanel));
    const top = 136, rowHeight = 51, bottom = 16;
    const height = top + rowHeight * data.brands.length + bottom;
    // Keep the shared detail panel alive when responsive chart panels are removed.
    plotHost.after(detailPanel);
    const panels = d3.select(plotHost).selectAll('div.pm-panel').data(chunks).join('div').attr('class', 'pm-panel');
    panels.each(function(categories, panelIndex) {
      const panel = this;
      const area = d3.select(this).selectAll('div.pm-chart-area').data([null]).join('div').attr('class', 'pm-chart-area');
      const svg = area.selectAll('svg').data([null]).join('svg')
        .attr('class', 'pm-chart').attr('viewBox', `0 0 ${width} ${height}`)
        .attr('height', height).attr('role', 'img')
        .attr('aria-label', `品牌香氣點陣：${categories.map(c => c.name_zh).join('、')}；每品牌五款樣本。`);
      svg.selectAll('*').remove();
      const x = d3.scaleBand().domain(categories.map(c => c.id)).range([labelWidth, width - 8]);
      const y = d3.scaleBand().domain(data.brands.map(b => b.brand)).range([top, top + rowHeight * data.brands.length]);
      svg.append('desc').text('圓面積與數字為各品牌五款樣本中的提及款數，範圍零至五。可用圓點上的按鈕查看香水明細。零不代表不含。');
      svg.append('text').attr('class', 'axis-title pm-axis').attr('data-axis', 'y').attr('x', 0).attr('y', 23).text('品牌 / 每品牌 5 款');
      svg.append('text').attr('class', 'axis-title pm-axis').attr('data-axis', 'x').attr('x', labelWidth).attr('y', 23)
        .text(panelCount > 1 ? `香氣類別 · ${panelIndex + 1} / ${panelCount}` : '香氣類別');
      const categoryHeads = svg.selectAll('g.pm-category').data(categories).join('g').attr('class', 'pm-category')
        .attr('transform', d => `translate(${x(d.id) + x.bandwidth() / 2},0)`);
      // Fixed-size SVGs are category cues; only the matrix circles encode counts.
      const icons = categoryHeads.append('g').attr('class', 'pm-category-icon')
        .attr('aria-hidden', 'true').attr('focusable', 'false')
        .attr('transform', 'translate(-17,36) scale(0.06640625)')
        .attr('fill', d => d3.color(palette[d.id]).darker(0.35).formatHex());
      icons.each(function(c) {
        d3.select(this).selectAll('path').data(iconByCategory.get(c.id).paths)
          .join('path').attr('d', d => d);
      });
      categoryHeads.each(function(c) {
        const lines = labels[c.id];
        d3.select(this).selectAll('text').data(lines).join('text').attr('text-anchor', 'middle')
          .attr('y', (_, i) => 88 + i * 17)
          .attr('class', (_, i) => i === lines.length - 1 ? 'pm-en' : 'pm-cn').text(d => d);
      });
      svg.append('rect').attr('data-chart-frame', '').attr('x', labelWidth).attr('y', top)
        .attr('width', available + 8).attr('height', rowHeight * data.brands.length)
        .attr('fill', 'none').attr('stroke', '#dfdfd3').attr('stroke-width', .75);
      svg.selectAll('line.pm-row-line').data(d3.range(1, data.brands.length)).join('line').attr('class', 'pm-row-line')
        .attr('x1', 0).attr('x2', width - 8).attr('y1', d => top + d * rowHeight).attr('y2', d => top + d * rowHeight)
        .attr('stroke', '#e5e4db').attr('stroke-width', .65);
      svg.selectAll('text.pm-brand').data(data.brands).join('text').attr('class', 'pm-brand')
        .attr('x', 0).attr('y', d => y(d.brand) + y.bandwidth() / 2 + 4).text(d => d.brand);
      const cells = data.brands.flatMap(b => categories.map(c => ({brand: b.brand, category: c, value: b.counts[c.id]})));
      const marks = svg.selectAll('g.pm-cell').data(cells).join('g').attr('class', 'pm-cell')
        .attr('data-brand', d => d.brand).attr('data-category', d => d.category.id).attr('data-value', d => d.value)
        .attr('transform', d => `translate(${x(d.category.id) + x.bandwidth() / 2},${y(d.brand) + y.bandwidth() / 2})`);
      marks.filter(d => d.value > 0).append('circle').attr('r', d => radius(d.value)).attr('fill', d => palette[d.category.id]);
      marks.filter(d => d.value > 0).append('circle').attr('class', 'pm-selection-ring').attr('r', 21);
      marks.append('text').attr('class', d => `pm-value${d.value === 0 ? ' pm-zero' : ''}`)
        .attr('text-anchor', 'middle').attr('dy', '.35em').text(d => d.value);
      area.selectAll('button.pm-hit-target').data(cells.filter(d => d.value > 0), d => `${d.brand}/${d.category.id}`)
        .join('button').attr('type', 'button').attr('class', 'pm-hit-target cursor-interaction')
        .attr('data-brand', d => d.brand).attr('data-category', d => d.category.id)
        .attr('aria-label', d => `${d.brand}，${d.category.name_zh}，${d.value} 款，查看香水明細`)
        .attr('aria-controls', 'pm-selection')
        .style('left', d => `${x(d.category.id) + x.bandwidth() / 2 - 22}px`)
        .style('top', d => `${y(d.brand) + y.bandwidth() / 2 - 22}px`)
        .on('click', (event, d) => showDetails(d.brand, d.category, panel, true));
      if (selected && categories.some(c => c.id === selected.categoryId)) {
        showDetails(selected.brand, categories.find(c => c.id === selected.categoryId), panel);
      }
    });
    syncSelection();
    root.dataset.ready = 'true';
    root.dataset.cellCount = String(root.querySelectorAll('.pm-cell').length);
  }
  draw();
  function restoreSelection(state) {
    const choice = state?.privateContent?.selected;
    const category = data.categories.find(c => c.id === choice?.categoryId);
    const brand = data.brands.find(b => b.brand === choice?.brand);
    if (!brand || !category || !brand.members[category.id].length) { hideDetails(); return; }
    const trigger = [...root.querySelectorAll('.pm-hit-target')].find(b => b.dataset.brand === brand.brand && b.dataset.category === category.id);
    if (trigger) showDetails(brand.brand, category, trigger.closest('.pm-panel'));
  }
  restoreSelection(window.openai?.widgetState);
  window.addEventListener('openai:set_globals', event => {
    if (event.detail?.globals?.widgetState !== undefined) restoreSelection(event.detail.globals.widgetState);
  });
  new ResizeObserver(draw).observe(plotHost);
  if (document.fonts) document.fonts.ready.then(() => { lastWidth = 0; draw(); });
})();

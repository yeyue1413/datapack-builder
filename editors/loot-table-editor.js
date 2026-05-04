import { datapackData } from '../data/data-core.js';
import { PRESET_ITEMS } from '../data/data-items.js';
import { PRESET_ENTITIES } from '../data/data-entities.js';
import { PRESET_BLOCKS, PRESET_OVERRIDE_BLOCKS } from '../data/data-blocks.js';
import { PRESET_POTIONS, PRESET_CHEST_LOOT_TABLES, PRESET_ENCHANTMENTS, PRESET_GAMEPLAY_LOOT_TABLES } from '../data/data-loot.js';
import { showNotification } from '../utils.js';
import { getInviconUrl } from '../invicon-map.js';

const ENCHANT_OPTIONS = [
    { value: 'none', label: '无附魔' },
    { value: 'random', label: '随机附魔（从所有附魔中随机选取）' },
    { value: 'custom', label: '自定义附魔（精确指定附魔类型和等级）' }
];

export function initLootTableEditor() {
    let dummyInput = document.getElementById('_dummy_loot_input');
    if (!dummyInput) {
        dummyInput = document.createElement('input');
        dummyInput.id = '_dummy_loot_input';
        dummyInput.type = 'text';
        dummyInput.style.display = 'none';
        document.body.appendChild(dummyInput);
    }

    createDefaultLootTable();

    document.getElementById('add-loot').addEventListener('click', function() {
        window.showPrompt('添加战利品表', '英文，无空格', '', function(lootName) {
            if (lootName && lootName.trim()) {
                const lootId = lootName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                if (!datapackData.lootTables[lootId]) {
                    datapackData.lootTables[lootId] = {
                        name: lootName,
                        type: 'block',
                        targets: [],
                        drops: []
                    };
                    addLootTableToList(lootId);
                    showNotification('战利品表已添加！', 'success');
                } else {
                    showNotification('战利品表名称已存在！', 'error');
                }
            }
        });
    });

    document.getElementById('save-loot').addEventListener('click', saveCurrentLootTable);

    document.getElementById('loot-type').addEventListener('change', toggleTargetSection);

    document.getElementById('add-loot-drop').addEventListener('click', addNewDrop);

    window.openBlockTargetSelector = openBlockTargetSelector;
    window.openChestTargetSelector = openChestTargetSelector;
    window.removeTargetTag = removeTargetTag;
    window.openEnchantSelector = openEnchantSelector;
}

function createDefaultLootTable() {
    const defaultId = 'default_loot';
    if (!datapackData.lootTables[defaultId]) {
        datapackData.lootTables[defaultId] = {
            name: '默认战利品表',
            type: 'block',
            targets: [],
            drops: []
        };
    }
    if (!document.querySelector('[data-loot="' + defaultId + '"]')) {
        addLootTableToList(defaultId);
    }
    window.currentLootTable = defaultId;
    loadLootTableData(defaultId);
}

function toggleTargetSection() {
    const type = document.getElementById('loot-type').value;
    const blocksDiv = document.getElementById('loot-target-blocks');
    const entityDiv = document.getElementById('loot-target-entity');
    const chestDiv = document.getElementById('loot-target-chest');
    const gameplayDiv = document.getElementById('loot-target-gameplay');
    const noneDiv = document.getElementById('loot-target-none');
    const title = document.getElementById('loot-target-title');
    const hint = document.getElementById('loot-target-hint');
    const coexistToggle = document.querySelector('.coexist-toggle');
    const tagsContainer = document.getElementById('loot-target-tags');

    blocksDiv.style.display = 'none';
    entityDiv.style.display = 'none';
    chestDiv.style.display = 'none';
    gameplayDiv.style.display = 'none';
    noneDiv.style.display = 'none';

    // 清除标签容器，后续按当前类型重新显示
    tagsContainer.innerHTML = '<span class="field-hint" style="padding:4px 0;display:inline-block;">暂无选择</span>';
    const entityTagsContainer = document.getElementById('loot-target-entity-tags');
    if (entityTagsContainer) entityTagsContainer.innerHTML = '<span class="field-hint" style="padding:4px 0;display:inline-block;">暂无选择</span>';

    if (type === 'block') {
        blocksDiv.style.display = 'block';
        title.textContent = '选择目标方块';
        hint.textContent = '选择后，破坏这些方块时会使用自定义掉落（点击下方按钮从列表中选择，或手动输入方块ID）';
        if (coexistToggle) coexistToggle.style.display = '';
        if (window.currentLootTable && datapackData.lootTables[window.currentLootTable]) {
            const targets = (datapackData.lootTables[window.currentLootTable].targets || [])
                .filter(t => t.startsWith('minecraft:blocks/'));
            renderTargetTags(targets, 'block');
        }
    } else if (type === 'entity') {
        entityDiv.style.display = 'block';
        title.textContent = '选择目标实体';
        hint.textContent = '选择后，击杀该实体时会使用自定义掉落';
        if (coexistToggle) coexistToggle.style.display = '';
        if (window.currentLootTable && datapackData.lootTables[window.currentLootTable]) {
            renderTargetTags('entity');
        }
    } else if (type === 'chest') {
        chestDiv.style.display = 'block';
        title.textContent = '选择结构宝箱';
        hint.textContent = '选择后，打开这些结构中的宝箱时会生成自定义物品';
        if (coexistToggle) coexistToggle.style.display = '';
        if (window.currentLootTable && datapackData.lootTables[window.currentLootTable]) {
            const targets = (datapackData.lootTables[window.currentLootTable].targets || [])
                .filter(t => t.startsWith('minecraft:chests/'));
            renderTargetTags(targets, 'chest');
        }
    } else if (type === 'gameplay') {
        gameplayDiv.style.display = 'block';
        title.textContent = '选择其他设置';
        hint.textContent = '选择后，覆盖相应的原战利品表（如钓鱼、村庄英雄礼物等）';
        if (coexistToggle) coexistToggle.style.display = '';
        if (window.currentLootTable && datapackData.lootTables[window.currentLootTable]) {
            const targets = (datapackData.lootTables[window.currentLootTable].targets || [])
                .filter(t => t.startsWith('minecraft:gameplay/'));
            renderTargetTags(targets, 'gameplay');
        }
    } else if (type === 'none') {
        noneDiv.style.display = 'block';
        title.textContent = '无触发条件';
        hint.textContent = '此战利品表无触发条件，可通过 /loot 命令、进度奖励、函数等方式手动调用';
        if (coexistToggle) coexistToggle.style.display = 'none';
    }
}

export function addLootTableToList(lootId) {
    const li = document.createElement('li');
    li.className = 'loot-item';
    li.setAttribute('data-loot', lootId);
    li.innerHTML = '<span id="loot-display-' + lootId + '">' + lootId + '</span><button class="delete-btn" onclick="window.deleteLootTable(\'' + lootId + '\', event)">删除</button>';
    li.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) return;
        document.querySelectorAll('.loot-item').forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        window.currentLootTable = lootId;
        loadLootTableData(lootId);
    });
    document.getElementById('loot-list').appendChild(li);
}

export function deleteLootTable(lootId, event) {
    if (event) event.stopPropagation();
    window.showConfirm('确定要删除战利品表 "<strong>' + lootId + '</strong>" 吗？', function(result) {
        if (result) {
            delete datapackData.lootTables[lootId];
            const item = document.querySelector('[data-loot="' + lootId + '"]');
            if (item) item.remove();
            if (window.currentLootTable === lootId) {
                window.currentLootTable = null;
                clearLootEditor();
            }
            showNotification('战利品表已删除！', 'success');
        }
    });
}
window.deleteLootTable = deleteLootTable;

function clearLootEditor() {
    document.getElementById('loot-name').value = '';
    document.getElementById('loot-type').value = 'block';
    document.getElementById('loot-target-tags').innerHTML = '<span class="field-hint" style="padding:4px 0;display:inline-block;">暂无选择</span>';
    document.getElementById('loot-drops-container').innerHTML = '<div class="empty-hint">暂无掉落物品，点击"添加掉落物品"开始添加</div>';
    toggleTargetSection();
}

export function loadLootTableData(lootId) {
    const loot = datapackData.lootTables[lootId];
    if (!loot) return;

    document.getElementById('loot-name').value = loot.name || '';

    if (loot.type) {
        document.getElementById('loot-type').value = loot.type;
    }
    document.getElementById('loot-coexist').checked = loot.coexist !== false;
    toggleTargetSection();

    if (loot.type === 'block') {
        renderTargetTags(loot.targets || [], 'block');
    } else if (loot.type === 'chest') {
        renderTargetTags(loot.targets || [], 'chest');
    } else if (loot.type === 'gameplay') {
        renderTargetTags(loot.targets || [], 'gameplay');
    } else if (loot.type === 'entity') {
        renderTargetTags('entity');
    }

    renderDrops();
}

function renderTargetTags(targets, type) {
    const container = document.getElementById('loot-target-tags');
    container.innerHTML = '';
    if (typeof targets === 'string') {
        type = targets;
        targets = (window.currentLootTable && datapackData.lootTables[window.currentLootTable])
            ? (datapackData.lootTables[window.currentLootTable].targets || []) : [];
    }
    const prefixMap = { block: 'minecraft:blocks/', chest: 'minecraft:chests/', gameplay: 'minecraft:gameplay/', entity: 'minecraft:entities/' };
    if (prefixMap[type]) {
        targets = targets.filter(t => t.startsWith(prefixMap[type]));
    }
    if (!targets || targets.length === 0) {
        container.innerHTML = '<span class="field-hint" style="padding:4px 0;display:inline-block;">暂无选择</span>';
        return;
    }
    targets.forEach(id => {
        const tag = document.createElement('span');
        tag.className = 'target-tag';
        let displayName = id;
        if (type === 'block') {
            const found = PRESET_OVERRIDE_BLOCKS.find(b => b.id === id) || PRESET_BLOCKS.find(b => 'minecraft:blocks/' + b.id.replace('minecraft:', '') === id);
            if (found) displayName = found.name;
            else {
                const parts = id.split('/');
                displayName = parts[parts.length - 1];
            }
            const itemId = id.replace('minecraft:blocks/', 'minecraft:');
            const inviconUrl = getInviconUrl(itemId);
            if (inviconUrl) {
                displayName = `<img src="${inviconUrl}" alt="" class="invicon-img invicon-sm" loading="lazy" onerror="this.style.display='none'" style="vertical-align:middle;margin-right:3px;"> ${displayName}`;
            }
        } else if (type === 'chest') {
            const found = PRESET_CHEST_LOOT_TABLES.find(c => c.id === id);
            if (found) displayName = found.name;
        } else if (type === 'entity') {
            const itemId = id.replace('minecraft:entities/', 'minecraft:');
            const found = PRESET_ENTITIES.find(e => e.id === itemId);
            if (found) displayName = found.name;
            else {
                const parts = id.split('/');
                displayName = parts[parts.length - 1];
            }
            const inviconUrl = getInviconUrl(itemId + '_spawn_egg') || getInviconUrl(itemId);
            if (inviconUrl) {
                displayName = `<img src="${inviconUrl}" alt="" class="invicon-img invicon-sm" loading="lazy" onerror="this.style.display='none'" style="vertical-align:middle;margin-right:3px;"> ${displayName}`;
            }
        } else if (type === 'gameplay') {
            const found = PRESET_GAMEPLAY_LOOT_TABLES.find(g => g.id === id);
            if (found) displayName = found.name;
            else {
                const parts = id.split('/');
                displayName = parts[parts.length - 1];
            }
        }
        tag.innerHTML = `<span>${displayName}</span><span class="target-tag-remove" data-id="${id}">&times;</span>`;
        tag.querySelector('.target-tag-remove').addEventListener('click', function() {
            removeTargetTag(this.dataset.id, type);
        });
        container.appendChild(tag);
    });
}

function removeTargetTag(id, type) {
    if (!window.currentLootTable) return;
    const loot = datapackData.lootTables[window.currentLootTable];
    if (!loot) return;
    loot.targets = (loot.targets || []).filter(t => t !== id);
    renderTargetTags(loot.targets, type);
}
window.removeTargetTag = removeTargetTag;

function openBlockTargetSelector() {
    const existingTargets = (window.currentLootTable && datapackData.lootTables[window.currentLootTable])
        ? (datapackData.lootTables[window.currentLootTable].targets || []).filter(t => t.startsWith('minecraft:blocks/')) : [];
    createTargetSelectorModal('block', '选择目标方块', PRESET_BLOCKS, existingTargets, function(selected) {
        if (!window.currentLootTable) return;
        const loot = datapackData.lootTables[window.currentLootTable];
        if (!loot.targets) loot.targets = [];
        loot.targets = loot.targets.filter(t => !t.startsWith('minecraft:blocks/'));
        selected.forEach(itemId => {
            const blockPath = 'minecraft:blocks/' + itemId.replace('minecraft:', '');
            if (!loot.targets.includes(blockPath)) {
                loot.targets.push(blockPath);
            }
        });
        renderTargetTags('block');
    });
}
window.openBlockTargetSelector = openBlockTargetSelector;

function openChestTargetSelector() {
    const existingTargets = (window.currentLootTable && datapackData.lootTables[window.currentLootTable])
        ? (datapackData.lootTables[window.currentLootTable].targets || []).filter(t => t.startsWith('minecraft:chests/')) : [];
    createTargetSelectorModal('chest', '选择结构宝箱', PRESET_CHEST_LOOT_TABLES, existingTargets, function(selected) {
        if (!window.currentLootTable) return;
        const loot = datapackData.lootTables[window.currentLootTable];
        if (!loot.targets) loot.targets = [];
        loot.targets = loot.targets.filter(t => !t.startsWith('minecraft:chests/'));
        selected.forEach(itemId => {
            if (!loot.targets.includes(itemId)) {
                loot.targets.push(itemId);
            }
        });
        renderTargetTags('chest');
    });
}
window.openChestTargetSelector = openChestTargetSelector;

function openEntityTargetSelector() {
    const existingTargets = (window.currentLootTable && datapackData.lootTables[window.currentLootTable])
        ? (datapackData.lootTables[window.currentLootTable].targets || []).filter(t => t.startsWith('minecraft:entities/')) : [];
    createTargetSelectorModal('entity', '选择目标实体', PRESET_ENTITIES, existingTargets, function(selected) {
        if (!window.currentLootTable) return;
        const loot = datapackData.lootTables[window.currentLootTable];
        if (!loot.targets) loot.targets = [];
        loot.targets = loot.targets.filter(t => !t.startsWith('minecraft:entities/'));
        selected.forEach(itemId => {
            const entityPath = 'minecraft:entities/' + itemId.replace('minecraft:', '');
            if (!loot.targets.includes(entityPath)) {
                loot.targets.push(entityPath);
            }
        });
        renderTargetTags('entity');
    });
}
window.openEntityTargetSelector = openEntityTargetSelector;

function openGameplayTargetSelector() {
    const existing = document.getElementById('gameplay-selector-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'gameplay-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content">
            <span class="close-modal" onclick="document.getElementById('gameplay-selector-modal').remove()">&times;</span>
            <div class="modal-header">
                <h3>选择其他设置</h3>
            </div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="gameplay-search-input" placeholder="搜索...">
                </div>
                <div id="gameplay-selector-list" style="max-height:450px;overflow-y:auto;">
                </div>
            </div>
            <div class="modal-actions">
                <span id="gameplay-selected-count" style="color:var(--mc-text-secondary);font-size:13px;margin-right:auto;">已选择 0 个</span>
                <button id="gameplay-select-all-btn" class="btn-add-mini">☑ 全选当前显示</button>
                <button id="gameplay-confirm-btn" class="btn-primary">确认选择</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    // 获取已有的 gameplay 目标
    const existingTargets = (window.currentLootTable && datapackData.lootTables[window.currentLootTable])
        ? (datapackData.lootTables[window.currentLootTable].targets || []) : [];
    const selectedIds = new Set(existingTargets);

    // 按分类分组
    const categories = {};
    PRESET_GAMEPLAY_LOOT_TABLES.forEach(item => {
        const cat = item.category || '其他';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
    });

    const listContainer = modal.querySelector('#gameplay-selector-list');

    function getVisibleOptions() {
        return Array.from(listContainer.querySelectorAll('.item-option'));
    }

    function updateSelectedCount() {
        document.getElementById('gameplay-selected-count').textContent = `已选择 ${selectedIds.size} 个`;
    }

    function selectAllVisible() {
        getVisibleOptions().forEach(opt => {
            selectedIds.add(opt.dataset.id);
            opt.classList.add('selected');
        });
        updateSelectedCount();
    }

    function deselectAllVisible() {
        getVisibleOptions().forEach(opt => {
            selectedIds.delete(opt.dataset.id);
            opt.classList.remove('selected');
        });
        updateSelectedCount();
    }

    function renderGameplayList(filter) {
        listContainer.innerHTML = '';
        const q = filter ? filter.toLowerCase() : '';

        Object.keys(categories).forEach(cat => {
            const items = categories[cat].filter(item => {
                if (!q) return true;
                return item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
            });
            if (items.length === 0) return;

            const section = document.createElement('div');
            section.style.marginBottom = '12px';

            const catHeader = document.createElement('div');
            catHeader.style.cssText = 'font-weight:600;color:#f59e0b;padding:8px 4px;font-size:14px;border-bottom:1px solid #334155;cursor:pointer;display:flex;align-items:center;gap:6px;';
            catHeader.innerHTML = `${cat} <span style="color:#94a3b8;font-size:12px;font-weight:normal;">(${items.length})</span>`;
            section.appendChild(catHeader);

            const itemGrid = document.createElement('div');
            itemGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px;padding:4px 0;';

            items.forEach(item => {
                const option = document.createElement('div');
                option.className = 'item-option' + (selectedIds.has(item.id) ? ' selected' : '');
                option.dataset.id = item.id;
                option.style.cssText = 'padding:6px 8px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;';
                option.innerHTML = `<span>${item.name}</span><span style="color:#64748b;font-size:11px;margin-left:auto;">${item.id.split('/').pop()}</span>`;
                option.addEventListener('click', function() {
                    const id = this.dataset.id;
                    if (selectedIds.has(id)) {
                        selectedIds.delete(id);
                        this.classList.remove('selected');
                    } else {
                        selectedIds.add(id);
                        this.classList.add('selected');
                    }
                    updateSelectedCount();
                });
                itemGrid.appendChild(option);
            });

            section.appendChild(itemGrid);
            listContainer.appendChild(section);
        });
    }

    renderGameplayList('');

    const searchInput = modal.querySelector('#gameplay-search-input');
    searchInput.addEventListener('input', function() {
        renderGameplayList(this.value);
    });

    modal.querySelector('#gameplay-select-all-btn').addEventListener('click', function() {
        const visible = getVisibleOptions();
        if (visible.length === 0) return;
        const allSelected = visible.every(opt => selectedIds.has(opt.dataset.id));
        if (allSelected) {
            deselectAllVisible();
            this.textContent = '☑ 全选当前显示';
        } else {
            selectAllVisible();
            this.textContent = '☐ 取消全选';
        }
    });

    modal.querySelector('#gameplay-confirm-btn').addEventListener('click', function() {
        if (!window.currentLootTable) return;
        const loot = datapackData.lootTables[window.currentLootTable];
        if (!loot.targets) loot.targets = [];
        loot.targets = loot.targets.filter(t => !t.startsWith('minecraft:gameplay/'));
        selectedIds.forEach(id => {
            if (!loot.targets.includes(id)) {
                loot.targets.push(id);
            }
        });
        renderTargetTags('gameplay');
        modal.remove();
    });

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}
window.openGameplayTargetSelector = openGameplayTargetSelector;

function createTargetSelectorModal(type, title, items, existingTargets, onConfirm) {
    const existing = document.getElementById('target-selector-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'target-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content">
            <span class="close-modal" onclick="document.getElementById('target-selector-modal').remove()">&times;</span>
            <div class="modal-header">
                <h3>${title}</h3>
            </div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="target-search-input" placeholder="搜索...">
                </div>
                ${type === 'block' ? `
                <div id="target-category-bar" class="item-categories">
                    <button class="category-btn active" data-cat="all">全部</button>
                    <button class="category-btn" data-cat="building">建筑方块</button>
                    <button class="category-btn" data-cat="decoration">装饰</button>
                    <button class="category-btn" data-cat="redstone">红石</button>
                    <button class="category-btn" data-cat="materials">材料</button>
                    <button class="category-btn" data-cat="food">食物</button>
                    <button class="category-btn" data-cat="misc">其他</button>
                </div>` : ''}
                <div class="item-grid" id="target-selector-grid">
                    ${items.map(item => {
                        let inviconUrl = '';
                        if (type === 'block') {
                            inviconUrl = getInviconUrl(item.id) || '';
                        } else if (type === 'entity') {
                            inviconUrl = getInviconUrl(item.id + '_spawn_egg') || getInviconUrl(item.id) || '';
                        }
                        const iconHtml = inviconUrl
                            ? `<img src="${inviconUrl}" alt="${item.name}" class="invicon-img" loading="lazy" onerror="this.style.display='none'">`
                            : '';
                        const catAttr = item.category ? ` data-category="${item.category}"` : '';
                        return `
                        <div class="item-option" data-id="${item.id}"${catAttr}>
                            <span class="item-icon">${iconHtml}</span>
                            <span class="item-name">${item.name}</span>
                            <span class="item-id">${item.id}</span>
                        </div>
                        `;
                    }).join('')}
                </div>
                <div class="custom-item-section">
                    <div class="custom-item-divider"><span>或者手动输入自定义ID</span></div>
                    <div class="custom-item-input-group">
                        <input type="text" id="target-custom-input" placeholder="多个用逗号分隔，如：minecraft:stone,minecraft:dirt">
                        <button id="target-custom-add" class="btn-custom-item">添加</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <span id="target-selected-count" style="color:var(--mc-text-secondary);font-size:13px;margin-right:auto;">已选择 0 个</span>
                <button id="target-select-all-btn" class="btn-add-mini">☑ 全选当前显示</button>
                <button id="target-confirm-btn" class="btn-primary">确认选择</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    const selectedIds = new Set();
    // 预填已选择的目标
    if (existingTargets && existingTargets.length > 0) {
        existingTargets.forEach(target => {
            if (type === 'block') {
                const optionId = 'minecraft:' + target.replace('minecraft:blocks/', '');
                selectedIds.add(optionId);
            } else if (type === 'entity') {
                const optionId = 'minecraft:' + target.replace('minecraft:entities/', '');
                selectedIds.add(optionId);
            } else {
                selectedIds.add(target);
            }
        });
    }

    // 给已选项添加高亮样式
    modal.querySelectorAll('.item-option').forEach(opt => {
        if (selectedIds.has(opt.dataset.id)) {
            opt.classList.add('selected');
        }
    });
    updateSelectedCount();

    function getVisibleOptions() {
        return Array.from(modal.querySelectorAll('.item-option')).filter(opt => opt.style.display !== 'none');
    }

    function updateSelectedCount() {
        document.getElementById('target-selected-count').textContent = `已选择 ${selectedIds.size} 个`;
        const btn = document.getElementById('target-select-all-btn');
        if (btn) {
            const visible = Array.from(modal.querySelectorAll('.item-option')).filter(opt => opt.style.display !== 'none');
            const allSelected = visible.length > 0 && visible.every(opt => selectedIds.has(opt.dataset.id));
            btn.textContent = allSelected ? '☐ 取消全选' : '☑ 全选当前显示';
        }
    }

    function selectAllVisible() {
        getVisibleOptions().forEach(opt => {
            const id = opt.dataset.id;
            selectedIds.add(id);
            opt.classList.add('selected');
        });
        updateSelectedCount();
    }

    function deselectAllVisible() {
        getVisibleOptions().forEach(opt => {
            const id = opt.dataset.id;
            selectedIds.delete(id);
            opt.classList.remove('selected');
        });
        updateSelectedCount();
    }

    modal.querySelectorAll('.item-option').forEach(opt => {
        opt.addEventListener('click', function() {
            const id = this.dataset.id;
            if (selectedIds.has(id)) {
                selectedIds.delete(id);
                this.classList.remove('selected');
            } else {
                selectedIds.add(id);
                this.classList.add('selected');
            }
            updateSelectedCount();
        });
    });

    let currentBlockCategory = 'all';

    function applyFilters() {
        const q = document.getElementById('target-search-input').value.toLowerCase();
        modal.querySelectorAll('.item-option').forEach(opt => {
            const name = opt.querySelector('.item-name').textContent.toLowerCase();
            const id = opt.dataset.id.toLowerCase();
            const cat = opt.dataset.category || '';
            const matchesSearch = !q || name.includes(q) || id.includes(q);
            const matchesCategory = currentBlockCategory === 'all' || cat === currentBlockCategory;
            opt.style.display = matchesSearch && matchesCategory ? '' : 'none';
        });
    }

    const searchInput = modal.querySelector('#target-search-input');
    searchInput.addEventListener('input', applyFilters);

    const customInput = modal.querySelector('#target-custom-input');
    modal.querySelector('#target-custom-add').addEventListener('click', function() {
        const val = customInput.value.trim();
        if (val) {
            val.split(',').forEach(v => {
                const trimmed = v.trim();
                if (trimmed) {
                    const fullId = type === 'block' && !trimmed.startsWith('minecraft:') ? 'minecraft:blocks/' + trimmed : trimmed;
                    selectedIds.add(fullId);
                }
            });
            customInput.value = '';
            updateSelectedCount();
            showNotification('已添加自定义目标！', 'success');
        }
    });

    // 分类过滤按钮
    modal.querySelectorAll('#target-category-bar .category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            modal.querySelectorAll('#target-category-bar .category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentBlockCategory = this.dataset.cat;
            applyFilters();
        });
    });

    // 全选/取消全选
    const selectAllBtn = document.getElementById('target-select-all-btn');
    selectAllBtn.addEventListener('click', function() {
        const visible = getVisibleOptions();
        const allSelected = visible.length > 0 && visible.every(opt => selectedIds.has(opt.dataset.id));
        if (allSelected) {
            deselectAllVisible();
            this.textContent = '☑ 全选当前显示';
        } else {
            selectAllVisible();
            this.textContent = '☐ 取消全选';
        }
    });

    modal.querySelector('#target-confirm-btn').addEventListener('click', function() {
        onConfirm(Array.from(selectedIds));
        modal.remove();
    });

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function addNewDrop() {
    if (!window.currentLootTable) {
        showNotification('请先选择或创建一个战利品表！', 'error');
        return;
    }
    const loot = datapackData.lootTables[window.currentLootTable];
    if (!loot.drops) loot.drops = [];
    loot.drops.push({
        item: '',
        minCount: 1,
        maxCount: 1,
        weight: 100,
        enchantType: 'none',
        enchantMin: 5,
        enchantMax: 20,
        treasure: false,
        potionIds: [],
        customEnchants: [],
        multiEnchant: false,
        multiEnchantMin: 1,
        multiEnchantMax: 3,
        exceedVanilla: false,
        allowIncompatible: false,
        randomLevelMin: 1,
        randomLevelMax: 10
    });
    renderDrops();
    showNotification('已添加新掉落物品，请点击选择物品', 'success');
}

function renderDrops() {
    const container = document.getElementById('loot-drops-container');
    container.innerHTML = '';

    if (!window.currentLootTable || !datapackData.lootTables[window.currentLootTable]) return;

    const loot = datapackData.lootTables[window.currentLootTable];
    const drops = loot.drops || [];

    if (drops.length === 0) {
        container.innerHTML = '<div class="empty-hint">暂无掉落物品，点击"添加掉落物品"开始添加</div>';
        return;
    }

    drops.forEach((drop, index) => {
        const card = document.createElement('div');
        card.className = 'loot-drop-card';
        card.setAttribute('data-drop-index', index);

        const itemPreview = getItemPreview(drop.item);
        const enchantHtml = getEnchantHtml(drop, index);

        card.innerHTML = `
            <div class="drop-card-header">
                <span class="drop-item-preview">${itemPreview.icon} ${itemPreview.name}</span>
                <span class="drop-card-index">#${index + 1}</span>
            </div>
            <div class="drop-card-body">
                <div class="form-row">
                    <div class="form-group drop-item-select-group">
                        <label>掉落物品</label>
                        <div class="item-input-group">
                            <input type="text" class="drop-item-input" value="${drop.item}" readonly placeholder="点击选择物品...">
                            <button class="item-select-btn" onclick="openItemSelectorForDrop(${index})">🔍 选择</button>
                        </div>
                    </div>
                </div>
                <div class="form-row drop-count-row">
                    <div class="form-group third">
                        <label>最少数量</label>
                        <input type="number" class="drop-min-count" value="${drop.minCount || 1}" min="1" step="1" data-index="${index}">
                    </div>
                    <div class="form-group third">
                        <label>最多数量</label>
                        <input type="number" class="drop-max-count" value="${drop.maxCount || 1}" min="1" step="1" data-index="${index}">
                    </div>
                    <div class="form-group third">
                        <label>掉落概率（%）</label>
                        <div class="weight-percent-container">
                            <input type="range" class="drop-weight-range" value="${drop.weight || 100}" min="1" max="100" step="1" data-index="${index}">
                            <input type="number" class="drop-weight" value="${drop.weight || 100}" min="1" max="100" step="1" data-index="${index}">
                            <span class="weight-percent-sign">%</span>
                        </div>
                        <span class="field-hint">100% = 必定掉落</span>
                    </div>
                </div>
                ${enchantHtml}
                <div class="form-row">
                    <div class="form-group half">
                        <label>药水类型（可多选）</label>
                        <div class="custom-enchant-tags" data-potion-index="${index}">
                            ${(drop.potionIds || []).length > 0 ? drop.potionIds.map(ef => {
                                const efId = typeof ef === 'string' ? ef : ef.id;
                                const efLevel = typeof ef === 'string' ? 1 : (ef.level || 1);
                                const efDuration = typeof ef === 'string' ? undefined : (ef.duration || undefined);
                                const pName = getPotionDisplayName(efId);
                                const durationText = efDuration != null ? ` ${efDuration}秒` : '';
                                return `<span class="custom-enchant-tag">${pName} Lv.${efLevel}${durationText}<span class="potion-tag-remove" data-potion-id="${efId}" data-drop-index="${index}">&times;</span></span>`;
                            }).join('') : '<span class="field-hint">暂未选择药水</span>'}
                        </div>
                        <button class="btn-add-mini" onclick="openPotionSelector(${index})" style="margin-top:6px;">+ 添加药水</button>
                        <span class="field-hint">药水效果仅对可饮用的物品（如药水瓶、喷溅药水等）生效</span>
                    </div>
                </div>

            </div>
            <div class="drop-card-footer">
                <button class="btn-sm btn-danger" onclick="deleteDrop(${index})">移除此掉落</button>
            </div>
        `;

        container.appendChild(card);

        card.querySelectorAll('.drop-min-count, .drop-max-count').forEach(input => {
            input.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    d.minCount = parseInt(card.querySelector('.drop-min-count').value) || 1;
                    d.maxCount = parseInt(card.querySelector('.drop-max-count').value) || 1;
                }
            });
        });

        card.querySelectorAll('.drop-weight, .drop-weight-range').forEach(input => {
            input.addEventListener('input', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    const val = parseInt(this.value) || 100;
                    d.weight = Math.min(100, Math.max(1, val));
                    card.querySelector('.drop-weight').value = d.weight;
                    card.querySelector('.drop-weight-range').value = d.weight;
                }
            });
        });

        card.querySelectorAll('.potion-tag-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.dropIndex);
                const id = this.dataset.potionId;
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d && d.potionIds) {
                    const pos = d.potionIds.findIndex(ef => {
                        const efId = typeof ef === 'string' ? ef : ef.id;
                        return efId === id;
                    });
                    if (pos > -1) d.potionIds.splice(pos, 1);
                    renderDrops();
                }
            });
        });

        card.querySelectorAll('.drop-enchant-type').forEach(select => {
            select.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    d.enchantType = this.value;
                    renderDrops();
                }
            });
        });

        card.querySelectorAll('.drop-enchant-min, .drop-enchant-max').forEach(input => {
            input.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    d.enchantMin = parseInt(card.querySelector('.drop-enchant-min').value) || 1;
                    d.enchantMax = parseInt(card.querySelector('.drop-enchant-max').value) || 10;
                }
            });
        });

        card.querySelectorAll('.drop-treasure').forEach(cb => {
            cb.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    d.treasure = this.checked;
                }
            });
        });

        card.querySelectorAll('.drop-multi-enchant').forEach(cb => {
            cb.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    d.multiEnchant = this.checked;
                    renderDrops();
                }
            });
        });

        card.querySelectorAll('.drop-multi-enchant-min, .drop-multi-enchant-max').forEach(input => {
            input.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    d.multiEnchantMin = parseInt(card.querySelector('.drop-multi-enchant-min').value) || 1;
                    d.multiEnchantMax = parseInt(card.querySelector('.drop-multi-enchant-max').value) || 3;
                }
            });
        });

        card.querySelectorAll('.drop-exceed-vanilla').forEach(cb => {
            cb.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    d.exceedVanilla = this.checked;
                    renderDrops();
                }
            });
        });

        card.querySelectorAll('.drop-allow-incompatible').forEach(cb => {
            cb.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                const d = datapackData.lootTables[window.currentLootTable].drops[idx];
                if (d) {
                    d.allowIncompatible = this.checked;
                    renderDrops();
                }
            });
        });

    });
}

function getEnchantHtml(drop, index) {
    let html = `<div class="form-row">
        <div class="form-group half">
            <label>附魔</label>
            <select class="drop-enchant-type" data-index="${index}">
                ${ENCHANT_OPTIONS.map(o => `<option value="${o.value}" ${drop.enchantType === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
        </div>
    </div>`;

    if (drop.enchantType === 'random') {
        html += `<div class="form-row enchant-level-row">
            <div class="form-group half">
                <label class="checkbox-label">
                    <input type="checkbox" class="drop-multi-enchant" data-index="${index}" ${drop.multiEnchant ? 'checked' : ''}>
                    <span>是否多项附魔（附魔数量也随机）</span>
                </label>
            </div>
        </div>`;
        if (drop.multiEnchant) {
            html += `<div class="form-row enchant-level-row">
                <div class="form-group third">
                    <label>最少附魔数</label>
                    <input type="number" class="drop-multi-enchant-min" value="${drop.multiEnchantMin || 1}" min="1" max="50" step="1" data-index="${index}">
                </div>
                <div class="form-group third">
                    <label>最多附魔数</label>
                    <input type="number" class="drop-multi-enchant-max" value="${drop.multiEnchantMax || 3}" min="1" max="50" step="1" data-index="${index}">
                </div>
                <div class="form-group third">
                    <label>包含宝藏附魔</label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="drop-treasure" data-index="${index}" ${drop.treasure ? 'checked' : ''}>
                        <span>允许宝藏附魔</span>
                    </label>
                </div>
            </div>`;
        } else {
            html += `<div class="form-row enchant-level-row">
                <div class="form-group third">
                    <label>包含宝藏附魔</label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="drop-treasure" data-index="${index}" ${drop.treasure ? 'checked' : ''}>
                        <span>允许宝藏附魔</span>
                    </label>
                </div>
            </div>`;
        }
        html += `<div class="form-row enchant-level-row">
            <div class="form-group third">
                <label class="checkbox-label">
                    <input type="checkbox" class="drop-exceed-vanilla" data-index="${index}" ${drop.exceedVanilla ? 'checked' : ''}>
                    <span>附魔等级超出原版上限</span>
                </label>
                <span class="field-hint">勾选后附魔等级可超过原版最大等级限制</span>
            </div>
            <div class="form-group third">
                <label class="checkbox-label">
                    <input type="checkbox" class="drop-allow-incompatible" data-index="${index}" ${drop.allowIncompatible ? 'checked' : ''}>
                    <span>允许不兼容的附魔共存</span>
                </label>
                <span class="field-hint">勾选后原本互斥的附魔可同时存在</span>
            </div>
        </div>`;
        if (drop.exceedVanilla || drop.allowIncompatible) {
            html += `<div class="form-row enchant-level-row">
                <div class="form-group third">
                    <label>最小附魔等级</label>
                    <input type="number" class="drop-enchant-min" value="${drop.enchantMin || 1}" min="1" max="255" step="1" data-index="${index}">
                </div>
                <div class="form-group third">
                    <label>最大附魔等级</label>
                    <input type="number" class="drop-enchant-max" value="${drop.enchantMax || 10}" min="1" max="255" step="1" data-index="${index}">
                </div>
            </div>`;
        }
    } else if (drop.enchantType === 'custom') {
        const enchants = drop.customEnchants || [];
        html += `<div class="form-row enchant-level-row">
            <div class="form-group">
                <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;">
                    <span style="font-weight:600;color:#f59e0b;font-size:12px;">⚠ 自定义附魔不受原版限制，最高等级 255</span>
                </div>
                <label>已选自定义附魔：</label>
                <div class="custom-enchant-tags" data-drop-index="${index}">
                    ${enchants.length > 0 ? enchants.map(e => {
                        const enchInfo = PRESET_ENCHANTMENTS.find(pe => pe.id === e.id);
                        return `<span class="custom-enchant-tag">${enchInfo ? enchInfo.name : e.id} ${e.level}<span class="custom-enchant-remove" data-enchant-id="${e.id}" data-drop-index="${index}">&times;</span></span>`;
                    }).join('') : '<span class="field-hint">暂未选择附魔</span>'}
                </div>
                <button class="btn-add-mini" onclick="openEnchantSelector(${index})" style="margin-top:6px;">+ 添加附魔</button>
            </div>
        </div>`;
    }

    return html;
}

function getItemPreview(itemId) {
    if (!itemId) return { icon: '❓', name: '未选择物品' };
    const item = PRESET_ITEMS.find(i => i.id === itemId);
    if (item) {
        const inviconUrl = getInviconUrl(item.id);
        const iconHtml = inviconUrl
            ? `<img src="${inviconUrl}" alt="${item.name}" class="invicon-img invicon-sm" loading="lazy" onerror="this.style.display='none'">`
            : '📦';
        return { icon: iconHtml, name: item.name };
    }
    const parts = itemId.split(':');
    return { icon: '📦', name: parts[1] || itemId };
}

window.openItemSelectorForDrop = function(index) {
    const loot = datapackData.lootTables[window.currentLootTable];
    if (!loot || !loot.drops || !loot.drops[index]) return;

    window._itemSelectCallback = function(selectedId) {
        loot.drops[index].item = selectedId;
        renderDrops();
    };

    window.openItemSelectorForInput('_dummy_loot_input');
};

function openEnchantSelector(dropIndex) {
    const existing = document.getElementById('enchant-selector-modal');
    if (existing) existing.remove();

    const loot = datapackData.lootTables[window.currentLootTable];
    if (!loot || !loot.drops || !loot.drops[dropIndex]) return;
    const drop = loot.drops[dropIndex];
    const currentEnchants = drop.customEnchants || [];

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'enchant-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content" style="max-width: 600px;">
            <span class="close-modal" onclick="document.getElementById('enchant-selector-modal').remove()">&times;</span>
            <div class="modal-header">
                <h3>选择自定义附魔</h3>
            </div>
            <div class="modal-body">
                <p class="field-hint" style="color:#f59e0b;font-weight:600;">⚠ 自定义附魔不受原版限制，可随意搭配，等级最高 255 级</p>
                <div class="item-search">
                    <input type="text" id="enchant-search-input" placeholder="搜索附魔...">
                </div>
                <div id="enchant-selector-list" style="max-height:400px;overflow-y:auto;">
                    ${PRESET_ENCHANTMENTS.map(e => {
                        const existing = currentEnchants.find(ce => ce.id === e.id);
                        const checked = existing ? 'checked' : '';
                        const level = existing ? existing.level : 1;
                        return `
                            <div class="enchant-item" data-id="${e.id}" style="border-bottom:1px solid var(--mc-border);">
                                <label class="checkbox-label" style="display:flex;align-items:center;gap:8px;padding:8px;">
                                    <input type="checkbox" class="enchant-checkbox" data-id="${e.id}" ${checked}>
                                    <span style="flex:1;">${e.name}</span>
                                    <span style="color:#94a3b8;font-size:12px;margin-right:8px;">最高255级</span>
                                    <input type="number" class="enchant-level-input" value="${level}" min="1" max="255" style="width:60px;padding:4px;border:1px solid #475569;border-radius:4px;text-align:center;background:rgba(15,23,42,0.6);color:#f1f5f9;" ${checked ? '' : 'disabled'}>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="document.getElementById('enchant-selector-modal').remove()">取消</button>
                <button id="enchant-confirm-btn" class="btn-primary">确认附魔</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    modal.querySelectorAll('.enchant-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const levelInput = this.closest('.checkbox-label').querySelector('.enchant-level-input');
            levelInput.disabled = !this.checked;
            if (!this.checked) levelInput.value = 1;
        });
    });

    const searchInput = modal.querySelector('#enchant-search-input');
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        modal.querySelectorAll('.enchant-item').forEach(item => {
            const name = item.querySelector('.checkbox-label span').textContent.toLowerCase();
            const id = item.dataset.id.toLowerCase();
            item.style.display = (name.includes(q) || id.includes(q)) ? '' : 'none';
        });
    });

    modal.querySelector('#enchant-confirm-btn').addEventListener('click', function() {
        const selectedEnchants = [];
        modal.querySelectorAll('.enchant-checkbox:checked').forEach(cb => {
            const id = cb.dataset.id;
            const levelInput = cb.closest('.checkbox-label').querySelector('.enchant-level-input');
            const level = parseInt(levelInput.value) || 1;
            const enchInfo = PRESET_ENCHANTMENTS.find(e => e.id === id);
            selectedEnchants.push({ id, level, maxLevel: enchInfo ? enchInfo.maxLevel : 1 });
        });
        drop.customEnchants = selectedEnchants;
        modal.remove();
        renderDrops();
        showNotification(`已选择 ${selectedEnchants.length} 个附魔`, 'success');
    });

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}
window.openEnchantSelector = openEnchantSelector;

window.deleteDrop = function(index) {
    window.showConfirm('确定要移除此掉落物品吗？', function(result) {
        if (result) {
            const loot = datapackData.lootTables[window.currentLootTable];
            if (loot && loot.drops) {
                loot.drops.splice(index, 1);
                renderDrops();
                showNotification('掉落物品已移除', 'success');
            }
        }
    });
};

function saveCurrentLootTable() {
    if (!window.currentLootTable) {
        createDefaultLootTable();
    }

    const loot = datapackData.lootTables[window.currentLootTable];
    const name = document.getElementById('loot-name').value.trim();
    if (!name) {
        showNotification('请输入战利品表名称！', 'error');
        return;
    }
    loot.name = name;
    loot.type = document.getElementById('loot-type').value;
    loot.coexist = document.getElementById('loot-coexist').checked;

    if (loot.type === 'block') {
        const tags = document.getElementById('loot-target-tags');
        const tagItems = tags.querySelectorAll('.target-tag');
        if (tagItems.length === 0) {
            showNotification('请选择至少一个目标方块！', 'warning');
            return;
        }
    } else if (loot.type === 'chest') {
        const tags = document.getElementById('loot-target-tags');
        const tagItems = tags.querySelectorAll('.target-tag');
        if (tagItems.length === 0) {
            showNotification('请选择至少一个结构宝箱！', 'warning');
            return;
        }
    } else if (loot.type === 'entity') {
        const tags = document.getElementById('loot-target-tags');
        const tagItems = tags.querySelectorAll('.target-tag');
        if (tagItems.length === 0) {
            showNotification('请选择至少一个目标实体！', 'warning');
            return;
        }
    } else if (loot.type === 'gameplay') {
        const tags = document.getElementById('loot-target-tags');
        const tagItems = tags.querySelectorAll('.target-tag');
        if (tagItems.length === 0) {
            showNotification('请选择至少一个游戏玩法设置！', 'warning');
            return;
        }
    } else if (loot.type === 'none') {
        loot.targets = [];
    }

    if (!loot.drops || loot.drops.length === 0 || loot.drops.every(d => !d.item)) {
        showNotification('请至少添加一个掉落物品！', 'warning');
        return;
    }
    if (loot.drops.some(d => !d.item)) {
        showNotification('部分掉落物品未选择物品！', 'warning');
        return;
    }

    const displaySpan = document.getElementById('loot-display-' + window.currentLootTable);
    if (displaySpan) {
        const typeIcons = { block: '⛏️', entity: '👾', chest: '📦', gameplay: '🎮', none: '📜' };
        displaySpan.innerHTML = (typeIcons[loot.type] || '💎') + ' ' + loot.name;
    }

    showNotification('战利品表已保存！', 'success');
}

function getPotionDisplayName(potionId) {
    if (!potionId) return '';
    const found = PRESET_POTIONS.find(p => p.id === potionId);
    return found ? found.name : potionId.split(':').pop() || potionId;
}

// ===== 药水选择弹窗（多选+等级+时长） =====
window.openPotionSelector = function(dropIndex) {
    const existing = document.getElementById('potion-selector-modal');
    if (existing) existing.remove();

    const loot = datapackData.lootTables[window.currentLootTable];
    if (!loot || !loot.drops || !loot.drops[dropIndex]) return;
    const drop = loot.drops[dropIndex];
    const currentPotions = (drop.potionIds || []).map(ef => typeof ef === 'string' ? { id: ef, level: 1 } : ef);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'potion-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content" style="max-width: 680px;">
            <span class="close-modal" onclick="document.getElementById('potion-selector-modal').remove()">&times;</span>
            <div class="modal-header">
                <h3>选择药水类型（可多选，自定义等级与时长）</h3>
                <p class="field-hint" style="color:#f59e0b;font-weight:600;margin-top:4px;">⚠ 等级最高 255 级，时长最长 9999 秒</p>
            </div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="potion-search-input" placeholder="搜索药水...">
                </div>
                <div id="potion-selector-list" style="max-height:350px;overflow-y:auto;">
                    ${PRESET_POTIONS.map(p => {
                        const existing = currentPotions.find(ef => ef.id === p.id);
                        const checked = existing ? 'checked' : '';
                        const level = existing ? existing.level : 1;
                        const duration = existing ? existing.duration : 30;
                        return `
                            <div class="enchant-item" data-id="${p.id}" style="border-bottom:1px solid var(--mc-border);">
                                <label class="checkbox-label" style="display:flex;align-items:center;gap:8px;padding:8px;cursor:pointer;">
                                    <input type="checkbox" class="potion-checkbox" data-id="${p.id}" ${checked}>
                                    <span style="flex:1;min-width:80px;">${p.name}</span>
                                    <span style="color:#94a3b8;font-size:12px;white-space:nowrap;">等级</span>
                                    <input type="number" class="potion-level-input" value="${level}" min="1" max="255" style="width:55px;padding:4px;border:1px solid #475569;border-radius:4px;text-align:center;background:rgba(15,23,42,0.6);color:#f1f5f9;" ${checked ? '' : 'disabled'}>
                                    <span style="color:#94a3b8;font-size:12px;white-space:nowrap;">时长</span>
                                    <input type="number" class="potion-duration-input" value="${duration}" min="1" max="9999" style="width:60px;padding:4px;border:1px solid #475569;border-radius:4px;text-align:center;background:rgba(15,23,42,0.6);color:#f1f5f9;" ${checked ? '' : 'disabled'}>
                                    <span style="color:#94a3b8;font-size:12px;white-space:nowrap;">秒</span>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="custom-item-section" style="margin-top:12px;">
                    <div class="custom-item-divider"><span>或者手动输入自定义药水ID</span></div>
                    <div class="custom-item-input-group">
                        <input type="text" id="potion-custom-input" placeholder="例如: minecraft:custom_potion">
                        <button id="potion-custom-add" class="btn-custom-item">添加</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <span id="potion-selected-count" style="color:var(--mc-text-secondary);font-size:13px;margin-right:auto;">已选择 ${currentPotions.length} 个</span>
                <button id="potion-select-all-btn" class="btn-add-mini">☑ 全选当前显示</button>
                <button class="btn-cancel" onclick="document.getElementById('potion-selector-modal').remove()">取消</button>
                <button id="potion-confirm-btn" class="btn-primary">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    const selectedPotions = currentPotions.map(ef => ({ id: ef.id, level: ef.level, duration: ef.duration }));

    function updateCount() {
        const countEl = modal.querySelector('#potion-selected-count');
        if (countEl) countEl.textContent = '已选择 ' + selectedPotions.length + ' 个';
    }

    modal.querySelectorAll('.potion-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const id = this.dataset.id;
            const label = this.closest('.checkbox-label');
            const levelInput = label.querySelector('.potion-level-input');
            const durationInput = label.querySelector('.potion-duration-input');
            levelInput.disabled = !this.checked;
            durationInput.disabled = !this.checked;
            if (!this.checked) {
                const idx = selectedPotions.findIndex(ef => ef.id === id);
                if (idx > -1) selectedPotions.splice(idx, 1);
                levelInput.value = 1;
                durationInput.value = 30;
            } else {
                if (!selectedPotions.find(ef => ef.id === id)) {
                    selectedPotions.push({ id, level: parseInt(levelInput.value) || 1, duration: parseInt(durationInput.value) || 30 });
                }
            }
            updateCount();
            updateSelectAllPotionsBtn();
        });
    });

    modal.querySelectorAll('.potion-level-input').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.closest('.checkbox-label').querySelector('.potion-checkbox')?.dataset.id;
            if (id) {
                const ef = selectedPotions.find(e => e.id === id);
                if (ef) ef.level = parseInt(this.value) || 1;
                else {
                    const durationInput = this.closest('.checkbox-label').querySelector('.potion-duration-input');
                    selectedPotions.push({ id, level: parseInt(this.value) || 1, duration: parseInt(durationInput.value) || 30 });
                }
            }
        });
        input.addEventListener('input', function() {
            const id = this.closest('.checkbox-label').querySelector('.potion-checkbox')?.dataset.id;
            if (id) {
                const ef = selectedPotions.find(e => e.id === id);
                if (ef) ef.level = parseInt(this.value) || 1;
            }
        });
    });

    modal.querySelectorAll('.potion-duration-input').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.closest('.checkbox-label').querySelector('.potion-checkbox')?.dataset.id;
            if (id) {
                const ef = selectedPotions.find(e => e.id === id);
                if (ef) ef.duration = parseInt(this.value) || 30;
                else {
                    const levelInput = this.closest('.checkbox-label').querySelector('.potion-level-input');
                    selectedPotions.push({ id, level: parseInt(levelInput.value) || 1, duration: parseInt(this.value) || 30 });
                }
            }
        });
        input.addEventListener('input', function() {
            const id = this.closest('.checkbox-label').querySelector('.potion-checkbox')?.dataset.id;
            if (id) {
                const ef = selectedPotions.find(e => e.id === id);
                if (ef) ef.duration = parseInt(this.value) || 30;
            }
        });
    });

    const searchInput = modal.querySelector('#potion-search-input');
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        modal.querySelectorAll('.enchant-item').forEach(item => {
            const name = item.querySelector('.checkbox-label span').textContent.toLowerCase();
            const id = item.dataset.id.toLowerCase();
            item.style.display = (name.includes(q) || id.includes(q)) ? '' : 'none';
        });
        updateSelectAllPotionsBtn();
    });

    function updateSelectAllPotionsBtn() {
        const btn = modal.querySelector('#potion-select-all-btn');
        if (!btn) return;
        const visibleItems = [];
        modal.querySelectorAll('.enchant-item').forEach(item => {
            if (item.style.display !== 'none') visibleItems.push(item);
        });
        const allVisibleChecked = visibleItems.length > 0 && visibleItems.every(item => {
            const cb = item.querySelector('.potion-checkbox');
            return cb && cb.checked;
        });
        btn.textContent = allVisibleChecked ? '☐ 取消全选' : '☑ 全选当前显示';
    }

    const selectAllPotionsBtn = modal.querySelector('#potion-select-all-btn');
    if (selectAllPotionsBtn) {
        selectAllPotionsBtn.addEventListener('click', function() {
            const visibleItems = [];
            modal.querySelectorAll('.enchant-item').forEach(item => {
                if (item.style.display !== 'none') visibleItems.push(item);
            });
            const allVisibleChecked = visibleItems.length > 0 && visibleItems.every(item => {
                const cb = item.querySelector('.potion-checkbox');
                return cb && cb.checked;
            });
            visibleItems.forEach(item => {
                const cb = item.querySelector('.potion-checkbox');
                const id = cb.dataset.id;
                const label = item.querySelector('.checkbox-label');
                const levelInput = label.querySelector('.potion-level-input');
                const durationInput = label.querySelector('.potion-duration-input');
                if (allVisibleChecked) {
                    cb.checked = false;
                    levelInput.disabled = true;
                    durationInput.disabled = true;
                    const idx = selectedPotions.findIndex(ef => ef.id === id);
                    if (idx > -1) selectedPotions.splice(idx, 1);
                } else {
                    cb.checked = true;
                    levelInput.disabled = false;
                    durationInput.disabled = false;
                    if (!selectedPotions.find(ef => ef.id === id)) {
                        selectedPotions.push({ id, level: parseInt(levelInput.value) || 1, duration: parseInt(durationInput.value) || 30 });
                    }
                }
            });
            updateCount();
            this.textContent = allVisibleChecked ? '☑ 全选当前显示' : '☐ 取消全选';
        });
    }

    const customInput = modal.querySelector('#potion-custom-input');
    modal.querySelector('#potion-custom-add').addEventListener('click', function() {
        const val = customInput.value.trim();
        if (val) {
            if (!selectedPotions.find(ef => ef.id === val)) {
                selectedPotions.push({ id: val, level: 1, duration: 30 });
                updateCount();
                updateSelectAllPotionsBtn();
                modal.querySelectorAll('.potion-checkbox').forEach(cb => {
                    if (cb.dataset.id === val) cb.checked = true;
                });
            }
            customInput.value = '';
        }
    });
    customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            modal.querySelector('#potion-custom-add').click();
        }
    });

    modal.querySelector('#potion-confirm-btn').addEventListener('click', function() {
        drop.potionIds = selectedPotions.map(ef => ({ id: ef.id, level: ef.level, duration: ef.duration }));
        modal.remove();
        renderDrops();
        showNotification('已选择 ' + drop.potionIds.length + ' 个药水', 'success');
    });

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

export { saveCurrentLootTable };

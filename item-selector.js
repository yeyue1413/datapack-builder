import { PRESET_ITEMS } from './data/data-items.js';
import { PRESET_BLOCKS } from './data/data-blocks.js';
import { PRESET_ENTITIES } from './data/data-entities.js';
import { PRESET_BUCKETS } from './data/data-environment.js';
import { currentItemTarget, currentItemInputId } from './data/data-core.js';
import { getInviconUrl } from './invicon-map.js';
import { updateItemPreview, updateDataPreview, showNotification } from './utils.js';

let currentCategory = 'all';

// 初始化物品选择器
export function initItemSelector() {
    renderItemGrid();
}

// 渲染物品网格
export function renderItemGrid() {
    const grid = document.getElementById('item-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const searchTerm = document.getElementById('item-search-input')?.value.toLowerCase() || '';
    
    PRESET_ITEMS.forEach(item => {
        // 分类过滤
        if (currentCategory !== 'all' && item.category !== currentCategory) return;
        
        // 搜索过滤
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !item.id.toLowerCase().includes(searchTerm)) return;
        
        const div = document.createElement('div');
        div.className = 'item-option';
        const inviconUrl = getInviconUrl(item.id);
        div.innerHTML = `
            <span class="item-icon">
                ${inviconUrl ? `<img src="${inviconUrl}" alt="${item.name}" class="invicon-img" loading="lazy" onerror="this.style.display='none'">` : ''}
            </span>
            <span class="item-name">${item.name}</span>
            <span class="item-id">${item.id}</span>
        `;
        div.addEventListener('click', () => selectItem(item.id));
        grid.appendChild(div);
    });
}

// 过滤物品
export function filterItems() {
    renderItemGrid();
}

// 按分类过滤物品
export function filterByCategory(category, btnElement) {
    currentCategory = category;

    // 更新按钮状态
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (btnElement) {
        btnElement.classList.add('active');
    } else if (event && event.target) {
        event.target.classList.add('active');
    }

    renderItemGrid();
}

// 打开物品选择器（用于网格单元格）
export function openItemSelector(btn) {
    const wrapper = btn.closest('.grid-cell-wrapper');
    const input = wrapper.querySelector('.grid-cell-input');
    window.currentItemTarget = input;
    window.currentItemInputId = null;
    
    const customInput = document.getElementById('custom-item-input');
    if (customInput) customInput.value = '';
    
    document.getElementById('item-selector-modal').classList.add('active');
    renderItemGrid();
}

// 打开物品选择器（用于普通输入框）
export function openItemSelectorForInput(inputId) {
    window.currentItemTarget = null;
    window.currentItemInputId = inputId;
    
    const customInput = document.getElementById('custom-item-input');
    if (customInput) customInput.value = '';
    
    document.getElementById('item-selector-modal').classList.add('active');
    renderItemGrid();
}

// 关闭物品选择器
export function closeItemSelector() {
    document.getElementById('item-selector-modal').classList.remove('active');
    window.currentItemTarget = null;
    window.currentItemInputId = null;
}

// 选择物品
export function selectItem(itemId) {
    let targetInput = null;
    if (window.currentItemTarget) {
        window.currentItemTarget.value = itemId;
        targetInput = window.currentItemTarget;
    } else if (window.currentItemInputId) {
        const input = document.getElementById(window.currentItemInputId);
        if (input) {
            input.value = itemId;
            targetInput = input;
        }
    }
    if (targetInput) {
        updateItemPreview(targetInput);
    }
    closeItemSelector();
    // 调用物品选择完成回调
    if (window._itemSelectCallback) {
        window._itemSelectCallback(itemId);
        window._itemSelectCallback = null;
    }
}

// 选择自定义物品
export function selectCustomItem() {
    const input = document.getElementById('custom-item-input');
    if (!input) return;
    const itemId = input.value.trim();
    if (!itemId) {
        showNotification('请输入物品ID！', 'error');
        return;
    }
    // 如果没有命名空间前缀，自动添加 minecraft:
    const finalId = itemId.includes(':') ? itemId : 'minecraft:' + itemId;
    selectItem(finalId);
    input.value = '';
}

// ===== 数据选择器（方块/实体/桶通用） =====

let dataSelectorType = '';
let dataSelectorInputId = '';

function getDataList(type) {
    switch (type) {
        case 'block': return PRESET_BLOCKS;
        case 'entity': return PRESET_ENTITIES;
        case 'bucket': return PRESET_BUCKETS;
        default: return [];
    }
}

function getDataCategories(type) {
    return ['all'];
}

function getDataName(type) {
    switch (type) {
        case 'block': return '方块';
        case 'entity': return '实体';
        case 'bucket': return '桶';
        default: return '数据';
    }
}

export function openBlockSelector() {
    openDataSelector('block', 'adv-trigger-block');
}

export function openEntitySelector() {
    openDataSelector('entity', 'adv-trigger-entity');
}

export function openBucketSelector() {
    openDataSelector('bucket', 'adv-trigger-bucket');
}

export function openDataSelector(type, inputId) {
    dataSelectorType = type;
    dataSelectorInputId = inputId;

    const titleEl = document.getElementById('data-selector-title');
    if (titleEl) titleEl.textContent = '选择' + getDataName(type);

    const searchInput = document.getElementById('data-selector-search');
    if (searchInput) searchInput.value = '';

    const categoriesEl = document.getElementById('data-selector-categories');
    if (categoriesEl) {
        const cats = getDataCategories(type);
        categoriesEl.innerHTML = cats.map(c =>
            `<button class="category-btn ${c === 'all' ? 'active' : ''}" onclick="filterDataByCategory('${c}', this)">${c === 'all' ? '全部' : c}</button>`
        ).join('');
    }

    renderDataGrid(type);

    document.getElementById('data-selector-modal').classList.add('active');
}

export function closeDataSelector() {
    document.getElementById('data-selector-modal')?.classList.remove('active');
    dataSelectorType = '';
    dataSelectorInputId = '';
}

export function renderDataGrid(type) {
    const grid = document.getElementById('data-selector-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const searchTerm = document.getElementById('data-selector-search')?.value.toLowerCase() || '';
    const dataList = getDataList(type);

    dataList.forEach(item => {
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !item.id.toLowerCase().includes(searchTerm)) return;

        const div = document.createElement('div');
        div.className = 'item-option';
        const inviconUrl = getInviconUrl(item.id);
        div.innerHTML = `
            <span class="item-icon">
                ${inviconUrl ? `<img src="${inviconUrl}" alt="${item.name}" class="invicon-img" loading="lazy" onerror="this.style.display='none'">` : ''}
            </span>
            <span class="item-name">${item.name}</span>
            <span class="item-id">${item.id}</span>
        `;
        div.addEventListener('click', () => selectDataItem(item.id));
        grid.appendChild(div);
    });

    if (grid.children.length === 0) {
        grid.innerHTML = '<div style="color:#888;padding:20px;text-align:center;">无匹配结果</div>';
    }
}

export function selectDataItem(dataId) {
    const input = document.getElementById(dataSelectorInputId);
    if (input) {
        input.value = dataId;
        updateDataPreview(input, dataSelectorType);
    }
    closeDataSelector();
}

export function filterDataItems() {
    if (dataSelectorType) {
        renderDataGrid(dataSelectorType);
    }
}

export function filterDataByCategory(category, btnElement) {
    document.querySelectorAll('#data-selector-categories .category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (btnElement) {
        btnElement.classList.add('active');
    }
    if (dataSelectorType) {
        renderDataGrid(dataSelectorType);
    }
}

// 暴露全局函数
window.filterItems = filterItems;
window.filterByCategory = filterByCategory;
window.openItemSelector = openItemSelector;
window.openItemSelectorForInput = openItemSelectorForInput;
window.closeItemSelector = closeItemSelector;
window.selectCustomItem = selectCustomItem;
window.openBlockSelector = openBlockSelector;
window.openEntitySelector = openEntitySelector;
window.openBucketSelector = openBucketSelector;
window.openDataSelector = openDataSelector;
window.closeDataSelector = closeDataSelector;
window.filterDataItems = filterDataItems;
window.filterDataByCategory = filterDataByCategory;

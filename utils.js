import { PRESET_ITEMS } from './data/data-items.js';
import { PRESET_BLOCKS } from './data/data-blocks.js';
import { PRESET_ENTITIES } from './data/data-entities.js';
import { PRESET_BUCKETS } from './data/data-environment.js';
import { getInviconUrl } from './invicon-map.js';

// 生成物品预览HTML（图标+名称）
export function getItemPreviewHtml(itemId) {
    if (!itemId) return '<span class="field-hint">未选择物品</span>';
    const item = PRESET_ITEMS.find(i => i.id === itemId);
    if (item) {
        const inviconUrl = getInviconUrl(item.id);
        const iconHtml = inviconUrl
            ? `<img src="${inviconUrl}" alt="${item.name}" class="invicon-img invicon-sm" loading="lazy" onerror="this.style.display='none'">`
            : '';
        return `<span class="item-icon">${iconHtml}</span><span class="item-name">${item.name}</span>`;
    }
    const parts = itemId.split(':');
    const shortName = parts[1] || itemId;
    const inviconUrl = getInviconUrl(itemId);
    const iconHtml = inviconUrl
        ? `<img src="${inviconUrl}" alt="${shortName}" class="invicon-img invicon-sm" loading="lazy" onerror="this.style.display='none'">`
        : '';
    return `<span class="item-icon">${iconHtml}</span><span class="item-name">${shortName}</span>`;
}

// 更新物品预览元素
export function updateItemPreview(inputEl) {
    if (!inputEl) return;
    const wrapper = inputEl.closest('.grid-cell-wrapper');
    let previewEl;
    if (wrapper) {
        previewEl = wrapper.querySelector('.grid-cell-preview');
    } else {
        const previewId = inputEl.id ? 'preview-' + inputEl.id : null;
        if (previewId) {
            previewEl = document.getElementById(previewId);
        }
        if (!previewEl) {
            previewEl = inputEl.parentElement.querySelector('.item-preview');
        }
    }
    if (!previewEl) return;
    const itemId = inputEl.value;
    if (!itemId) {
        previewEl.innerHTML = '';
        previewEl.style.display = 'none';
        return;
    }
    previewEl.innerHTML = getItemPreviewHtml(itemId);
    previewEl.style.display = 'flex';
}

// 更新数据选择预览（用于方块/实体/桶）
export function updateDataPreview(inputEl, type) {
    if (!inputEl) return;
    const previewId = inputEl.id ? 'preview-' + inputEl.id : null;
    let previewEl = previewId ? document.getElementById(previewId) : null;
    if (!previewEl) {
        previewEl = inputEl.parentElement.querySelector('.item-preview');
    }
    if (!previewEl) return;

    const dataId = inputEl.value;
    if (!dataId) {
        previewEl.innerHTML = '';
        previewEl.style.display = 'none';
        return;
    }

    let dataList = [];
    if (type === 'block') dataList = PRESET_BLOCKS;
    else if (type === 'entity') dataList = PRESET_ENTITIES;
    else if (type === 'bucket') dataList = PRESET_BUCKETS;

    const item = dataList.find(i => i.id === dataId);
    if (item) {
        const inviconUrl = getInviconUrl(item.id);
        const iconHtml = inviconUrl
            ? `<img src="${inviconUrl}" alt="${item.name}" class="invicon-img invicon-sm" loading="lazy" onerror="this.style.display='none'">`
            : '';
        previewEl.innerHTML = `<span class="item-icon">${iconHtml}</span><span class="item-name">${item.name}</span>`;
        previewEl.style.display = 'flex';
    } else {
        const parts = dataId.split(':');
        const shortName = parts[1] || dataId;
        const inviconUrl = getInviconUrl(dataId);
        const iconHtml = inviconUrl
            ? `<img src="${inviconUrl}" alt="${shortName}" class="invicon-img invicon-sm" loading="lazy" onerror="this.style.display='none'">`
            : '';
        previewEl.innerHTML = `<span class="item-icon">${iconHtml}</span><span class="item-name">${shortName}</span>`;
        previewEl.style.display = 'flex';
    }
}

// 显示通知
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }, 10);
}

// 生成命令标题
export function getCommandTitle(cmdType) {
    const titles = {
        tellraw: '发送消息',
        give: '给予物品',
        summon: '生成实体',
        tp: '传送',
        effect: '效果',
        scoreboard: '计分板',
        execute: '执行条件',
        schedule: '定时执行',
        setblock: '放置方块',
        fill: '填充区域'
    };
    return titles[cmdType] || '命令编辑器';
}

// 从模态框生成命令
export function generateCommandFromModal() {
    const cmdType = document.getElementById('modal-title').textContent;
    
    if (cmdType.includes('发送消息')) {
        const target = document.getElementById('cmd-target').value || '@a';
        const message = document.getElementById('cmd-message').value || 'Hello';
        const color = document.getElementById('cmd-color').value;
        
        if (color) {
            return `tellraw ${target} {"text":"${message}","color":"${color}"}`;
        } else {
            return `tellraw ${target} {"text":"${message}"}`;
        }
    } else if (cmdType.includes('给予物品')) {
        const target = document.getElementById('cmd-target').value || '@p';
        const item = document.getElementById('cmd-item').value || 'minecraft:diamond';
        const count = document.getElementById('cmd-count').value || '1';
        return `give ${target} ${item} ${count}`;
    } else if (cmdType.includes('生成实体')) {
        const entity = document.getElementById('cmd-entity').value || 'minecraft:zombie';
        const x = document.getElementById('cmd-x').value || '~';
        const y = document.getElementById('cmd-y').value || '~';
        const z = document.getElementById('cmd-z').value || '~';
        return `summon ${entity} ${x} ${y} ${z}`;
    } else if (cmdType.includes('传送')) {
        const target = document.getElementById('cmd-target').value || '@p';
        const x = document.getElementById('cmd-x').value || '~';
        const y = document.getElementById('cmd-y').value || '~';
        const z = document.getElementById('cmd-z').value || '~';
        return `tp ${target} ${x} ${y} ${z}`;
    } else if (cmdType.includes('效果')) {
        const target = document.getElementById('cmd-target').value || '@p';
        const effect = document.getElementById('cmd-effect-type').value || 'minecraft:speed';
        const duration = document.getElementById('cmd-duration').value || '10';
        const amplifier = document.getElementById('cmd-amplifier').value || '0';
        return `effect give ${target} ${effect} ${duration} ${amplifier}`;
    } else if (cmdType.includes('计分板')) {
        const action = document.getElementById('cmd-scoreboard-action').value || 'objectives add';
        const objective = document.getElementById('cmd-objective').value || 'kills';
        const params = document.getElementById('cmd-params').value || 'dummy';
        return `scoreboard ${action} ${objective} ${params}`;
    } else if (cmdType.includes('执行条件')) {
        const condition = document.getElementById('cmd-condition').value || 'as @a at @s';
        const run = document.getElementById('cmd-run').value || 'say Hello';
        return `execute ${condition} run ${run}`;
    } else if (cmdType.includes('定时执行')) {
        const func = document.getElementById('cmd-function').value || 'my_function';
        const time = document.getElementById('cmd-time').value || '20t';
        return `schedule function ${func} ${time}`;
    } else if (cmdType.includes('放置方块')) {
        const x = document.getElementById('cmd-x').value || '~';
        const y = document.getElementById('cmd-y').value || '~';
        const z = document.getElementById('cmd-z').value || '~';
        const block = document.getElementById('cmd-block').value || 'minecraft:diamond_block';
        return `setblock ${x} ${y} ${z} ${block}`;
    } else if (cmdType.includes('填充区域')) {
        const x1 = document.getElementById('cmd-x1').value || '~';
        const y1 = document.getElementById('cmd-y1').value || '~';
        const z1 = document.getElementById('cmd-z1').value || '~';
        const x2 = document.getElementById('cmd-x2').value || '~10';
        const y2 = document.getElementById('cmd-y2').value || '~10';
        const z2 = document.getElementById('cmd-z2').value || '~10';
        const block = document.getElementById('cmd-block').value || 'minecraft:stone';
        return `fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${block}`;
    }
    return '';
}

import { datapackData } from '../data/data-core.js';
import { PRESET_ENCHANTMENTS } from '../data/data-loot.js';
import { showNotification, updateItemPreview } from '../utils.js';

export let vanillaRecipes = [];

export function initRecipeEditor() {
    // 自动创建默认配方
    createDefaultRecipe();

    // 加载原版配方数据
    loadVanillaRecipes();

    // 为所有配方物品输入框添加手动输入预览更新
    function setupItemInputListeners() {
        // 合成网格输入
        document.querySelectorAll('.grid-cell-input').forEach(cell => {
            cell.addEventListener('input', function() {
                updateItemPreview(this);
            });
        });
        // 熔炉输入
        const smeltingInput = document.getElementById('smelting-input');
        if (smeltingInput) {
            smeltingInput.addEventListener('input', function() {
                updateItemPreview(this);
            });
        }
        // 切石机输入
        const stonecuttingInput = document.getElementById('stonecutting-input');
        if (stonecuttingInput) {
            stonecuttingInput.addEventListener('input', function() {
                updateItemPreview(this);
            });
        }
        // 锻造台输入
        ['smithing-template', 'smithing-base', 'smithing-addition'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', function() {
                    updateItemPreview(this);
                });
            }
        });
        // 输出物品
        const resultInput = document.getElementById('recipe-result');
        if (resultInput) {
            resultInput.addEventListener('input', function() {
                updateItemPreview(this);
            });
        }
    }
    setupItemInputListeners();

    const addBtn = document.getElementById('add-recipe');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            window.showPrompt('添加配方', '英文，无空格', '', function(recipeName) {
                if (recipeName && recipeName.trim()) {
                    const recipeId = recipeName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    if (!datapackData.recipes[recipeId]) {
                        datapackData.recipes[recipeId] = {
                            name: recipeName,
                            type: 'crafting_shaped',
                            pattern: [['', '', ''], ['', '', ''], ['', '', '']],
                            result: '',
                            count: 1,
                            input: '',
                            xp: 0,
                            cookingTime: 200,
                            stonecuttingCount: 1,
                            template: '',
                            base: '',
                            addition: '',
                            group: '',
                            category: 'misc',
                            showNotification: true,
                            unlockType: 'craft',
                            resultComponents: {}
                        };
                        addRecipeToList(recipeId);
                        showNotification('配方已添加！', 'success');
                    } else {
                        showNotification('配方名称已存在！', 'error');
                    }
                }
            });
        });
    }

    // 管理原版配方按钮
    const manageBtn = document.getElementById('manage-vanilla-recipes');
    if (manageBtn) {
        manageBtn.addEventListener('click', function() {
            openVanillaRecipeModal();
        });
    }

    // 保存原版配方选择
    const saveVanillaBtn = document.getElementById('save-vanilla-recipes');
    if (saveVanillaBtn) {
        saveVanillaBtn.addEventListener('click', function() {
            saveVanillaRecipeSelection();
        });
    }

    const typeSelect = document.getElementById('recipe-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            updateRecipeEditorVisibility();
        });
    }

    const clearBtn = document.getElementById('clear-grid');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            document.querySelectorAll('.grid-cell-input').forEach(cell => {
                cell.value = '';
                updateItemPreview(cell);
            });
        });
    }

    const saveBtn = document.getElementById('save-recipe');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // 如果没有当前配方，自动创建一个
            if (!window.currentRecipe) {
                createDefaultRecipe();
            }

            const recipeType = document.getElementById('recipe-type').value;
            const result = document.getElementById('recipe-result').value;

            if (!result) {
                showNotification('请设置输出物品！', 'error');
                return;
            }

            if (recipeType === 'crafting_shaped' || recipeType === 'crafting_shapeless') {
                const hasInput = Array.from(document.querySelectorAll('.grid-cell-input')).some(cell => cell.value);
                if (!hasInput) {
                    showNotification('合成配方至少需要一种输入物品！', 'error');
                    return;
                }
            } else if (['smelting', 'blasting', 'smoking', 'campfire_cooking'].includes(recipeType)) {
                const input = document.getElementById('smelting-input').value;
                if (!input) {
                    showNotification('请设置输入物品！', 'error');
                    return;
                }
            } else if (recipeType === 'stonecutting') {
                const input = document.getElementById('stonecutting-input').value;
                if (!input) {
                    showNotification('请设置输入物品！', 'error');
                    return;
                }
            } else if (recipeType === 'smithing_transform') {
                const template = document.getElementById('smithing-template').value;
                const base = document.getElementById('smithing-base').value;
                const addition = document.getElementById('smithing-addition').value;
                if (!template || !base || !addition) {
                    showNotification('锻造台配方需要设置模板、基础物品和附加物品！', 'error');
                    return;
                }
            }

            const pattern = [];
            document.querySelectorAll('.grid-row').forEach((row, i) => {
                pattern[i] = [];
                row.querySelectorAll('.grid-cell-input').forEach((cell, j) => {
                    pattern[i][j] = cell.value || '';
                });
            });

            datapackData.recipes[window.currentRecipe] = {
                name: document.getElementById('recipe-name').value || '默认配方',
                type: recipeType,
                pattern: pattern,
                result: result,
                count: parseInt(document.getElementById('recipe-count').value) || 1,
                input: document.getElementById('smelting-input').value,
                xp: parseFloat(document.getElementById('smelting-xp').value) || 0,
                cookingTime: parseInt(document.getElementById('smelting-time').value) || 200,
                stonecuttingCount: parseInt(document.getElementById('stonecutting-count').value) || 1,
                template: document.getElementById('smithing-template').value,
                base: document.getElementById('smithing-base').value,
                addition: document.getElementById('smithing-addition').value,
                group: document.getElementById('recipe-group')?.value || '',
                category: document.getElementById('recipe-category')?.value || 'misc',
                showNotification: document.getElementById('recipe-show-notification')?.checked !== false,
                unlockType: document.getElementById('recipe-unlock-type')?.value || 'craft',
                resultComponents: collectResultComponents()
            };
            showNotification('配方已保存！', 'success');
        });
    }
}

// 创建默认配方
function createDefaultRecipe() {
    const defaultRecipeId = 'default_recipe';
    if (!datapackData.recipes[defaultRecipeId]) {
        datapackData.recipes[defaultRecipeId] = {
            name: '默认配方',
            type: 'crafting_shaped',
            pattern: [['', '', ''], ['', '', ''], ['', '', '']],
            result: '',
            count: 1,
            input: '',
            xp: 0,
            cookingTime: 200,
            stonecuttingCount: 1,
            template: '',
            base: '',
            addition: '',
            group: '',
            category: 'misc',
            showNotification: true,
            unlockType: 'craft',
            resultComponents: {}
        };
    }

    if (!document.querySelector('[data-recipe="' + defaultRecipeId + '"]')) {
        addRecipeToList(defaultRecipeId);
    }
    window.currentRecipe = defaultRecipeId;
    loadRecipeData(defaultRecipeId);
}

export function updateRecipeEditorVisibility() {
    const recipeType = document.getElementById('recipe-type')?.value;

    const craftingEditor = document.getElementById('crafting-recipe-editor');
    const smeltingEditor = document.getElementById('smelting-recipe-editor');
    const stonecuttingEditor = document.getElementById('stonecutting-recipe-editor');
    const smithingEditor = document.getElementById('smithing-recipe-editor');

    if (craftingEditor) craftingEditor.style.display = 'none';
    if (smeltingEditor) smeltingEditor.style.display = 'none';
    if (stonecuttingEditor) stonecuttingEditor.style.display = 'none';
    if (smithingEditor) smithingEditor.style.display = 'none';

    if (recipeType === 'crafting_shaped' || recipeType === 'crafting_shapeless') {
        if (craftingEditor) craftingEditor.style.display = 'block';
    } else if (['smelting', 'blasting', 'smoking', 'campfire_cooking'].includes(recipeType)) {
        if (smeltingEditor) smeltingEditor.style.display = 'block';
    } else if (recipeType === 'stonecutting') {
        if (stonecuttingEditor) stonecuttingEditor.style.display = 'block';
    } else if (recipeType === 'smithing_transform') {
        if (smithingEditor) smithingEditor.style.display = 'block';
    }
}

export function addRecipeToList(recipeId) {
    const li = document.createElement('li');
    li.className = 'recipe-item';
    li.setAttribute('data-recipe', recipeId);
    li.innerHTML = '<span>' + recipeId + '</span><button class="delete-btn" onclick="deleteRecipe(\'' + recipeId + '\', event)">删除</button>';
    li.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) return;
        document.querySelectorAll('.recipe-item').forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        window.currentRecipe = recipeId;
        loadRecipeData(recipeId);
    });
    const list = document.getElementById('recipe-list');
    if (list) {
        list.appendChild(li);
    }
}

export function deleteRecipe(recipeId, event) {
    event.stopPropagation();
    window.showConfirm('确定要删除配方 "<strong>' + recipeId + '</strong>" 吗？', function(result) {
        if (result) {
            delete datapackData.recipes[recipeId];
            const item = document.querySelector('[data-recipe="' + recipeId + '"]');
            if (item) item.remove();
            if (window.currentRecipe === recipeId) {
                window.currentRecipe = null;
                resetRecipeEditor();
            }
            showNotification('配方已删除！', 'success');
        }
    });
}

export function resetRecipeEditor() {
    const nameEl = document.getElementById('recipe-name');
    const typeEl = document.getElementById('recipe-type');
    const resultEl = document.getElementById('recipe-result');
    const countEl = document.getElementById('recipe-count');
    const groupEl = document.getElementById('recipe-group');
    const categoryEl = document.getElementById('recipe-category');
    const showNotificationEl = document.getElementById('recipe-show-notification');
    const unlockTypeEl = document.getElementById('recipe-unlock-type');
    const smeltingInputEl = document.getElementById('smelting-input');
    const smeltingXpEl = document.getElementById('smelting-xp');
    const smeltingTimeEl = document.getElementById('smelting-time');
    const stonecuttingInputEl = document.getElementById('stonecutting-input');
    const stonecuttingCountEl = document.getElementById('stonecutting-count');
    const smithingTemplateEl = document.getElementById('smithing-template');
    const smithingBaseEl = document.getElementById('smithing-base');
    const smithingAdditionEl = document.getElementById('smithing-addition');

    if (nameEl) nameEl.value = '';
    if (typeEl) typeEl.value = 'crafting_shaped';
    if (resultEl) resultEl.value = '';
    if (countEl) countEl.value = 1;
    if (groupEl) groupEl.value = '';
    if (categoryEl) categoryEl.value = 'misc';
    if (showNotificationEl) showNotificationEl.checked = true;
    if (unlockTypeEl) unlockTypeEl.value = 'craft';
    document.querySelectorAll('.grid-cell-input').forEach(cell => {
        cell.value = '';
        updateItemPreview(cell);
    });
    if (smeltingInputEl) smeltingInputEl.value = '';
    if (smeltingXpEl) smeltingXpEl.value = 0;
    if (smeltingTimeEl) smeltingTimeEl.value = 200;
    if (stonecuttingInputEl) stonecuttingInputEl.value = '';
    if (stonecuttingCountEl) stonecuttingCountEl.value = 1;
    if (smithingTemplateEl) smithingTemplateEl.value = '';
    if (smithingBaseEl) smithingBaseEl.value = '';
    if (smithingAdditionEl) smithingAdditionEl.value = '';
    updateRecipeEditorVisibility();
    window._recipeCustomEnchants = [];
    renderRecipeEnchantTags();
    loadResultComponents(null);
}

// ===== 输出物品自定义功能 =====

window.toggleResultComponents = function() {
    const body = document.getElementById('components-body');
    const icon = document.getElementById('components-toggle-icon');
    if (body && icon) {
        if (body.style.display === 'none') {
            body.style.display = 'block';
            icon.style.transform = 'rotate(90deg)';
        } else {
            body.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    }
};

function collectResultComponents() {
    const components = {};

    const customName = document.getElementById('result-custom-name')?.value?.trim();
    const nameColor = document.getElementById('result-name-color')?.value;
    const italic = document.getElementById('result-name-italic')?.checked;
    const bold = document.getElementById('result-name-bold')?.checked;
    const lore = document.getElementById('result-lore')?.value?.trim();
    const customData = document.getElementById('result-custom-data')?.value?.trim();
    const glint = document.getElementById('result-glint-override')?.checked;

    if (customName || nameColor || italic || bold) {
        const nameObj = { text: customName || '' };
        if (nameColor) nameObj.color = nameColor;
        if (italic) nameObj.italic = true;
        else nameObj.italic = false;
        if (bold) nameObj.bold = true;
        components.customName = JSON.stringify(nameObj);
    }

    if (lore) {
        const loreLines = lore.split('\n').filter(line => line.trim());
        if (loreLines.length > 0) {
            components.lore = loreLines.map(line => {
                const lineObj = { text: line.trim(), italic: false };
                return JSON.stringify(lineObj);
            });
        }
    }

    if (customData) {
        components.customData = customData;
    }

    if (glint) {
        components.glint = true;
    }

    if (window._recipeCustomEnchants && window._recipeCustomEnchants.length > 0) {
        components.enchantments = window._recipeCustomEnchants.map(e => ({
            id: e.id,
            level: e.level
        }));
    }

    return Object.keys(components).length > 0 ? components : {};
}

function loadResultComponents(components) {
    if (!components || Object.keys(components).length === 0) {
        // 重置所有字段
        const nameInput = document.getElementById('result-custom-name');
        if (nameInput) nameInput.value = '';
        const colorSelect = document.getElementById('result-name-color');
        if (colorSelect) colorSelect.value = '';
        const italicCb = document.getElementById('result-name-italic');
        if (italicCb) italicCb.checked = false;
        const boldCb = document.getElementById('result-name-bold');
        if (boldCb) boldCb.checked = false;
        const loreTextarea = document.getElementById('result-lore');
        if (loreTextarea) loreTextarea.value = '';
        const customDataInput = document.getElementById('result-custom-data');
        if (customDataInput) customDataInput.value = '';
        const glintCb = document.getElementById('result-glint-override');
        if (glintCb) glintCb.checked = false;
        window._recipeCustomEnchants = [];
        renderRecipeEnchantTags();
        return;
    }

    // 加载自定义名称
    if (components.customName) {
        try {
            const nameObj = JSON.parse(components.customName);
            const nameInput = document.getElementById('result-custom-name');
            if (nameInput) nameInput.value = nameObj.text || '';
            if (nameObj.color) {
                const colorSelect = document.getElementById('result-name-color');
                if (colorSelect) colorSelect.value = nameObj.color;
            }
            const italicCb = document.getElementById('result-name-italic');
            if (italicCb) italicCb.checked = nameObj.italic === true;
            const boldCb = document.getElementById('result-name-bold');
            if (boldCb) boldCb.checked = nameObj.bold === true;
        } catch (e) {
            console.warn('解析自定义名称失败:', e);
        }
    } else {
        const nameInput = document.getElementById('result-custom-name');
        if (nameInput) nameInput.value = '';
    }

    // 加载介绍
    if (components.lore && Array.isArray(components.lore)) {
        const loreTextarea = document.getElementById('result-lore');
        if (loreTextarea) {
            const lines = components.lore.map(line => {
                try {
                    const obj = JSON.parse(line);
                    return obj.text || '';
                } catch (e) {
                    return line;
                }
            });
            loreTextarea.value = lines.join('\n');
        }
    } else {
        const loreTextarea = document.getElementById('result-lore');
        if (loreTextarea) loreTextarea.value = '';
    }

    // 加载自定义数据
    const customDataInput = document.getElementById('result-custom-data');
    if (customDataInput) customDataInput.value = components.customData || '';

    // 加载附魔光效
    const glintCb = document.getElementById('result-glint-override');
    if (glintCb) glintCb.checked = components.glint === true;

    // 加载自定义附魔
    if (components.enchantments && Array.isArray(components.enchantments)) {
        window._recipeCustomEnchants = components.enchantments.map(e => ({
            id: e.id,
            level: e.level,
            maxLevel: (PRESET_ENCHANTMENTS.find(pe => pe.id === e.id) || {}).maxLevel || 1
        }));
    } else {
        window._recipeCustomEnchants = [];
    }
    renderRecipeEnchantTags();
}

function renderRecipeEnchantTags() {
    const container = document.getElementById('result-enchant-tags');
    if (!container) return;
    const enchants = window._recipeCustomEnchants || [];
    if (enchants.length === 0) {
        container.innerHTML = '<span class="field-hint">暂未选择附魔</span>';
        return;
    }
    container.innerHTML = enchants.map(e => {
        const enchInfo = PRESET_ENCHANTMENTS.find(pe => pe.id === e.id);
        const displayName = enchInfo ? enchInfo.name : e.id;
        return `<span class="custom-enchant-tag">${displayName} ${e.level}<span class="custom-enchant-remove" data-enchant-id="${e.id}">&times;</span></span>`;
    }).join('');

    container.querySelectorAll('.custom-enchant-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.enchantId;
            window._recipeCustomEnchants = (window._recipeCustomEnchants || []).filter(e => e.id !== id);
            renderRecipeEnchantTags();
        });
    });
}

window.openRecipeEnchantSelector = function() {
    const existing = document.getElementById('enchant-selector-modal');
    if (existing) existing.remove();

    const currentEnchants = window._recipeCustomEnchants || [];

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
                <p class="field-hint" style="color:#f59e0b;font-weight:600;">自定义附魔不受原版限制，可随意搭配，等级最高 255 级</p>
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
        window._recipeCustomEnchants = selectedEnchants;
        renderRecipeEnchantTags();
        modal.remove();
        showNotification(`已选择 ${selectedEnchants.length} 个附魔`, 'success');
    });

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

export function loadRecipeData(recipeId) {
    const recipe = datapackData.recipes[recipeId];
    if (recipe) {
        const nameEl = document.getElementById('recipe-name');
        const typeEl = document.getElementById('recipe-type');
        const resultEl = document.getElementById('recipe-result');
        const countEl = document.getElementById('recipe-count');
        const groupEl = document.getElementById('recipe-group');
        const categoryEl = document.getElementById('recipe-category');
        const showNotificationEl = document.getElementById('recipe-show-notification');
        const unlockTypeEl = document.getElementById('recipe-unlock-type');
        const smeltingInputEl = document.getElementById('smelting-input');
        const smeltingXpEl = document.getElementById('smelting-xp');
        const smeltingTimeEl = document.getElementById('smelting-time');
        const stonecuttingInputEl = document.getElementById('stonecutting-input');
        const stonecuttingCountEl = document.getElementById('stonecutting-count');
        const smithingTemplateEl = document.getElementById('smithing-template');
        const smithingBaseEl = document.getElementById('smithing-base');
        const smithingAdditionEl = document.getElementById('smithing-addition');

        if (nameEl) nameEl.value = recipe.name || '';
        if (typeEl) typeEl.value = recipe.type || 'crafting_shaped';
        if (resultEl) resultEl.value = recipe.result || '';
        if (countEl) countEl.value = recipe.count || 1;
        if (groupEl) groupEl.value = recipe.group || '';
        if (categoryEl) categoryEl.value = recipe.category || 'misc';
        if (showNotificationEl) showNotificationEl.checked = recipe.showNotification !== false;
        if (unlockTypeEl) unlockTypeEl.value = recipe.unlockType || 'craft';

        updateRecipeEditorVisibility();

        // 更新所有物品预览
        if (resultEl) updateItemPreview(resultEl);

        if (recipe.pattern) {
            const cells = document.querySelectorAll('.grid-cell-input');
            cells.forEach((cell, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                cell.value = recipe.pattern[row] ? (recipe.pattern[row][col] || '') : '';
            });
            cells.forEach(cell => updateItemPreview(cell));
        }

        if (smeltingInputEl) smeltingInputEl.value = recipe.input || '';
        if (smeltingXpEl) smeltingXpEl.value = recipe.xp || 0;
        if (smeltingTimeEl) smeltingTimeEl.value = recipe.cookingTime || 200;
        if (stonecuttingInputEl) stonecuttingInputEl.value = recipe.input || '';
        if (stonecuttingCountEl) stonecuttingCountEl.value = recipe.stonecuttingCount || 1;
        if (smithingTemplateEl) smithingTemplateEl.value = recipe.template || '';
        if (smithingBaseEl) smithingBaseEl.value = recipe.base || '';
        if (smithingAdditionEl) smithingAdditionEl.value = recipe.addition || '';

        if (smeltingInputEl) updateItemPreview(smeltingInputEl);
        if (stonecuttingInputEl) updateItemPreview(stonecuttingInputEl);
        if (smithingTemplateEl) updateItemPreview(smithingTemplateEl);
        if (smithingBaseEl) updateItemPreview(smithingBaseEl);
        if (smithingAdditionEl) updateItemPreview(smithingAdditionEl);

        // 加载输出物品自定义组件
        loadResultComponents(recipe.resultComponents);
    }
}

window.deleteRecipe = deleteRecipe;

// ===== 原版配方管理功能 =====

function loadVanillaRecipes() {
    Promise.all([
        fetch('data/pf_recipes.txt').then(r => r.text()),
        fetch('data/pf_recipes_zh.txt').then(r => r.text())
    ]).then(([enData, zhData]) => {
        const enLines = enData.split('\n').filter(line => line.trim());
        const zhLines = zhData.split('\n').filter(line => line.trim());
        const maxLen = Math.min(enLines.length, zhLines.length);

        vanillaRecipes = [];
        for (let i = 0; i < maxLen; i++) {
            const enParts = enLines[i].split(' -> ');
            const zhParts = zhLines[i].split(' -> ');
            if (enParts.length >= 1) {
                const recipeId = enParts[0].trim();
                const zhName = zhParts.length >= 1 ? zhParts[0].trim() : recipeId;
                vanillaRecipes.push({
                    id: recipeId,
                    name: zhName,
                    result: enParts.length >= 2 ? enParts[1].trim() : ''
                });
            }
        }
        console.log('[原版配方] 已加载 ' + vanillaRecipes.length + ' 个配方');
    }).catch(err => {
        console.warn('[原版配方] 加载失败:', err);
        vanillaRecipes = [];
    });
}

export function openVanillaRecipeModal() {
    const modal = document.getElementById('vanilla-recipe-modal');
    if (!modal) return;

    renderVanillaRecipeList();

    modal.classList.add('active');

    const onClickOutside = function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            modal.removeEventListener('click', onClickOutside);
        }
    };
    setTimeout(() => modal.addEventListener('click', onClickOutside), 100);
}

export function closeVanillaRecipeModal() {
    document.getElementById('vanilla-recipe-modal')?.classList.remove('active');
}

export function renderVanillaRecipeList() {
    const list = document.getElementById('vanilla-recipe-list');
    const searchInput = document.getElementById('vanilla-recipe-search');
    if (!list) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const excluded = datapackData.excludedVanillaRecipes || [];

    list.innerHTML = '';

    const filtered = vanillaRecipes.filter(r => {
        if (!searchTerm) return true;
        return r.id.toLowerCase().includes(searchTerm) ||
               r.name.toLowerCase().includes(searchTerm);
    });

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-hint">没有找到匹配的配方</div>';
        updateVanillaRecipeCount();
        return;
    }

    filtered.forEach(recipe => {
        const isChecked = excluded.includes(recipe.id);
        const item = document.createElement('label');
        item.className = 'vanilla-recipe-item' + (isChecked ? ' checked' : '');
        item.innerHTML = `
            <input type="checkbox" class="vanilla-recipe-checkbox" data-recipe-id="${recipe.id}" ${isChecked ? 'checked' : ''}>
            <span class="vanilla-recipe-name">${recipe.name}</span>
            <span class="vanilla-recipe-id">${recipe.id}</span>
        `;
        item.addEventListener('click', function(e) {
            if (e.target.tagName === 'INPUT') return;
            const cb = this.querySelector('.vanilla-recipe-checkbox');
            cb.checked = !cb.checked;
            this.classList.toggle('checked', cb.checked);
            updateVanillaRecipeCount();
        });
        const cb = item.querySelector('.vanilla-recipe-checkbox');
        cb.addEventListener('change', function() {
            item.classList.toggle('checked', this.checked);
            updateVanillaRecipeCount();
        });
        list.appendChild(item);
    });

    updateVanillaRecipeCount();
}

export function filterVanillaRecipes() {
    renderVanillaRecipeList();
}

export function toggleAllVanillaRecipes(select) {
    const checkboxes = document.querySelectorAll('.vanilla-recipe-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = select;
        cb.closest('.vanilla-recipe-item').classList.toggle('checked', select);
    });
    updateVanillaRecipeCount();
}

function updateVanillaRecipeCount() {
    const countEl = document.getElementById('vanilla-recipe-count');
    if (!countEl) return;
    const checked = document.querySelectorAll('.vanilla-recipe-checkbox:checked').length;
    countEl.textContent = checked;
}

function saveVanillaRecipeSelection() {
    const checkboxes = document.querySelectorAll('.vanilla-recipe-checkbox:checked');
    datapackData.excludedVanillaRecipes = Array.from(checkboxes).map(cb => cb.getAttribute('data-recipe-id'));
    closeVanillaRecipeModal();
    showNotification('原版配方设置已保存！已选择 ' + datapackData.excludedVanillaRecipes.length + ' 个配方将被移除', 'success');
}

window.closeVanillaRecipeModal = closeVanillaRecipeModal;
window.filterVanillaRecipes = filterVanillaRecipes;
window.toggleAllVanillaRecipes = toggleAllVanillaRecipes;

import { datapackData } from './data/data-core.js';
import { showNotification } from './utils.js';
import { initFunctionEditor } from './editors/function-editor.js';
import { initAdvancementEditor, refreshAdvancementList, refreshParentSelect } from './editors/advancement-editor.js';
import { initLootTableEditor } from './editors/loot-table-editor.js';
import { initRecipeEditor } from './editors/recipe-editor.js';
import { initExportSection, updateExportPreview } from './export.js';
import { initModal, openCommandModal, showPrompt, showConfirm, closeModal } from './modal.js';
import { initItemSelector } from './item-selector.js';

window.datapackData = datapackData;
window.currentFunction = null;
window.currentAdvancement = null;
window.currentLootTable = null;
window.currentRecipe = null;
window.openCommandModal = openCommandModal;
window.showPrompt = showPrompt;
window.showConfirm = showConfirm;
window.closeModal = closeModal;

console.log('[DEBUG] main.js loaded');



function init() {
    console.log('[DEBUG] init() called');
    try {
        initNavigation();
        console.log('[DEBUG] initNavigation completed');
        initHomeSection();
        console.log('[DEBUG] initHomeSection completed');
        initFunctionEditor();
        console.log('[DEBUG] initFunctionEditor completed');
        initAdvancementEditor();
        console.log('[DEBUG] initAdvancementEditor completed');
        initLootTableEditor();
        console.log('[DEBUG] initLootTableEditor completed');
        initRecipeEditor();
        console.log('[DEBUG] initRecipeEditor completed');
        initExportSection();
        console.log('[DEBUG] initExportSection completed');
        initModal();
        console.log('[DEBUG] initModal completed');
        initItemSelector();
        console.log('[DEBUG] initItemSelector completed');
        console.log('[DEBUG] init() completed successfully');
    } catch (e) {
        console.error('[DEBUG] Error during init:', e);
    }
}



function initNavigation() {
    console.log('[DEBUG] initNavigation() called');
    const navItems = document.querySelectorAll('.nav-item');
    console.log('[DEBUG] Found nav-items:', navItems.length);

    navItems.forEach(item => {
        item.addEventListener('click', async function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');

            if (sectionId === 'export') {
                try {
                    await updateExportPreview();
                } catch (e) {
                    console.error('[导出预览生成失败]', e);
                }
            }
        });
    });
}

function initHomeSection() {
    console.log('[DEBUG] initHomeSection() called');
    const createBtn = document.getElementById('create-new-pack');
    console.log('[DEBUG] createBtn found:', !!createBtn);
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            datapackData.name = document.getElementById('pack-name').value || '我的数据包';
            datapackData.description = document.getElementById('pack-description').value || '一个自定义数据包';
            datapackData.namespace = document.getElementById('namespace').value || 'my_datapack';

            showNotification('数据包创建成功！', 'success');
            document.querySelector('[data-section="functions"]').click();
        });
    }

    const packImageInput = document.getElementById('pack-image-input');
    const packImageUploadArea = document.getElementById('pack-image-upload-area');
    const packImagePlaceholder = document.getElementById('pack-image-placeholder');
    const packImagePreview = document.getElementById('pack-image-preview');
    const packImageImg = document.getElementById('pack-image-img');
    const packImageRemove = document.getElementById('pack-image-remove');

    if (packImageUploadArea) {
        packImageUploadArea.addEventListener('click', function(e) {
            if (e.target === packImageRemove || packImageRemove.contains(e.target)) return;
            packImageInput.click();
        });
    }

    if (packImageInput) {
        packImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (file.type !== 'image/png') {
                showNotification('仅支持 PNG 格式图片！', 'error');
                packImageInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(event) {
                const dataUrl = event.target.result;
                datapackData.packImage = dataUrl;
                packImageImg.src = dataUrl;
                packImagePlaceholder.style.display = 'none';
                packImagePreview.style.display = 'flex';
                showNotification('数据包图标已上传！', 'success');
            };
            reader.readAsDataURL(file);
        });
    }

    if (packImageRemove) {
        packImageRemove.addEventListener('click', function(e) {
            e.stopPropagation();
            datapackData.packImage = null;
            packImageInput.value = '';
            packImageImg.src = '';
            packImagePreview.style.display = 'none';
            packImagePlaceholder.style.display = 'flex';
        });
    }

    if (datapackData.packImage) {
        packImageImg.src = datapackData.packImage;
        packImagePlaceholder.style.display = 'none';
        packImagePreview.style.display = 'flex';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
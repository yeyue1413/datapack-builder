import { getCommandTitle, generateCommandFromModal } from './utils.js';
import { showNotification } from './utils.js';

export function initModal() {
    const modal = document.getElementById('command-modal');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('modal-cancel');
    const addBtn = document.getElementById('modal-add');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    if (addBtn) {
        addBtn.addEventListener('click', function() {
            const command = generateCommandFromModal();
            if (command) {
                const currentContent = document.getElementById('function-content').value;
                document.getElementById('function-content').value = currentContent + (currentContent ? '\n' : '') + command;
                closeModal();
                showNotification('命令已添加！', 'success');
            }
        });
    }
}

export function openCommandModal(cmdType) {
    const modal = document.getElementById('command-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (modalTitle) modalTitle.textContent = getCommandTitle(cmdType);
    if (modalBody) modalBody.innerHTML = getCommandForm(cmdType);

    if (modal) modal.classList.add('active');
}

export function closeModal() {
    document.getElementById('command-modal')?.classList.remove('active');
    document.getElementById('prompt-modal')?.classList.remove('active');
    document.getElementById('confirm-modal')?.classList.remove('active');
}

export function showPrompt(title, placeholder, defaultValue = '', callback) {
    const modal = document.getElementById('prompt-modal');
    if (!modal) return;

    const titleEl = document.getElementById('prompt-modal-title');
    const inputEl = document.getElementById('prompt-modal-input');
    const hintEl = document.getElementById('prompt-modal-hint');

    if (titleEl) titleEl.textContent = title;
    if (inputEl) {
        inputEl.placeholder = placeholder || '请输入...';
        inputEl.value = defaultValue;
        inputEl.focus();
        inputEl.select();
    }
    if (hintEl) {
        hintEl.textContent = placeholder ? '提示：' + placeholder : '';
    }

    window._promptCallback = callback;

    const confirmBtn = document.getElementById('prompt-modal-confirm');
    const cancelBtn = document.getElementById('prompt-modal-cancel');

    const onConfirm = () => {
        const value = inputEl ? inputEl.value : '';
        cleanup();
        if (window._promptCallback) {
            window._promptCallback(value);
        }
        modal.classList.remove('active');
    };

    const onCancel = () => {
        cleanup();
        modal.classList.remove('active');
    };

    const cleanup = () => {
        if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
        if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
        const newConfirm = document.getElementById('prompt-modal-confirm');
        const newCancel = document.getElementById('prompt-modal-cancel');
        if (newConfirm) newConfirm.removeEventListener('click', onConfirm);
        if (newCancel) newCancel.removeEventListener('click', onCancel);
    };

    if (confirmBtn) {
        confirmBtn.addEventListener('click', onConfirm);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', onCancel);
    }

    if (inputEl) {
        inputEl.addEventListener('keydown', function handler(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
            }
            if (e.key === 'Escape') {
                onCancel();
            }
        });
    }

    modal.classList.add('active');
}

export function showConfirm(message, callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    const messageEl = document.getElementById('confirm-modal-message');
    if (messageEl) messageEl.innerHTML = message;

    const confirmBtn = document.getElementById('confirm-modal-confirm');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const closeBtn = modal.querySelector('.close-modal');

    if (confirmBtn) {
        if (message.includes('删除')) {
            confirmBtn.textContent = '确认删除';
            confirmBtn.className = 'btn-delete';
        } else if (message.includes('清除')) {
            confirmBtn.textContent = '确认清除';
            confirmBtn.className = 'btn-delete';
        } else {
            confirmBtn.textContent = '确认';
            confirmBtn.className = 'btn-primary';
        }
    }

    window._confirmCallback = callback;

    const onConfirm = () => {
        cleanup();
        if (window._confirmCallback) {
            window._confirmCallback(true);
        }
        modal.classList.remove('active');
    };

    const onCancel = () => {
        cleanup();
        if (window._confirmCallback) {
            window._confirmCallback(false);
        }
        modal.classList.remove('active');
    };

    const cleanup = () => {
        if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
        if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
        if (closeBtn) closeBtn.removeEventListener('click', onCancel);
        const newConfirm = document.getElementById('confirm-modal-confirm');
        const newCancel = document.getElementById('confirm-modal-cancel');
        if (newConfirm) newConfirm.removeEventListener('click', onConfirm);
        if (newCancel) newCancel.removeEventListener('click', onCancel);
    };

    if (confirmBtn) confirmBtn.addEventListener('click', onConfirm);
    if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
    if (closeBtn) closeBtn.addEventListener('click', onCancel);

    modal.classList.add('active');
}

export function closePromptModal() {
    const modal = document.getElementById('prompt-modal');
    if (modal) modal.classList.remove('active');
}

export function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.remove('active');
}

export function getCommandForm(cmdType) {
    const forms = {
        tellraw: `
            <div class="form-group">
                <label>目标玩家</label>
                <input type="text" id="cmd-target" placeholder="@a" value="@a">
            </div>
            <div class="form-group">
                <label>消息内容</label>
                <textarea id="cmd-message" placeholder="输入消息内容"></textarea>
            </div>
            <div class="form-group">
                <label>颜色</label>
                <select id="cmd-color">
                    <option value="">默认</option>
                    <option value="red">红色</option>
                    <option value="green">绿色</option>
                    <option value="blue">蓝色</option>
                    <option value="yellow">黄色</option>
                    <option value="gold">金色</option>
                    <option value="aqua">青色</option>
                </select>
            </div>
        `,
        give: `
            <div class="form-group">
                <label>目标玩家</label>
                <input type="text" id="cmd-target" placeholder="@p" value="@p">
            </div>
            <div class="form-group">
                <label>物品ID</label>
                <input type="text" id="cmd-item" placeholder="minecraft:diamond">
            </div>
            <div class="form-group">
                <label>数量</label>
                <input type="number" id="cmd-count" value="1" min="1">
            </div>
        `,
        summon: `
            <div class="form-group">
                <label>实体类型</label>
                <input type="text" id="cmd-entity" placeholder="minecraft:zombie">
            </div>
            <div class="form-group">
                <label>X坐标</label>
                <input type="text" id="cmd-x" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>Y坐标</label>
                <input type="text" id="cmd-y" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>Z坐标</label>
                <input type="text" id="cmd-z" placeholder="~" value="~">
            </div>
        `,
        tp: `
            <div class="form-group">
                <label>目标</label>
                <input type="text" id="cmd-target" placeholder="@p" value="@p">
            </div>
            <div class="form-group">
                <label>X坐标</label>
                <input type="text" id="cmd-x" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>Y坐标</label>
                <input type="text" id="cmd-y" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>Z坐标</label>
                <input type="text" id="cmd-z" placeholder="~" value="~">
            </div>
        `,
        effect: `
            <div class="form-group">
                <label>目标</label>
                <input type="text" id="cmd-target" placeholder="@p" value="@p">
            </div>
            <div class="form-group">
                <label>效果类型</label>
                <input type="text" id="cmd-effect-type" placeholder="minecraft:speed">
            </div>
            <div class="form-group">
                <label>持续时间（秒）</label>
                <input type="number" id="cmd-duration" value="10" min="1">
            </div>
            <div class="form-group">
                <label>等级</label>
                <input type="number" id="cmd-amplifier" value="0" min="0">
            </div>
        `,
        scoreboard: `
            <div class="form-group">
                <label>操作类型</label>
                <select id="cmd-scoreboard-action">
                    <option value="objectives add">添加计分板</option>
                    <option value="players set">设置分数</option>
                    <option value="players add">增加分数</option>
                    <option value="players remove">减少分数</option>
                </select>
            </div>
            <div class="form-group">
                <label>计分板名称</label>
                <input type="text" id="cmd-objective" placeholder="kills">
            </div>
            <div class="form-group">
                <label>参数</label>
                <input type="text" id="cmd-params" placeholder="dummy">
            </div>
        `,
        execute: `
            <div class="form-group">
                <label>执行条件</label>
                <input type="text" id="cmd-condition" placeholder="as @a at @s">
            </div>
            <div class="form-group">
                <label>要执行的命令</label>
                <input type="text" id="cmd-run" placeholder="say Hello">
            </div>
        `,
        schedule: `
            <div class="form-group">
                <label>函数名称</label>
                <input type="text" id="cmd-function" placeholder="${window.datapackData?.namespace || 'my_datapack'}:my_function">
            </div>
            <div class="form-group">
                <label>延迟时间</label>
                <input type="text" id="cmd-time" placeholder="20t (1秒)">
            </div>
        `,
        setblock: `
            <div class="form-group">
                <label>X坐标</label>
                <input type="text" id="cmd-x" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>Y坐标</label>
                <input type="text" id="cmd-y" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>Z坐标</label>
                <input type="text" id="cmd-z" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>方块ID</label>
                <input type="text" id="cmd-block" placeholder="minecraft:diamond_block">
            </div>
        `,
        fill: `
            <div class="form-group">
                <label>起点X</label>
                <input type="text" id="cmd-x1" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>起点Y</label>
                <input type="text" id="cmd-y1" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>起点Z</label>
                <input type="text" id="cmd-z1" placeholder="~" value="~">
            </div>
            <div class="form-group">
                <label>终点X</label>
                <input type="text" id="cmd-x2" placeholder="~10" value="~10">
            </div>
            <div class="form-group">
                <label>终点Y</label>
                <input type="text" id="cmd-y2" placeholder="~10" value="~10">
            </div>
            <div class="form-group">
                <label>终点Z</label>
                <input type="text" id="cmd-z2" placeholder="~10" value="~10">
            </div>
            <div class="form-group">
                <label>方块ID</label>
                <input type="text" id="cmd-block" placeholder="minecraft:stone">
            </div>
        `
    };
    return forms[cmdType] || '<p>未知命令类型</p>';
}

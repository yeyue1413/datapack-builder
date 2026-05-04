import { datapackData } from '../data/data-core.js';
import { PRESET_BIOMES, PRESET_STRUCTURES } from '../data/data-environment.js';
import { showNotification, updateItemPreview, updateDataPreview } from '../utils.js';
import { vanillaRecipes } from './recipe-editor.js';

const VANILLA_ADVANCEMENTS = [
    // Minecraft（故事）
    { id: 'minecraft:story/root', name: 'Minecraft', category: 'Minecraft' },
    { id: 'minecraft:story/mine_stone', name: '石器时代', category: 'Minecraft' },
    { id: 'minecraft:story/upgrade_tools', name: '获得升级', category: 'Minecraft' },
    { id: 'minecraft:story/smelt_iron', name: '来硬的', category: 'Minecraft' },
    { id: 'minecraft:story/iron_tools', name: '这不是铁镐么', category: 'Minecraft' },
    { id: 'minecraft:story/lava_bucket', name: '热腾腾的', category: 'Minecraft' },
    { id: 'minecraft:story/obtain_armor', name: '整装上阵', category: 'Minecraft' },
    { id: 'minecraft:story/mine_diamond', name: '钻石！', category: 'Minecraft' },
    { id: 'minecraft:story/form_obsidian', name: '冰桶挑战', category: 'Minecraft' },
    { id: 'minecraft:story/enter_the_nether', name: '勇往直下', category: 'Minecraft' },
    { id: 'minecraft:story/cure_zombie_villager', name: '僵尸科医生', category: 'Minecraft' },
    { id: 'minecraft:story/follow_ender_eye', name: '隔墙有眼', category: 'Minecraft' },
    { id: 'minecraft:story/enter_the_end', name: '结束了？', category: 'Minecraft' },
    { id: 'minecraft:story/enchant_item', name: '附魔师', category: 'Minecraft' },
    { id: 'minecraft:story/shiny_gear', name: '钻石护体', category: 'Minecraft' },
    { id: 'minecraft:story/deflect_arrow', name: '不吃这套，谢谢', category: 'Minecraft' },

    // 下界
    { id: 'minecraft:nether/root', name: '下界', category: '下界' },
    { id: 'minecraft:nether/distract_piglin', name: '金光闪闪', category: '下界' },
    { id: 'minecraft:nether/fast_travel', name: '曲速泡', category: '下界' },
    { id: 'minecraft:nether/find_bastion', name: '光辉岁月', category: '下界' },
    { id: 'minecraft:nether/find_fortress', name: '阴森的要塞', category: '下界' },
    { id: 'minecraft:nether/obtain_ancient_debris', name: '深藏不露', category: '下界' },
    { id: 'minecraft:nether/obtain_crying_obsidian', name: '谁在切洋葱？', category: '下界' },
    { id: 'minecraft:nether/return_to_sender', name: '见鬼去吧', category: '下界' },
    { id: 'minecraft:nether/ride_strider', name: '画船添足', category: '下界' },
    { id: 'minecraft:nether/loot_bastion', name: '战猪', category: '下界' },
    { id: 'minecraft:nether/get_wither_skull', name: '惊悚恐怖骷髅头', category: '下界' },
    { id: 'minecraft:nether/obtain_blaze_rod', name: '与火共舞', category: '下界' },
    { id: 'minecraft:nether/netherite_armor', name: '残骸裹身', category: '下界' },
    { id: 'minecraft:nether/charge_respawn_anchor', name: '锚没有九条命', category: '下界' },
    { id: 'minecraft:nether/uneasy_alliance', name: '脆弱的同盟', category: '下界' },
    { id: 'minecraft:nether/explore_nether', name: '热门景点', category: '下界' },
    { id: 'minecraft:nether/ride_strider_in_overworld_lava', name: '温暖如家', category: '下界' },
    { id: 'minecraft:nether/summon_wither', name: '凋零山庄', category: '下界' },
    { id: 'minecraft:nether/brew_potion', name: '本地酿造厂', category: '下界' },
    { id: 'minecraft:nether/create_beacon', name: '带信标回家', category: '下界' },
    { id: 'minecraft:nether/all_potions', name: '狂乱的鸡尾酒', category: '下界' },
    { id: 'minecraft:nether/create_full_beacon', name: '信标工程师', category: '下界' },
    { id: 'minecraft:nether/all_effects', name: '为什么会变成这样呢？', category: '下界' },
    { id: 'minecraft:nether/use_lodestone', name: '天涯共此石', category: '下界' },

    // 末地
    { id: 'minecraft:end/root', name: '末地', category: '末地' },
    { id: 'minecraft:end/kill_dragon', name: '解放末地', category: '末地' },
    { id: 'minecraft:end/dragon_breath', name: '你需要来点薄荷糖', category: '末地' },
    { id: 'minecraft:end/dragon_egg', name: '下一世代', category: '末地' },
    { id: 'minecraft:end/enter_end_gateway', name: '远程折跃', category: '末地' },
    { id: 'minecraft:end/respawn_dragon', name: '结束了…再一次…', category: '末地' },
    { id: 'minecraft:end/find_end_city', name: '在游戏尽头的城市', category: '末地' },
    { id: 'minecraft:end/elytra', name: '天空即为极限', category: '末地' },
    { id: 'minecraft:end/levitate', name: '这上面的风景不错', category: '末地' },

    // 冒险
    { id: 'minecraft:adventure/root', name: '冒险', category: '冒险' },
    { id: 'minecraft:adventure/kill_a_mob', name: '怪物猎人', category: '冒险' },
    { id: 'minecraft:adventure/shoot_arrow', name: '瞄准目标', category: '冒险' },
    { id: 'minecraft:adventure/kill_all_mobs', name: '资深怪物猎人', category: '冒险' },
    { id: 'minecraft:adventure/totem_of_undying', name: '超越生死', category: '冒险' },
    { id: 'minecraft:adventure/iron_golem', name: '招募援兵', category: '冒险' },
    { id: 'minecraft:adventure/ol_betsy', name: '扣下悬刀', category: '冒险' },
    { id: 'minecraft:adventure/throw_trident', name: '抖包袱', category: '冒险' },
    { id: 'minecraft:adventure/very_very_frightening', name: '魔女审判', category: '冒险' },
    { id: 'minecraft:adventure/sniper_duel', name: '狙击手的对决', category: '冒险' },
    { id: 'minecraft:adventure/bullseye', name: '正中靶心', category: '冒险' },
    { id: 'minecraft:adventure/voluntary_exile', name: '自我放逐', category: '冒险' },
    { id: 'minecraft:adventure/hero_of_the_village', name: '村庄英雄', category: '冒险' },
    { id: 'minecraft:adventure/arbalistic', name: '劲弩手', category: '冒险' },
    { id: 'minecraft:adventure/two_birds_one_arrow', name: '一箭双雕', category: '冒险' },
    { id: 'minecraft:adventure/whos_the_pillager_now', name: '现在谁才是掠夺者？', category: '冒险' },
    { id: 'minecraft:adventure/salvage_sherd', name: '探古寻源', category: '冒险' },
    { id: 'minecraft:adventure/craft_decorated_pot_using_only_sherds', name: '精修细补', category: '冒险' },
    { id: 'minecraft:adventure/adventuring_time', name: '探索的时光', category: '冒险' },
    { id: 'minecraft:adventure/play_jukebox_in_meadows', name: '音乐之声', category: '冒险' },
    { id: 'minecraft:adventure/walk_on_powder_snow_with_leather_boots', name: '轻功雪上飘', category: '冒险' },
    { id: 'minecraft:adventure/spyglass_at_parrot', name: '那是鸟吗？', category: '冒险' },
    { id: 'minecraft:adventure/spyglass_at_ghast', name: '那是气球吗？', category: '冒险' },
    { id: 'minecraft:adventure/spyglass_at_dragon', name: '那是飞机吗？', category: '冒险' },
    { id: 'minecraft:adventure/trade', name: '成交！', category: '冒险' },
    { id: 'minecraft:adventure/trade_at_world_height', name: '星际商人', category: '冒险' },
    { id: 'minecraft:adventure/sleep_in_bed', name: '甜蜜的梦', category: '冒险' },
    { id: 'minecraft:adventure/trim_with_any_armor_pattern', name: '旧貌锻新颜', category: '冒险' },
    { id: 'minecraft:adventure/trim_with_all_exclusive_armor_patterns', name: '匠心独具', category: '冒险' },
    { id: 'minecraft:adventure/lightning_rod_with_villager_no_fire', name: '电涌保护器', category: '冒险' },
    { id: 'minecraft:adventure/fall_from_world_height', name: '上天入地', category: '冒险' },
    { id: 'minecraft:adventure/honey_block_slide', name: '胶着状态', category: '冒险' },
    { id: 'minecraft:adventure/avoid_vibration', name: '潜行100级', category: '冒险' },
    { id: 'minecraft:adventure/kill_mob_near_sculk_catalyst', name: '它蔓延了', category: '冒险' },
    { id: 'minecraft:adventure/brush_armadillo', name: '这不是鳞甲么？', category: '冒险' },
    { id: 'minecraft:adventure/read_power_of_chiseled_bookshelf', name: '知识就是力量', category: '冒险' },
    { id: 'minecraft:adventure/crafters_crafting_crafters', name: '合成器合成合成器', category: '冒险' },
    { id: 'minecraft:adventure/minecraft_trials_edition', name: 'Minecraft：试炼版', category: '冒险' },
    { id: 'minecraft:adventure/blowback', name: '逆风翻盘', category: '冒险' },
    { id: 'minecraft:adventure/lighten_up', name: '铜光焕发', category: '冒险' },
    { id: 'minecraft:adventure/overoverkill', name: '天赐良击', category: '冒险' },
    { id: 'minecraft:adventure/under_lock_and_key', name: '珍藏密敛', category: '冒险' },
    { id: 'minecraft:adventure/who_needs_rockets', name: '还要啥火箭啊？', category: '冒险' },
    { id: 'minecraft:adventure/revaulting', name: '宝经磨炼', category: '冒险' },

    // 农牧业
    { id: 'minecraft:husbandry/root', name: '农牧业', category: '农牧业' },
    { id: 'minecraft:husbandry/breed_an_animal', name: '我从哪儿来？', category: '农牧业' },
    { id: 'minecraft:husbandry/ride_a_boat_with_a_goat', name: '羊帆起航！', category: '农牧业' },
    { id: 'minecraft:husbandry/tame_an_animal', name: '永恒的伙伴', category: '农牧业' },
    { id: 'minecraft:husbandry/fishy_business', name: '腥味十足的生意', category: '农牧业' },
    { id: 'minecraft:husbandry/safely_harvest_honey', name: '与蜂共舞', category: '农牧业' },
    { id: 'minecraft:husbandry/silk_touch_nest', name: '举巢搬迁', category: '农牧业' },
    { id: 'minecraft:husbandry/plant_seed', name: '开荒垦地', category: '农牧业' },
    { id: 'minecraft:husbandry/balanced_diet', name: '均衡饮食', category: '农牧业' },
    { id: 'minecraft:husbandry/obtain_netherite_hoe', name: '终极奉献', category: '农牧业' },
    { id: 'minecraft:husbandry/wax_on', name: '涂蜡', category: '农牧业' },
    { id: 'minecraft:husbandry/wax_off', name: '脱蜡', category: '农牧业' },
    { id: 'minecraft:husbandry/axolotl_in_a_bucket', name: '最萌捕食者', category: '农牧业' },
    { id: 'minecraft:husbandry/kill_axolotl_target', name: '友谊的治愈力！', category: '农牧业' },
    { id: 'minecraft:husbandry/leash_all_frog_variants', name: '呱呱队出动', category: '农牧业' },
    { id: 'minecraft:husbandry/froglights', name: '相映生辉！', category: '农牧业' },
    { id: 'minecraft:husbandry/tadpole_in_a_bucket', name: '蚪到桶里来', category: '农牧业' },
    { id: 'minecraft:husbandry/allay_deliver_item_to_player', name: '找到一个好朋友', category: '农牧业' },
    { id: 'minecraft:husbandry/allay_deliver_cake_to_note_block', name: '生日快乐歌', category: '农牧业' },
    { id: 'minecraft:husbandry/bred_all_animals', name: '成双成对', category: '农牧业' },
    { id: 'minecraft:husbandry/complete_catalogue', name: '百猫全书', category: '农牧业' },
    { id: 'minecraft:husbandry/tactical_fishing', name: '战术性钓鱼', category: '农牧业' },
    { id: 'minecraft:husbandry/make_a_sign_glow', name: '眼前一亮！', category: '农牧业' },
    { id: 'minecraft:husbandry/obtain_sniffer_egg', name: '怪味蛋', category: '农牧业' },
    { id: 'minecraft:husbandry/feed_snifflet', name: '小小嗅探兽', category: '农牧业' },
    { id: 'minecraft:husbandry/plant_any_sniffer_seed', name: '播种往事', category: '农牧业' },
    { id: 'minecraft:husbandry/repair_wolf_armor', name: '完好如初', category: '农牧业' },
    { id: 'minecraft:husbandry/remove_wolf_armor', name: '华丽一剪', category: '农牧业' },
    { id: 'minecraft:husbandry/whole_pack', name: '群狼聚首', category: '农牧业' }
];

const RECIPE_TRIGGERS = ['recipe_unlocked', 'recipe_crafted'];

const DEFAULT_ADV_CATEGORIES = ['Minecraft', '下界', '末地', '冒险', '农牧业'];

let currentAdvancementTab = '';

export function renderAdvancementTabs() {
    const container = document.getElementById('adv-tabs-container');
    if (!container) return;
    container.innerHTML = '';

    const allTabs = DEFAULT_ADV_CATEGORIES.map(cat => ({ category: cat, label: cat }));

    const customTabs = datapackData.customAdvancementTabs || [];
    customTabs.forEach(tab => {
        allTabs.push({ category: tab, label: tab, isCustom: true });
    });

    allTabs.push({ category: '', label: '自定义' });

    allTabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.className = 'adv-tab' + (tab.category === currentAdvancementTab ? ' active' : '') + (tab.isCustom ? ' custom-tab' : '');
        btn.setAttribute('data-category', tab.category);
        btn.textContent = tab.label;
        btn.addEventListener('click', function() {
            switchAdvancementTab(tab.category);
        });
        container.appendChild(btn);

        if (tab.isCustom) {
            const delBtn = document.createElement('button');
            delBtn.className = 'adv-tab delete-tab-btn';
            delBtn.textContent = '✕';
            delBtn.title = '删除"' + tab.label + '"选项卡（不会删除其中的进度）';
            delBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteCustomTab(tab.category);
            });
            container.appendChild(delBtn);
        }
    });
}

function deleteCustomTab(category) {
    window.showConfirm('确定要删除分类选项卡 "<strong>' + category + '</strong>" 吗？<br><small>注意：其中的进度不会删除，但会变为未分类状态</small>', function(result) {
        if (result) {
            const idx = (datapackData.customAdvancementTabs || []).indexOf(category);
            if (idx !== -1) {
                datapackData.customAdvancementTabs.splice(idx, 1);
            }
            Object.keys(datapackData.advancements).forEach(advId => {
                const adv = datapackData.advancements[advId];
                if (adv.category === category) {
                    adv.category = '';
                }
            });
            if (currentAdvancementTab === category) {
                switchAdvancementTab('');
            } else {
                renderAdvancementTabs();
                refreshAdvancementList();
                refreshParentSelect();
            }
            showNotification('选项卡 "' + category + '" 已删除', 'success');
        }
    });
}

window.switchAdvancementTab = function(category) {
    currentAdvancementTab = category;
    renderAdvancementTabs();
    window.currentAdvancement = null;
    clearAdvancementForm();
    refreshAdvancementList();
    refreshParentSelect();
};

export function initAdvancementEditor() {
    populateBiomeSelect();
    populateStructureSelect();

    renderAdvancementTabs();

    const addBtn = document.getElementById('add-advancement');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            window.showPrompt('添加进度', '输入显示名称，将自动生成ID', '', function(advName) {
                if (advName && advName.trim()) {
                    const advId = advName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    if (!datapackData.advancements[advId]) {
                        datapackData.advancements[advId] = createDefaultAdvancement(advName);
                        refreshAdvancementList();
                        selectAdvancement(advId);
                        showNotification('进度已添加！', 'success');
                    } else {
                        showNotification('进度名称已存在！', 'error');
                    }
                }
            });
        });
    }

    const addTabBtn = document.getElementById('add-adv-tab');
    if (addTabBtn) {
        addTabBtn.addEventListener('click', function() {
            window.showPrompt('新增分类选项卡', '输入选项卡名称（例如：传闻、挑战）', '', function(tabName) {
                if (tabName && tabName.trim()) {
                    const name = tabName.trim();
                    if (DEFAULT_ADV_CATEGORIES.includes(name)) {
                        showNotification('"' + name + '" 是默认分类，无需添加', 'error');
                        return;
                    }
                    if ((datapackData.customAdvancementTabs || []).includes(name)) {
                        showNotification('分类 "' + name + '" 已存在', 'error');
                        return;
                    }
                    if (!datapackData.customAdvancementTabs) {
                        datapackData.customAdvancementTabs = [];
                    }
                    datapackData.customAdvancementTabs.push(name);
                    switchAdvancementTab(name);
                    showNotification('选项卡 "' + name + '" 已添加', 'success');
                }
            });
        });
    }

    const saveBtn = document.getElementById('save-advancement');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const newId = document.getElementById('adv-id')?.value.trim();
            if (!newId) {
                showNotification('请输入进度ID！', 'error');
                return;
            }
            if (window.currentAdvancement) {
                if (newId !== window.currentAdvancement) {
                    if (datapackData.advancements[newId]) {
                        showNotification('进度ID "' + newId + '" 已存在，请使用其他ID！', 'error');
                        return;
                    }
                    const oldId = window.currentAdvancement;
                    saveAdvancementData(newId);
                    delete datapackData.advancements[oldId];
                    window.currentAdvancement = newId;
                    refreshAdvancementList();
                    selectAdvancement(newId);
                } else {
                    saveAdvancementData(window.currentAdvancement);
                }
                refreshParentSelect();
                showNotification('进度已保存！', 'success');
            } else {
                if (datapackData.advancements[newId]) {
                    showNotification('进度ID "' + newId + '" 已存在，请使用其他ID！', 'error');
                    return;
                }
                window.currentAdvancement = newId;
                saveAdvancementData(newId);
                refreshAdvancementList();
                selectAdvancement(newId);
                refreshParentSelect();
                showNotification('进度已创建并保存！', 'success');
            }
        });
    }

    const triggerSelect = document.getElementById('adv-trigger');
    if (triggerSelect) {
        triggerSelect.addEventListener('change', function() {
            updateConditionVisibility(this.value);
        });
    }

    const usePosCheckbox = document.getElementById('adv-location-use-position');
    if (usePosCheckbox) {
        usePosCheckbox.addEventListener('change', function() {
            const group = document.getElementById('adv-location-position-group');
            if (group) {
                group.style.display = this.checked ? 'block' : 'none';
            }
        });
    }

    const parentSelect = document.getElementById('adv-parent');
    // 配方选择按钮绑定
    const recipeBtn = document.getElementById('adv-select-recipe-btn');
    if (recipeBtn) {
        recipeBtn.addEventListener('click', function() {
            openAdvancementRecipeSelector();
        });
    }

    // 配方标签删除（事件委托）
    document.getElementById('advancements')?.addEventListener('click', function(e) {
        if (e.target.classList.contains('recipe-tag-remove')) {
            const recipeId = e.target.dataset.recipe;
            const input = document.getElementById('adv-trigger-recipe');
            const tagsContainer = document.getElementById('adv-selected-recipes');
            if (input && tagsContainer) {
                const recipes = input.value ? input.value.split(',').filter(s => s.trim()) : [];
                const idx = recipes.indexOf(recipeId);
                if (idx > -1) recipes.splice(idx, 1);
                input.value = recipes.join(',');
                tagsContainer.innerHTML = recipes.map(id => {
                    const shortName = id.includes(':') ? id.split(':').pop() : id;
                    return `<span class="loot-tag" data-recipe="${id}">${shortName}<span class="recipe-tag-remove" data-recipe="${id}" style="cursor:pointer;margin-left:4px;">×</span></span>`;
                }).join('');
            }
        }
    });

    const initialTrigger = document.getElementById('adv-trigger')?.value || 'inventory_changed';
    updateConditionVisibility(initialTrigger);
}

function createDefaultAdvancement(name) {
    return {
        name: name,
        title: '',
        description: '',
        icon: 'minecraft:diamond',
        trigger: 'inventory_changed',
        triggerItem: '',
        triggerEntity: '',
        triggerBlock: '',
        triggerRecipe: '',
        locationBiome: '',
        locationStructure: '',
        locationDimension: '',
        locationUsePosition: false,
        locationX: 0,
        locationY: 0,
        locationZ: 0,
        locationRange: 1,
        dimensionFrom: '',
        dimensionTo: '',
        reward: '',
        parent: '',
        broadcast: 'true',
        frame: 'task',
        category: currentAdvancementTab
    };
}

function populateBiomeSelect() {
    const select = document.getElementById('adv-location-biome');
    if (!select) return;
    PRESET_BIOMES.forEach(biome => {
        const option = document.createElement('option');
        option.value = biome.id;
        option.textContent = biome.name;
        select.appendChild(option);
    });
}

function populateStructureSelect() {
    const select = document.getElementById('adv-location-structure');
    if (!select) return;
    PRESET_STRUCTURES.forEach(structure => {
        const option = document.createElement('option');
        option.value = structure.id;
        option.textContent = structure.name;
        select.appendChild(option);
    });
}

function updateConditionVisibility(trigger) {
    document.querySelectorAll('.adv-condition-group').forEach(group => {
        const triggers = group.getAttribute('data-triggers');
        if (triggers) {
            const triggerList = triggers.split(',');
            group.style.display = triggerList.includes(trigger) ? 'block' : 'none';
        }
    });
}

function clearAdvancementForm() {
    const fields = [
        'adv-id', 'adv-name', 'adv-title', 'adv-description',
        'adv-icon', 'adv-trigger-item', 'adv-trigger-entity', 'adv-trigger-block', 'adv-trigger-bucket',
        'adv-reward'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // 清空预览
    ['adv-trigger-item', 'adv-trigger-entity', 'adv-trigger-block', 'adv-trigger-bucket', 'adv-icon'].forEach(id => {
        const preview = document.getElementById('preview-' + id);
        if (preview) {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    });

    const selects = ['adv-trigger', 'adv-parent', 'adv-broadcast', 'adv-frame',
        'adv-location-biome', 'adv-location-structure',
        'adv-location-dimension', 'adv-dimension-from', 'adv-dimension-to'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // 清空配方选择
    const recipeInput = document.getElementById('adv-trigger-recipe');
    const recipeTags = document.getElementById('adv-selected-recipes');
    if (recipeInput) recipeInput.value = '';
    if (recipeTags) recipeTags.innerHTML = '';

    const checkbox = document.getElementById('adv-location-use-position');
    if (checkbox) checkbox.checked = false;

    const posGroup = document.getElementById('adv-location-position-group');
    if (posGroup) posGroup.style.display = 'none';

    const nums = ['adv-location-x', 'adv-location-y', 'adv-location-z', 'adv-location-range'];
    nums.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 0;
    });

    const triggerVal = document.getElementById('adv-trigger')?.value || 'inventory_changed';
    updateConditionVisibility(triggerVal);
}

export function refreshAdvancementList() {
    const list = document.getElementById('advancement-list');
    if (!list) return;
    list.innerHTML = '';
    Object.keys(datapackData.advancements).forEach(advId => {
        const adv = datapackData.advancements[advId];
        const advCategory = adv.category || '';
        if (advCategory !== currentAdvancementTab) return;
        const li = document.createElement('li');
        li.className = 'advancement-item';
        li.setAttribute('data-advancement', advId);
        const triggerLabels = {
            'inventory_changed': '物品', 'player_killed_entity': '击杀', 'entity_killed_player': '被杀',
            'recipe_unlocked': '配方', 'recipe_crafted': '合成', 'location': '位置', 'slept_in_bed': '睡觉',
            'changed_dimension': '维度', 'consume_item': '使用', 'placed_block': '放置',
            'fishing_rod_hooked': '钓鱼', 'cured_zombie_villager': '治愈',
            'tame_animal': '驯服', 'brewed_potion': '酿造', 'enchanted_item': '附魔',
            'filled_bucket': '装桶', 'villager_trade': '交易'
        };
        const triggerLabel = triggerLabels[adv.trigger] || adv.trigger;
        li.innerHTML = '<span class="adv-list-icon"></span>' +
            '<span class="adv-list-name">' + (adv.name || advId) + '</span>' +
            '<span class="adv-list-trigger">' + triggerLabel + '</span>' +
            '<button class="delete-btn" onclick="deleteAdvancement(\'' + advId + '\', event)">✕</button>';
        li.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-btn')) return;
            selectAdvancement(advId);
        });
        list.appendChild(li);
    });
}

window.deleteAdvancement = function(advId, event) {
    event.stopPropagation();
    window.showConfirm('确定要删除进度 "<strong>' + (datapackData.advancements[advId]?.name || advId) + '</strong>" 吗？', function(result) {
        if (result) {
            delete datapackData.advancements[advId];
            if (window.currentAdvancement === advId) {
                window.currentAdvancement = null;
                clearAdvancementForm();
            }
            refreshAdvancementList();
            refreshParentSelect();
            showNotification('进度已删除！', 'success');
        }
    });
};

function selectAdvancement(advId) {
    document.querySelectorAll('.advancement-item').forEach(item => item.classList.remove('active'));
    const item = document.querySelector('[data-advancement="' + advId + '"]');
    if (item) item.classList.add('active');
    window.currentAdvancement = advId;
    loadAdvancementData(advId);
}

function loadAdvancementData(advId) {
    const adv = datapackData.advancements[advId];
    if (!adv) return;

    const advCategory = adv.category || '';
    if (advCategory !== currentAdvancementTab) {
        window.switchAdvancementTab(advCategory);
    }

    setFieldValue('adv-id', advId);
    setFieldValue('adv-name', adv.name || '');
    setFieldValue('adv-title', adv.title || '');
    setFieldValue('adv-description', adv.description || '');
    setFieldValue('adv-icon', adv.icon || 'minecraft:diamond');
    setFieldValue('adv-trigger', adv.trigger || 'inventory_changed');
    setFieldValue('adv-trigger-item', adv.triggerItem || '');
    setFieldValue('adv-trigger-entity', adv.triggerEntity || '');
    setFieldValue('adv-trigger-block', adv.triggerBlock || '');
    setFieldValue('adv-trigger-bucket', adv.triggerItem || '');

    // 更新数据预览
    const triggerItemInput = document.getElementById('adv-trigger-item');
    if (triggerItemInput) updateItemPreview(triggerItemInput);
    const triggerEntityInput = document.getElementById('adv-trigger-entity');
    if (triggerEntityInput) updateDataPreview(triggerEntityInput, 'entity');
    const triggerBlockInput = document.getElementById('adv-trigger-block');
    if (triggerBlockInput) updateDataPreview(triggerBlockInput, 'block');
    const triggerBucketInput = document.getElementById('adv-trigger-bucket');
    if (triggerBucketInput) updateDataPreview(triggerBucketInput, 'bucket');

    // 加载配方选择
    const recipeInput = document.getElementById('adv-trigger-recipe');
    const recipeTags = document.getElementById('adv-selected-recipes');
    if (recipeInput && recipeTags) {
        const recipes = adv.triggerRecipe ? adv.triggerRecipe.split(',').filter(s => s.trim()) : [];
        recipeInput.value = recipes.join(',');
        recipeTags.innerHTML = recipes.map(id => {
            const shortName = id.includes(':') ? id.split(':').pop() : id;
            return `<span class="loot-tag" data-recipe="${id}">${shortName}<span class="recipe-tag-remove" data-recipe="${id}" style="cursor:pointer;margin-left:4px;">×</span></span>`;
        }).join('');
    }
    setFieldValue('adv-reward', adv.reward || '');
    setFieldValue('adv-broadcast', adv.broadcast !== undefined ? adv.broadcast : 'true');
    setFieldValue('adv-frame', adv.frame || 'task');

    setFieldValue('adv-location-biome', adv.locationBiome || '');
    setFieldValue('adv-location-structure', adv.locationStructure || '');
    setFieldValue('adv-location-dimension', adv.locationDimension || '');
    setFieldValue('adv-location-x', adv.locationX ?? 0);
    setFieldValue('adv-location-y', adv.locationY ?? 0);
    setFieldValue('adv-location-z', adv.locationZ ?? 0);
    setFieldValue('adv-location-range', adv.locationRange ?? 1);

    setFieldValue('adv-dimension-from', adv.dimensionFrom || '');
    setFieldValue('adv-dimension-to', adv.dimensionTo || '');

    const usePos = document.getElementById('adv-location-use-position');
    if (usePos) {
        usePos.checked = adv.locationUsePosition || false;
        const posGroup = document.getElementById('adv-location-position-group');
        if (posGroup) {
            posGroup.style.display = usePos.checked ? 'block' : 'none';
        }
    }

    refreshParentSelect(advId);
    setFieldValue('adv-parent', adv.parent || '');
    updateConditionVisibility(adv.trigger || 'inventory_changed');
}

function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function saveAdvancementData(advId) {
    const usePos = document.getElementById('adv-location-use-position');
    const posChecked = usePos ? usePos.checked : false;
    const trigger = getFieldValue('adv-trigger') || 'inventory_changed';

    let triggerItem = getFieldValue('adv-trigger-item');
    if (trigger === 'filled_bucket') {
        triggerItem = getFieldValue('adv-trigger-bucket');
    }
    let triggerRecipe = '';
    if (RECIPE_TRIGGERS.includes(trigger)) {
        triggerRecipe = getFieldValue('adv-trigger-recipe');
    }

    datapackData.advancements[advId] = {
        name: getFieldValue('adv-name'),
        title: getFieldValue('adv-title'),
        description: getFieldValue('adv-description'),
        icon: getFieldValue('adv-icon') || 'minecraft:diamond',
        trigger: trigger,
        triggerItem: triggerItem,
        triggerRecipe: triggerRecipe,
        triggerEntity: getFieldValue('adv-trigger-entity'),
        triggerBlock: getFieldValue('adv-trigger-block'),
        locationBiome: getFieldValue('adv-location-biome'),
        locationStructure: getFieldValue('adv-location-structure'),
        locationDimension: getFieldValue('adv-location-dimension'),
        locationUsePosition: posChecked,
        locationX: posChecked ? parseFloat(getFieldValue('adv-location-x') || 0) : 0,
        locationY: posChecked ? parseFloat(getFieldValue('adv-location-y') || 0) : 0,
        locationZ: posChecked ? parseFloat(getFieldValue('adv-location-z') || 0) : 0,
        locationRange: posChecked ? parseFloat(getFieldValue('adv-location-range') || 1) : 1,
        dimensionFrom: getFieldValue('adv-dimension-from'),
        dimensionTo: getFieldValue('adv-dimension-to'),
        reward: getFieldValue('adv-reward'),
        parent: getFieldValue('adv-parent') || '',
        broadcast: getFieldValue('adv-broadcast') || 'true',
        frame: getFieldValue('adv-frame') || 'task',
        category: currentAdvancementTab
    };

    refreshAdvancementList();
    return datapackData.advancements[advId];
}

function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

// ===== 配方选择弹窗（用于解锁配方/合成进度） =====
function openAdvancementRecipeSelector() {
    const existing = document.getElementById('adv-recipe-selector-modal');
    if (existing) existing.remove();

    const customRecipes = window.datapackData ? window.datapackData.recipes || {} : {};
    const namespace = window.datapackData ? window.datapackData.namespace || 'my_datapack' : 'my_datapack';

    const currentInput = document.getElementById('adv-trigger-recipe');
    const currentRecipes = currentInput ? currentInput.value.split(',').filter(s => s.trim()) : [];

    let allOptionsHtml = '';
    if (vanillaRecipes && vanillaRecipes.length > 0) {
        allOptionsHtml += `<div style="padding:4px 0;color:#f59e0b;font-size:12px;font-weight:bold;border-bottom:1px solid #444;margin-bottom:4px;">原版配方</div>`;
        vanillaRecipes.forEach(r => {
            const checked = currentRecipes.includes(r.id) ? 'checked' : '';
            allOptionsHtml += `<label class="checkbox-label recipe-checkbox-label" data-recipe-id="${r.id}" data-recipe-source="vanilla" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;">
                <input type="checkbox" class="adv-recipe-checkbox" data-recipe-id="${r.id}" ${checked}>
                <span class="recipe-name">${r.name}</span>
                <span style="color:#64748b;font-size:11px;">${r.id}</span>
            </label>`;
        });
    }
    if (Object.keys(customRecipes).length > 0) {
        allOptionsHtml += `<div style="padding:4px 0;color:#4fc3f7;font-size:12px;font-weight:bold;border-bottom:1px solid #444;margin-bottom:4px;">自定义配方</div>`;
        Object.keys(customRecipes).forEach(recipeId => {
            const r = customRecipes[recipeId];
            const label = (r && r.name) ? r.name : recipeId;
            const fullId = namespace + ':' + recipeId;
            const checked = currentRecipes.includes(fullId) ? 'checked' : '';
            allOptionsHtml += `<label class="checkbox-label recipe-checkbox-label" data-recipe-id="${fullId}" data-recipe-source="custom" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;">
                <input type="checkbox" class="adv-recipe-checkbox" data-recipe-id="${fullId}" ${checked}>
                <span class="recipe-name">${label}</span>
                <span style="color:#f59e0b;font-size:11px;">${fullId}</span>
            </label>`;
        });
    }
    if (!allOptionsHtml) {
        allOptionsHtml = '<div style="color:#888;padding:8px;text-align:center;">暂无配方数据</div>';
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'adv-recipe-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content">
            <span class="close-modal" onclick="document.getElementById('adv-recipe-selector-modal').remove()">&times;</span>
            <div class="modal-header"><h3>选择配方（可多选）</h3></div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="adv-recipe-search" placeholder="搜索配方...">
                </div>
                <div style="margin-bottom:4px;display:flex;gap:4px;">
                    <button type="button" id="adv-recipe-select-all-btn" class="btn-add-mini" style="font-size:11px;">☑ 全选当前显示</button>
                </div>
                <div style="max-height:300px;overflow-y:auto;border:1px solid #444;border-radius:4px;padding:8px;background:#16213e;">
                    ${allOptionsHtml}
                </div>
                <div style="margin-top:6px;display:flex;gap:6px;">
                    <input type="text" id="adv-recipe-custom-input" placeholder="手动输入自定义配方ID（多个用逗号分隔）" style="flex:1;padding:6px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;">
                    <button type="button" id="adv-recipe-add-custom" class="btn-add-mini" style="white-space:nowrap;">添加</button>
                </div>
            </div>
            <div class="modal-actions">
                <span id="adv-recipe-count" style="color:var(--mc-text-secondary);font-size:13px;margin-right:auto;">已选择 ${currentRecipes.length} 个</span>
                <button class="btn-cancel" onclick="document.getElementById('adv-recipe-selector-modal').remove()">取消</button>
                <button id="adv-recipe-confirm" class="btn-primary">确认选择</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    const selectedIds = new Set(currentRecipes);

    function updateCount() {
        const countEl = modal.querySelector('#adv-recipe-count');
        if (countEl) countEl.textContent = '已选择 ' + selectedIds.size + ' 个';
    }

    // 复选框点击
    modal.querySelectorAll('.adv-recipe-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const id = this.dataset.recipeId;
            if (this.checked) {
                selectedIds.add(id);
            } else {
                selectedIds.delete(id);
            }
            updateCount();
        });
    });
    modal.querySelectorAll('.recipe-checkbox-label').forEach(label => {
        label.addEventListener('click', function(e) {
            setTimeout(updateCount, 0);
        });
    });

    // 搜索
    const searchInput = modal.querySelector('#adv-recipe-search');
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        modal.querySelectorAll('.recipe-checkbox-label').forEach(label => {
            const id = label.dataset.recipeId.toLowerCase();
            const name = label.querySelector('.recipe-name').textContent.toLowerCase();
            label.style.display = (!q || id.includes(q) || name.includes(q)) ? '' : 'none';
        });
        updateSelectAllBtn();
    });

    function updateSelectAllBtn() {
        const btn = modal.querySelector('#adv-recipe-select-all-btn');
        if (!btn) return;
        const visibleLabels = [];
        modal.querySelectorAll('.recipe-checkbox-label').forEach(label => {
            if (label.style.display !== 'none') visibleLabels.push(label);
        });
        const allChecked = visibleLabels.length > 0 && visibleLabels.every(label => {
            const cb = label.querySelector('.adv-recipe-checkbox');
            return cb && cb.checked;
        });
        btn.textContent = allChecked ? '☐ 取消全选' : '☑ 全选当前显示';
    }

    // 全选
    const selectAllBtn = modal.querySelector('#adv-recipe-select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const visibleLabels = [];
            modal.querySelectorAll('.recipe-checkbox-label').forEach(label => {
                if (label.style.display !== 'none') visibleLabels.push(label);
            });
            const allChecked = visibleLabels.length > 0 && visibleLabels.every(label => {
                const cb = label.querySelector('.adv-recipe-checkbox');
                return cb && cb.checked;
            });
            visibleLabels.forEach(label => {
                const cb = label.querySelector('.adv-recipe-checkbox');
                if (cb) {
                    cb.checked = !allChecked;
                    const id = cb.dataset.recipeId;
                    if (cb.checked) {
                        selectedIds.add(id);
                    } else {
                        selectedIds.delete(id);
                    }
                }
            });
            updateCount();
            updateSelectAllBtn();
        });
    }

    // 自定义添加
    const customInput = modal.querySelector('#adv-recipe-custom-input');
    modal.querySelector('#adv-recipe-add-custom').addEventListener('click', function() {
        const val = customInput.value.trim();
        if (val) {
            const ids = val.split(',').map(s => s.trim()).filter(s => s);
            ids.forEach(id => selectedIds.add(id));
            customInput.value = '';
            updateCount();
        }
    });
    customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            modal.querySelector('#adv-recipe-add-custom').click();
        }
    });

    // 确认
    modal.querySelector('#adv-recipe-confirm').addEventListener('click', function() {
        const input = document.getElementById('adv-trigger-recipe');
        const tagsContainer = document.getElementById('adv-selected-recipes');
        if (input && tagsContainer) {
            const selected = Array.from(selectedIds);
            input.value = selected.join(',');
            tagsContainer.innerHTML = selected.map(id => {
                const shortName = id.includes(':') ? id.split(':').pop() : id;
                return `<span class="loot-tag" data-recipe="${id}">${shortName}<span class="recipe-tag-remove" data-recipe="${id}" style="cursor:pointer;margin-left:4px;">×</span></span>`;
            }).join('');
        }
        modal.remove();
    });

    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

function refreshParentSelect(excludeId) {
    const parentEl = document.getElementById('adv-parent');
    if (!parentEl) return;

    const currentValue = parentEl.value;
    parentEl.innerHTML = '<option value="">无（根进度）</option>';

    const currentAdvId = excludeId || window.currentAdvancement;

    const activeTab = currentAdvancementTab;

    if (activeTab) {
        const vanillaInTab = VANILLA_ADVANCEMENTS.filter(adv => adv.category === activeTab);
        if (vanillaInTab.length > 0) {
            const group = document.createElement('optgroup');
            group.label = '原版 - ' + activeTab;
            vanillaInTab.forEach(adv => {
                const option = document.createElement('option');
                option.value = adv.id;
                option.textContent = adv.name + ' (' + adv.id + ')';
                group.appendChild(option);
            });
            parentEl.appendChild(group);
        }
    }

    const customAdvs = Object.keys(datapackData.advancements).filter(id => {
        if (id === currentAdvId) return false;
        const adv = datapackData.advancements[id];
        const advCategory = adv.category || '';
        return advCategory === activeTab;
    });
    if (customAdvs.length > 0) {
        const group = document.createElement('optgroup');
        group.label = '自定义进度';
        customAdvs.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = (datapackData.advancements[id].name || id) + ' (' + id + ')';
            group.appendChild(option);
        });
        parentEl.appendChild(group);
    }

    if (currentValue) {
        parentEl.value = currentValue;
    }
}

export { refreshParentSelect };

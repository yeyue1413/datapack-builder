import { datapackData } from './data/data-core.js';
import { PRESET_ENCHANTMENTS } from './data/data-loot.js';
import { showNotification } from './utils.js';
import { ensureVanillaDataLoaded } from './vanilla-data-loader.js';

// 药水类型ID → 状态效果ID 映射表
// Minecraft 药水类型ID（如 minecraft:leaping）与状态效果ID（如 minecraft:jump_boost）不同
const POTION_TO_EFFECT_ID = {
    'minecraft:night_vision': 'minecraft:night_vision',
    'minecraft:invisibility': 'minecraft:invisibility',
    'minecraft:leaping': 'minecraft:jump_boost',
    'minecraft:fire_resistance': 'minecraft:fire_resistance',
    'minecraft:swiftness': 'minecraft:speed',
    'minecraft:slowness': 'minecraft:slowness',
    'minecraft:turtle_master': 'minecraft:slowness', // 乌龟大师同时给予缓慢和抗性提升
    'minecraft:water_breathing': 'minecraft:water_breathing',
    'minecraft:healing': 'minecraft:instant_health',
    'minecraft:harming': 'minecraft:instant_damage',
    'minecraft:poison': 'minecraft:poison',
    'minecraft:regeneration': 'minecraft:regeneration',
    'minecraft:strength': 'minecraft:strength',
    'minecraft:weakness': 'minecraft:weakness',
    'minecraft:luck': 'minecraft:luck',
    'minecraft:slow_falling': 'minecraft:slow_falling',
    'minecraft:wind_charged': 'minecraft:wind_charged',
    'minecraft:weaving': 'minecraft:weaving',
    'minecraft:oozing': 'minecraft:oozing',
    'minecraft:infested': 'minecraft:infested',
};

// 需要拆分为多个效果的特殊药水
const POTION_MULTI_EFFECT = {
    'minecraft:turtle_master': ['minecraft:slowness', 'minecraft:resistance'],
};

function getFuncContent(funcId) {
    const func = datapackData.functions[funcId];
    if (!func) return '';
    if (typeof func === 'string') return func;
    return func.content || '';
}

function setFuncContent(funcId, content) {
    const func = datapackData.functions[funcId];
    if (func && typeof func === 'object') {
        func.content = content;
    } else {
        datapackData.functions[funcId] = content;
    }
}

const EVENT_TRIGGER_MAP = {
    // 玩家行为
    'jump': { trigger: 'minecraft:location', description: '跳跃触发' },
    'sneak': { trigger: 'minecraft:location', description: '潜行触发' },
    'sleep': { trigger: 'minecraft:slept_in_bed', description: '睡觉触发' },
    'fish': { trigger: 'minecraft:fishing_rod_hooked', description: '钓鱼触发' },
    'open_chest': { trigger: 'minecraft:open_chest', description: '打开箱子触发' },
    'play_record': { trigger: 'minecraft:play_record', description: '播放唱片触发' },
    // 战斗相关
    'hurt': { trigger: 'minecraft:entity_hurt_player', description: '受伤触发' },
    'death': { trigger: 'minecraft:entity_killed_player', description: '死亡触发' },
    'kill_entity': { trigger: 'minecraft:player_killed_entity', description: '击杀实体触发' },
    'player_hurt_entity': { trigger: 'minecraft:player_hurt_entity', description: '攻击生物触发' },
    'killed_by_crossbow': { trigger: 'minecraft:killed_by_crossbow', description: '被弩箭射杀触发' },
    'shot_crossbow': { trigger: 'minecraft:shot_crossbow', description: '用弩射击触发' },
    'target_hit': { trigger: 'minecraft:target_hit', description: '射中标靶触发' },
    'channeled_lightning': { trigger: 'minecraft:channeled_lightning', description: '引雷触发' },
    'used_totem': { trigger: 'minecraft:used_totem', description: '触发不死图腾触发' },
    'kill_mob_near_sculk_catalyst': { trigger: 'minecraft:kill_mob_near_sculk_catalyst', description: '幽匿催发体旁击杀触发' },
    'summoned_entity': { trigger: 'minecraft:summoned_entity', description: '召唤实体触发' },
    'started_riding': { trigger: 'minecraft:started_riding', description: '骑乘实体触发' },
    'ride_entity_in_lava': { trigger: 'minecraft:ride_entity_in_lava', description: '骑乘熔岩实体触发' },
    // 物品相关
    'use_item': { trigger: 'minecraft:inventory_changed', description: '物品栏变化触发（捡起/丢弃/移动物品）' },
    'consume_item': { trigger: 'minecraft:consume_item', description: '消耗物品触发' },
    'enchant_item': { trigger: 'minecraft:enchanted_item', description: '附魔触发' },
    'brew_potion': { trigger: 'minecraft:brewed_potion', description: '酿造触发' },
    'item_durability_changed': { trigger: 'minecraft:item_durability_changed', description: '物品损耗触发' },
    'filled_bucket': { trigger: 'minecraft:filled_bucket', description: '填充桶触发' },
    'recipe_crafted': { trigger: 'minecraft:recipe_crafted', description: '合成触发' },
    'using_item': { trigger: 'minecraft:using_item', description: '持续使用物品触发' },
    'crafter_recipe_crafted': { trigger: 'minecraft:crafter_recipe_crafted', description: '合成器合成触发' },
    'player_generates_container_loot': { trigger: 'minecraft:player_generates_container_loot', description: '打开战利品箱触发' },
    'thrown_item_picked_up_by_player': { trigger: 'minecraft:thrown_item_picked_up_by_player', description: '捡起实体扔出物品触发' },
    'thrown_item_picked_up_by_entity': { trigger: 'minecraft:thrown_item_picked_up_by_entity', description: '实体捡起你扔出物品触发' },
    // 方块相关
    'place_block': { trigger: 'minecraft:placed_block', description: '放置方块触发' },
    'any_block_use': { trigger: 'minecraft:any_block_use', description: '与方块交互触发' },
    'default_block_use': { trigger: 'minecraft:default_block_use', description: '空手交互方块触发' },
    'item_used_on_block': { trigger: 'minecraft:item_used_on_block', description: '手持物品交互方块触发' },
    'enter_block': { trigger: 'minecraft:enter_block', description: '碰到方块触发' },
    'bee_nest_destroyed': { trigger: 'minecraft:bee_nest_destroyed', description: '破坏蜂巢触发' },
    'construct_beacon': { trigger: 'minecraft:construct_beacon', description: '激活信标触发' },
    'slide_down_block': { trigger: 'minecraft:slide_down_block', description: '滑下蜂蜜块触发' },
    // 生物交互
    'trade_villager': { trigger: 'minecraft:villager_trade', description: '交易触发' },
    'tame_animal': { trigger: 'minecraft:tame_animal', description: '驯服触发' },
    'bred_animals': { trigger: 'minecraft:bred_animals', description: '繁殖动物触发' },
    'cured_zombie_villager': { trigger: 'minecraft:cured_zombie_villager', description: '治愈僵尸村民触发' },
    'player_interacted_with_entity': { trigger: 'minecraft:player_interacted_with_entity', description: '实体交互触发' },
    'allay_drop_item_on_block': { trigger: 'minecraft:allay_drop_item_on_block', description: '悦灵投掷物品触发' },
    // 游戏机制
    'dimension_change': { trigger: 'minecraft:changed_dimension', description: '维度变化触发' },
    'effects_changed': { trigger: 'minecraft:effects_changed', description: '状态效果变化触发' },
    'fall_from_height': { trigger: 'minecraft:fall_from_height', description: '高处摔落触发' },
    'fall_after_explosion': { trigger: 'minecraft:fall_after_explosion', description: '爆炸后摔落触发' },
    'levitation': { trigger: 'minecraft:levitation', description: '飘浮触发' },
    'lightning_strike': { trigger: 'minecraft:lightning_strike', description: '闪电触发' },
    'nether_travel': { trigger: 'minecraft:nether_travel', description: '下界返回主世界触发' },
    'avoid_vibration': { trigger: 'minecraft:avoid_vibration', description: '潜行避免振动触发' },
    'hero_of_the_village': { trigger: 'minecraft:hero_of_the_village', description: '村庄英雄触发' },
    'voluntary_exile': { trigger: 'minecraft:voluntary_exile', description: '触发袭击触发' },
    'raid_win': { trigger: 'minecraft:raid_win', description: '袭击胜利触发' },
    'used_ender_eye': { trigger: 'minecraft:used_ender_eye', description: '使用末影之眼触发' },
    'interact_with_anvil': { trigger: 'minecraft:interact_with_anvil', description: '使用铁砧触发' },
};

// 事件触发额外条件字段配置（哪些事件需要添加额外的conditions字段）
export const EVENT_EXTRA_CONFIG = {
    'player_generates_container_loot': {
        fields: [
            { id: 'loot_table', label: '战利品表ID', type: 'loot_table_multi', required: true, hint: '选择触发此进度所需的战利品表（可多选）' }
        ]
    },
    'crafter_recipe_crafted': {
        fields: [
            { id: 'recipe_id', label: '配方ID', type: 'recipe', required: true, hint: '选择触发此进度所需的配方（必填）' }
        ]
    },
    'recipe_crafted': {
        fields: [
            { id: 'recipe_id', label: '配方ID', type: 'recipe', required: true, hint: '选择触发此进度所需的配方（必填）' }
        ]
    },
    'enter_block': {
        fields: [
            { id: 'block', label: '方块ID', type: 'text', required: false, hint: '碰到的方块ID（如 minecraft:water）' }
        ]
    },
    'bee_nest_destroyed': {
        fields: [
            { id: 'block', label: '方块ID', type: 'text', required: false, hint: '被破坏的方块ID（minecraft:beehive 或 minecraft:bee_nest）' }
        ]
    },
    'brewed_potion': {
        fields: [
            { id: 'potion', label: '药水ID', type: 'text', required: false, hint: '药水ID（如 minecraft:night_vision）' }
        ]
    },
    'construct_beacon': {
        fields: [
            { id: 'level', label: '信标等级', type: 'number', required: false, min: 1, max: 4, hint: '信标基座层数（1-4）' }
        ]
    },
    'enchanted_item': {
        fields: [
            { id: 'levels', label: '附魔等级', type: 'number', required: false, min: 1, max: 30, hint: '附魔花费的经验等级' }
        ]
    },
    'changed_dimension': {
        fields: [
            { id: 'dimension_from', label: '原维度', type: 'dimension', required: false, hint: '传送前的维度' },
            { id: 'dimension_to', label: '目标维度', type: 'dimension', required: false, hint: '传送后的维度' }
        ]
    },
    'filled_bucket': {
        fields: [
            { id: 'item', label: '桶物品ID', type: 'text', required: false, hint: '填充后的桶物品ID（如 minecraft:water_bucket）' }
        ]
    },
    'used_totem': {
        fields: [
            { id: 'item', label: '物品ID', type: 'text', required: false, hint: '使用的不死图腾物品ID' }
        ]
    },
    'shot_crossbow': {
        fields: [
            { id: 'item', label: '弩物品ID', type: 'text', required: false, hint: '发射所使用的弩ID' }
        ]
    },
    'target_hit': {
        fields: [
            { id: 'signal_strength', label: '红石信号强度', type: 'number', required: false, min: 0, max: 15, hint: '标靶产生的红石信号强度（0-15）' }
        ]
    },
    'player_interacted_with_entity': {
        fields: [
            { id: 'entity_type', label: '实体类型', type: 'text', required: false, hint: '交互的实体类型ID（如 minecraft:villager）' }
        ]
    }
};

// 事件触发器的Wiki介绍（从进度定义格式.txt提取）
// 仅包含使用真实 advancement 触发器的事件，计分板检测事件不在此列
export const EVENT_WIKI_DESC = {
    // 战斗相关
    'hurt': '当玩家受到伤害，或阻挡所受到的伤害时触发。伤害并不一定来源于某个实体（比如被熔岩伤害）。可附加检查伤害类型、伤害来源实体等条件。',
    'death': '实体杀死玩家时触发。可附加检查杀死玩家的实体和伤害来源。',
    'kill_entity': '玩家杀死实体时触发。可附加检查被杀死的实体类型等条件。',
    'player_hurt_entity': '玩家伤害实体（包括自己）时触发。可附加检查造成的伤害和被伤害实体等条件。',
    'killed_by_crossbow': '箭杀死实体后对发射箭的玩家触发。适用于弩发射的箭。可附加检查被杀死的实体种类等条件。',
    'shot_crossbow': '玩家使用弩发射弹射物时触发。可附加检查所使用的弩物品。',
    'target_hit': '玩家射中标靶时触发。可附加检查标靶将产生的红石信号强度。',
    'channeled_lightning': '闪电束由引雷魔咒生成时对使用三叉戟的玩家触发。可附加检查被击中的实体。',
    'used_totem': '玩家使用不死图腾免于死亡时触发。可附加检查消耗的不死图腾物品。',
    'kill_mob_near_sculk_catalyst': '幽匿催发体蔓延时对死亡生物的伤害来源玩家触发。可附加检查被杀死的实体和伤害来源。',
    'summoned_entity': '铁傀儡/雪傀儡被通过搭建结构召唤时、凋灵被召唤时、末影龙被复活时触发。可附加检查被召唤的实体。',
    'started_riding': '实体被骑乘时对所有玩家乘客触发。',
    'ride_entity_in_lava': '玩家骑乘位于熔岩上的实体时，每游戏刻触发一次。可附加检查骑乘起始位置和移动距离。',
    // 物品相关
    'use_item': '玩家物品栏变化时触发。无论捡起物品、丢弃物品、在背包中移动物品、还是通过合成/烧炼获得物品，只要物品栏发生任何变化都会触发。',
    'consume_item': '玩家消耗了带有consumable组件的物品后触发。可附加检查被消耗的物品。',
    'enchant_item': '玩家通过附魔台附魔物品时触发。可附加检查附魔后的物品和附魔花费的经验等级。',
    'brew_potion': '玩家从酿造台中拿出一瓶药水时触发。可附加检查药水ID。',
    'item_durability_changed': '物品栏中任何物品以任何形式损害时触发。可用于检测工具损耗、盔甲受击等。可附加检查耐久度变化量和剩余耐久度。',
    'filled_bucket': '玩家填充桶时触发（从炼药锅填充时不触发）。可附加检查填充后的桶物品。',
    'recipe_crafted': '玩家使用工作台、熔炉、高炉、烟熏炉、切石机、物品栏或锻造台合成配方时触发。可附加检查合成配方ID和原材料。',
    'using_item': '玩家使用"可持续使用"的物品时，每游戏刻触发一次。适用于弓、弩、蜂蜜瓶、奶桶、药水、盾牌、望远镜、三叉戟、食物和末影之眼。',
    'crafter_recipe_crafted': '合成器将物品以实体形式掷出时对附近玩家触发。可附加检查合成配方ID和原材料。',
    'player_generates_container_loot': '玩家与可疑的方块或容器交互并使之按照战利品表生成战利品时触发。可附加检查战利品表ID。',
    'thrown_item_picked_up_by_player': '玩家捡起实体扔出的物品时触发。可附加检查被捡起的物品和扔出物品的实体。',
    'thrown_item_picked_up_by_entity': '实体捡起玩家扔出的物品时对扔出物品的玩家触发。可附加检查被捡起的物品和捡起物品的实体。',
    // 方块相关
    'place_block': '玩家放置方块物品、水或熔岩，以及使用打火石点火时触发（使用火焰弹点火时不会触发）。可附加检查放置位置和方块状态。',
    'any_block_use': '玩家与方块进行任何交互（包括默认交互，以及玩家不空手使用物品等方式）时触发。可附加检查交互的方块位置和所使用的物品。',
    'default_block_use': '玩家在非潜行状态下空手与方块进行交互时触发。可附加检查交互的方块位置。',
    'item_used_on_block': '玩家对方块空手或手持物品时进行某些使用操作时触发。可附加检查交互的方块位置和所使用的物品。',
    'enter_block': '每游戏刻，玩家对与其碰撞箱相交的各个方块分别触发，或者玩家掷出的末影珍珠进入末地折跃门时触发。可附加检查方块ID和方块状态。',
    'bee_nest_destroyed': '玩家破坏蜂巢或蜂箱时触发。可附加检查被破坏的方块ID、使用的工具和蜂箱内蜜蜂数量。',
    'construct_beacon': '信标检测到基座结构更改时对附近玩家触发。可附加检查信标基座层数。',
    'slide_down_block': '玩家从蜂蜜块上滑下时触发。',
    // 生物交互
    'trade_villager': '玩家成交一项交易时触发。可附加检查购买的物品和参与交易的村民或流浪商人。',
    'tame_animal': '玩家驯服动物时触发。可附加检查被驯服的实体。',
    'bred_animals': '两个动物繁殖时触发。可附加检查繁殖出的幼体、双亲等实体。',
    'cured_zombie_villager': '僵尸村民被治愈时对喂食其金苹果的玩家触发。可附加检查转化前后的村民和僵尸村民实体。',
    'player_interacted_with_entity': '玩家与实体交互时触发。可附加检查交互时手中的物品和交互的实体。',
    'allay_drop_item_on_block': '悦灵确定待投掷的目标方块后，将物品投掷的瞬间对关联的玩家触发。可附加检查目标方块位置。',
    // 游戏机制
    'sleep': '玩家上床睡觉时触发。',
    'fish': '玩家成功通过钓鱼获取物品或者使用钓鱼竿拉实体时触发。',
    'dimension_change': '玩家在传送到另一个维度或死亡后在另一维度重生时触发。可附加检查原维度和目标维度。',
    'effects_changed': '玩家获得或消除状态效果时触发。可附加检查状态效果列表。',
    'fall_from_height': '玩家摔落至地面时触发。可附加检查开始摔落时的位置和摔落距离。',
    'fall_after_explosion': '在玩家被爆炸或风爆击飞后摔落时触发。可附加检查被击飞时的位置、摔落距离和造成爆炸的实体。',
    'levitation': '玩家带有飘浮状态效果时每游戏刻触发一次。可附加检查飘浮时间和移动距离。',
    'lightning_strike': '闪电束消失时对附近玩家触发。可附加检查闪电束实体和附近被波及的实体。',
    'nether_travel': '玩家进入下界，然后返回主世界时触发。可附加检查传送前的主世界位置和返回时到达的位置。',
    'avoid_vibration': '玩家产生振动时，若幽匿感测体等因玩家潜行而无法检测时触发。',
    'hero_of_the_village': '一场袭击胜利后对所有在该场袭击中击杀过至少一名袭击者的玩家触发。',
    'voluntary_exile': '玩家触发一场新的袭击时触发。',
    'used_ender_eye': '玩家使用末影之眼定位要塞时触发。可附加检查玩家与指向的要塞的水平距离。',
};

// 将事件额外字段映射到conditions的格式
function mapEventFieldToCondition(conditions, fieldId, value, eventType) {
    switch (fieldId) {
        case 'loot_table':
            conditions.loot_table = value;
            break;
        case 'recipe_id':
            conditions.recipe_id = value;
            break;
        case 'block':
            conditions.block = value;
            break;
        case 'potion':
            conditions.potion = value;
            break;
        case 'level':
            conditions.level = { min: parseInt(value), max: parseInt(value) };
            break;
        case 'levels':
            conditions.levels = { min: parseInt(value), max: parseInt(value) };
            break;
        case 'dimension_from':
            if (!conditions.from) conditions.from = value;
            break;
        case 'dimension_to':
            if (!conditions.to) conditions.to = value;
            break;
        case 'item':
            if (eventType === 'filled_bucket') {
                conditions.item = { items: [value] };
            } else if (eventType === 'used_totem' || eventType === 'shot_crossbow') {
                conditions.item = { items: [value] };
            } else {
                conditions.item = { items: [value] };
            }
            break;
        case 'signal_strength':
            conditions.signal_strength = { min: parseInt(value), max: parseInt(value) };
            break;
        case 'entity_type':
            if (eventType === 'player_interacted_with_entity') {
                conditions.entity = { type: value };
            } else {
                conditions.entity = { type: value };
            }
            break;
        default:
            conditions[fieldId] = value;
    }
}

// 需要计分板检测的事件（通过tick检测计分板变化，不需要advancement）
// 以下事件没有对应的advancement触发器，只能使用计分板检测
export const TICK_DETECT_EVENTS = {
    'jump': {
        scoreboard: 'jump_stat',
        load: 'scoreboard objectives add jump_stat minecraft.custom:minecraft.jump\n',
        tick: (ns, funcId, target) =>
            `execute as ${target}[scores={jump_stat=1..}] run function ${ns}:${funcId}\n` +
            `scoreboard players set @a[scores={jump_stat=1..}] jump_stat 0\n`
    },
    'sneak': {
        scoreboard: 'sneak_stat',
        load: 'scoreboard objectives add sneak_stat minecraft.custom:minecraft.sneak_time\n',
        tick: (ns, funcId, target) =>
            `execute as ${target}[scores={sneak_stat=1..}] run function ${ns}:${funcId}\n` +
            `scoreboard players set @a[scores={sneak_stat=1..}] sneak_stat 0\n`
    },

    'open_chest': {
        scoreboard: 'open_chest_stat',
        load: 'scoreboard objectives add open_chest_stat minecraft.custom:minecraft.open_chest\n',
        tick: (ns, funcId, target) =>
            `execute as ${target}[scores={open_chest_stat=1..}] run function ${ns}:${funcId}\n` +
            `scoreboard players set @a[scores={open_chest_stat=1..}] open_chest_stat 0\n`
    },
    'play_record': {
        scoreboard: 'play_record_stat',
        load: 'scoreboard objectives add play_record_stat minecraft.custom:minecraft.play_record\n',
        tick: (ns, funcId, target) =>
            `execute as ${target}[scores={play_record_stat=1..}] run function ${ns}:${funcId}\n` +
            `scoreboard players set @a[scores={play_record_stat=1..}] play_record_stat 0\n`
    },
    'interact_with_anvil': {
        scoreboard: 'anvil_stat',
        load: 'scoreboard objectives add anvil_stat minecraft.custom:minecraft.interact_with_anvil\n',
        tick: (ns, funcId, target) =>
            `execute as ${target}[scores={anvil_stat=1..}] run function ${ns}:${funcId}\n` +
            `scoreboard players set @a[scores={anvil_stat=1..}] anvil_stat 0\n`
    },
    'raid_win': {
        scoreboard: 'raid_win_stat',
        load: 'scoreboard objectives add raid_win_stat minecraft.custom:minecraft.raid_win\n',
        tick: (ns, funcId, target) =>
            `execute as ${target}[scores={raid_win_stat=1..}] run function ${ns}:${funcId}\n` +
            `scoreboard players set @a[scores={raid_win_stat=1..}] raid_win_stat 0\n`
    },
};

// 导出部分初始化
export function initExportSection() {
    document.getElementById('export-zip').addEventListener('click', async function() {
        try {
            await exportDatapack();
        } catch (e) {
            console.error('[导出错误]', e);
            showNotification('导出失败：' + (e.message || '未知错误'), 'error');
        }
    });
}

// 更新导出预览
export async function updateExportPreview() {
    document.getElementById('preview-name').textContent = datapackData.name || '未设置';
    document.getElementById('preview-desc').textContent = datapackData.description || '未设置';
    document.getElementById('preview-namespace').textContent = datapackData.namespace || '未设置';
    
    const structure = await generateFileStructure();
    document.getElementById('structure-tree').textContent = structure;
}

// 生成文件结构
export async function generateFileStructure() {
    let tree = datapackData.name + '/\n';
    tree += '├── pack.mcmeta\n';
    tree += datapackData.packImage ? '├── pack.png\n' : '├── pack.png (可选)\n';
    tree += '└── data/\n';
    tree += '    ├── ' + datapackData.namespace + '/\n';
    
    // 函数
    const recipeUnlockFunctions = generateRecipeUnlockFunctions();
    const intervalDisplayFunctions = generateIntervalDisplayFunctions();
    const areaGen = generateAreaDetectionFunctions();
    const allFunctions = { ...datapackData.functions, ...recipeUnlockFunctions, ...intervalDisplayFunctions, ...areaGen.functions };
    if (Object.keys(allFunctions).length > 0) {
        tree += '    │   ├── function/\n';
        Object.keys(allFunctions).forEach((func, index, arr) => {
            const prefix = index === arr.length - 1 ? '    │   │   └── ' : '    │   │   ├── ';
            tree += prefix + func + '.mcfunction\n';
        });
    }
    
    // 函数事件触发进度
    const eventAdvancements = generateFunctionEventAdvancements();

    // 进度
    const allAdvIds = Object.keys(datapackData.advancements).concat(Object.keys(eventAdvancements));
    if (allAdvIds.length > 0) {
        tree += '    │   ├── advancement/\n';
        allAdvIds.forEach((adv, index, arr) => {
            const prefix = index === arr.length - 1 ? '    │   │   └── ' : '    │   │   ├── ';
            tree += prefix + adv + '.json\n';
        });
    }
    
    // 战利品表
    const generatedLootTables = generateLootTables();
    if (Object.keys(generatedLootTables).length > 0) {
        tree += '    │   ├── loot_table/\n';
        Object.keys(generatedLootTables).forEach((loot, index, arr) => {
            const prefix = index === arr.length - 1 ? '    │   │   └── ' : '    │   │   ├── ';
            tree += prefix + loot + '.json\n';
        });
    }
    
    // 配方
    const validRecipes = Object.keys(datapackData.recipes).filter(id => isValidRecipe(datapackData.recipes[id]));
    if (validRecipes.length > 0) {
        tree += '    │   ├── recipe/\n';
        validRecipes.forEach((recipe, index, arr) => {
            const prefix = index === arr.length - 1 ? '    │   │   └── ' : '    │   │   ├── ';
            tree += prefix + recipe + '.json\n';
        });
    }
    
    // Minecraft 命名空间
    tree += '    └── minecraft/\n';

    // 覆写原版配方文件
    const excludedRecipes = datapackData.excludedVanillaRecipes || [];
    const hasRecipeOverrides = excludedRecipes.length > 0;

    // 覆盖原版的战利品表
    const overrideTables = await generateOverrideLootTables();
    const hasBlocks = Object.keys(overrideTables.blocks).length > 0;
    const hasChests = Object.keys(overrideTables.chests).length > 0;
    const hasEntities = Object.keys(overrideTables.entities).length > 0;

    const hasLootOverrides = hasBlocks || hasChests || hasEntities;

    if (hasLootOverrides || hasRecipeOverrides) {
        let prefix = '        ';
        if (hasLootOverrides) {
            tree += prefix + '├── loot_table/\n';
            if (hasBlocks) {
                tree += prefix + '│   ├── blocks/\n';
                Object.keys(overrideTables.blocks).forEach((blockName, index, arr) => {
                    const p = index === arr.length - 1 ? prefix + '│   │   └── ' : prefix + '│   │   ├── ';
                    tree += p + blockName + '.json\n';
                });
            }
            if (hasChests) {
                tree += prefix + '│   ├── chests/\n';
                Object.keys(overrideTables.chests).forEach((chestName, index, arr) => {
                    const p = index === arr.length - 1 ? prefix + '│   │   └── ' : prefix + '│   │   ├── ';
                    tree += p + chestName + '.json\n';
                });
            }
            if (hasEntities) {
                tree += prefix + '│   └── entities/\n';
                Object.keys(overrideTables.entities).forEach((entityName, index, arr) => {
                    const p = index === arr.length - 1 ? prefix + '│       └── ' : prefix + '│       ├── ';
                    tree += p + entityName + '.json\n';
                });
            }
        }
        if (hasRecipeOverrides) {
            const recipePrefix = hasLootOverrides ? prefix + '├── recipe/\n' : prefix + '├── recipe/\n';
            tree += recipePrefix;
            excludedRecipes.forEach((recipeId, index, arr) => {
                const p = index === arr.length - 1 ? prefix + '│   └── ' : prefix + '│   ├── ';
                tree += p + recipeId + '.json (已禁用)\n';
            });
        }
        tree += prefix + '└── tags/\n';
    } else {
        tree += '        └── tags/\n';
    }
    tree += '            └── function/\n';
    tree += '                ├── load.json\n';
    tree += '                └── tick.json';
    
    return tree;
}

// 生成函数事件触发进度
export function generateFunctionEventAdvancements() {
    const advancements = {};
    const ns = datapackData.namespace;
    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return;

        // 处理事件触发
        if (func.triggerType === 'event' && func.eventType) {
            const eventConfig = EVENT_TRIGGER_MAP[func.eventType];
            if (!eventConfig) return;
            const advId = 'func_trigger_' + funcId;

            // 需要tick计分板检测的事件跳过advancement生成
            if (TICK_DETECT_EVENTS[func.eventType]) {
                return;
            }

            const extraFields = func.eventExtraFields || {};
            const extraConfig = EVENT_EXTRA_CONFIG[func.eventType];

            // 处理多选战利品表（loot_table_multi）：生成多个criteria，使用requirements OR
            if (func.eventType === 'player_generates_container_loot' && extraFields.loot_table) {
                const lootTables = extraFields.loot_table.split(',').filter(s => s.trim());
                if (lootTables.length === 0) return;
                const criteria = {};
                const reqList = [];
                lootTables.forEach((table, idx) => {
                    const key = funcId + '_triggered_' + idx;
                    criteria[key] = {
                        trigger: eventConfig.trigger,
                        conditions: { loot_table: table.trim() }
                    };
                    reqList.push(key);
                });
                advancements[advId] = {
                    criteria: criteria,
                    rewards: {
                        function: ns + ':' + funcId
                    }
                };
                // 设置requirements为OR：任一战利品表匹配即达成
                if (reqList.length > 1) {
                    advancements[advId].requirements = [reqList];
                }
                return;
            }

            // 处理多选配方（recipe_multi）：生成多个criteria，使用requirements OR
            if ((func.eventType === 'recipe_crafted' || func.eventType === 'crafter_recipe_crafted') && extraFields.recipe_id) {
                const recipeIds = extraFields.recipe_id.split(',').filter(s => s.trim());
                if (recipeIds.length === 0) return;
                const criteria = {};
                const reqList = [];
                recipeIds.forEach((recipeId, idx) => {
                    const key = funcId + '_triggered_' + idx;
                    criteria[key] = {
                        trigger: eventConfig.trigger,
                        conditions: { recipe_id: recipeId.trim() }
                    };
                    reqList.push(key);
                });
                advancements[advId] = {
                    criteria: criteria,
                    rewards: {
                        function: ns + ':' + funcId
                    }
                };
                // 设置requirements为OR：任一配方匹配即达成
                if (reqList.length > 1) {
                    advancements[advId].requirements = [reqList];
                }
                return;
            }

            // 构建conditions（包含其他额外条件字段）
            const conditions = {};
            if (extraConfig && extraConfig.fields) {
                extraConfig.fields.forEach(field => {
                    const value = extraFields[field.id];
                    if (value !== undefined && value !== null && value !== '') {
                        mapEventFieldToCondition(conditions, field.id, value, func.eventType);
                    }
                });
            }

            const criteria = {};
            const triggerKey = funcId + '_triggered';
            const criterion = {
                trigger: eventConfig.trigger
            };
            if (Object.keys(conditions).length > 0) {
                criterion.conditions = conditions;
            }
            criteria[triggerKey] = criterion;
            advancements[advId] = {
                criteria: criteria,
                rewards: {
                    function: ns + ':' + funcId
                }
            };
        }

    });
    return advancements;
}

function generateIntervalLoadContent() {
    let content = '';
    const ns = datapackData.namespace;
    let hasAnyActionbar = false;
    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return;
        if (func.triggerType !== 'interval' || func.interval <= 0) return;

        if (func.intervalActionbar !== false) {
            const sbName = `${funcId}_counter`;
            const totalTicks = Math.round(func.interval * 20);
            content += `scoreboard objectives add ${sbName} dummy\n`;
            content += `scoreboard players set @a ${sbName} ${totalTicks}\n`;
            hasAnyActionbar = true;
        } else {
            content += 'scoreboard objectives add func_timer dummy\n';
        }
    });
    if (hasAnyActionbar) {
        content += `schedule function ${ns}:time 1t\n`;
    }
    if (content) {
        content = [...new Set(content.split('\n'))].filter(l => l.trim()).join('\n');
        if (content) content += '\n';
    }
    return content;
}

function generateIntervalTickContent() {
    let content = '';
    const ns = datapackData.namespace;
    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return;
        if (func.triggerType !== 'interval' || func.interval <= 0) return;

        if (func.intervalActionbar !== false) {
            const sbName = `${funcId}_counter`;
            const totalTicks = Math.round(func.interval * 20);
            content += `execute as @a[scores={${sbName}=2..${totalTicks}}] run scoreboard players remove @s ${sbName} 1\n`;
            content += `execute as @a[scores={${sbName}=1}] run function ${ns}:${funcId}\n`;
            content += `execute as @a[scores={${sbName}=1}] run scoreboard players set @s ${sbName} ${totalTicks}\n`;
        } else {
            const timerObj = 'func_timer_' + funcId;
            const intervalTicks = Math.round(func.interval * 20);
            content += `scoreboard players add $${timerObj} func_timer 1\n`;
            content += `execute if score $${timerObj} func_timer matches ${intervalTicks}.. run scoreboard players set $${timerObj} func_timer 0\n`;
            const target = func.customSelector || func.target || '@a';
            content += `execute if score $${timerObj} func_timer matches 0 as ${target} run function ${ns}:${funcId}\n`;
        }
    });
    return content;
}

function generateIntervalDisplayFunctions() {
    const functions = {};
    const ns = datapackData.namespace;
    let timeContent = '';
    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return;
        if (func.triggerType !== 'interval' || func.interval <= 0) return;
        if (func.intervalActionbar === false) return;

        const duration = func.interval;
        const sbName = `${funcId}_counter`;
        const totalTicks = Math.round(duration * 20);
        const textColor = func.intervalColor || '#0BFF0A';
        const digitColor = func.intervalDigitColor || '#FF0000';
        const customText = func.intervalText;

        for (let s = duration; s >= 1; s--) {
            const rangeStart = (s - 1) * 20 + 1;
            const rangeEnd = s * 20;
            if (customText) {
                timeContent += `execute as @a[scores={${sbName}=${rangeStart}..${rangeEnd}}] run title @s actionbar [{"text":"${customText}","color":"${textColor}","bold":true},{"text":": ","color":"${textColor}"},{"text":"${s}","color":"${digitColor}"}]\n`;
            } else {
                timeContent += `execute as @a[scores={${sbName}=${rangeStart}..${rangeEnd}}] run title @s actionbar [{"text":"${s}","color":"${digitColor}","bold":true}]\n`;
            }
        }
    });
    if (timeContent) {
        timeContent += `schedule function ${ns}:time 1t`;
        functions['time'] = timeContent;
    }
    return functions;
}

// 生成事件检测load初始化（自动去重）
function generateEventLoadContent() {
    const addedObjectives = new Set();
    let content = '';
    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return;
        // 处理 event 类型中的 tick 检测事件
        if (func.triggerType === 'event' && func.eventType) {
            const eventConfig = TICK_DETECT_EVENTS[func.eventType];
            if (eventConfig && eventConfig.load) {
                const loadLines = eventConfig.load.split('\n');
                loadLines.forEach(line => {
                    if (line.trim().startsWith('scoreboard objectives add')) {
                        const objName = line.trim().split(' ')[3];
                        if (!addedObjectives.has(objName)) {
                            addedObjectives.add(objName);
                            content += line + '\n';
                        }
                    } else if (line.trim()) {
                        content += line + '\n';
                    }
                });
            }
        }
        // 处理血量检测触发（独立触发方式）
        if (func.triggerType === 'health_check') {
            if (!addedObjectives.has('health_check')) {
                addedObjectives.add('health_check');
                content += 'scoreboard objectives add health_check health\n';
            }
        }
    });
    if (content) {
        content = '# ===== 事件检测计分板初始化 =====\n' + content;
    }
    return content;
}

// 生成事件检测tick逻辑（自动合并相同事件的计分板重置）
function generateEventTickContent() {
    const ns = datapackData.namespace;
    // 按事件类型分组
    const eventGroups = {};
    const healthCheckGroups = [];
    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return;
        if (func.triggerType === 'event' && func.eventType) {
            const eventConfig = TICK_DETECT_EVENTS[func.eventType];
            if (eventConfig && eventConfig.tick) {
                if (!eventGroups[func.eventType]) eventGroups[func.eventType] = [];
                const target = func.customSelector || func.target || '@a';
                eventGroups[func.eventType].push({ funcId, target });
            }
        }
        if (func.triggerType === 'health_check') {
            const target = func.customSelector || func.target || '@a';
            const condition = func.healthCondition || 'below';
            const threshold = parseInt(func.healthThreshold) || 10;
            healthCheckGroups.push({ funcId, target, condition, threshold });
        }
    });

    let content = '';
    // 处理普通 tick 检测事件
    Object.keys(eventGroups).forEach(eventType => {
        const groups = eventGroups[eventType];
        const eventConfig = TICK_DETECT_EVENTS[eventType];
        const sb = eventConfig.scoreboard;
        groups.forEach(({ funcId, target }) => {
            content += `execute as ${target}[scores={${sb}=1..}] run function ${ns}:${funcId}\n`;
        });
        content += `scoreboard players set @a[scores={${sb}=1..}] ${sb} 0\n`;
    });
    // 处理血量检测触发（每个函数有独立阈值，血量值直接比较）
    if (healthCheckGroups.length > 0) {
        content += '# ===== 血量检测 =====\n';
        healthCheckGroups.forEach(({ funcId, target, condition, threshold }) => {
            if (condition === 'below') {
                content += `execute as ${target}[scores={health_check=..${threshold}}] run function ${ns}:${funcId}\n`;
            } else {
                content += `execute as ${target}[scores={health_check=${threshold + 1}..}] run function ${ns}:${funcId}\n`;
            }
        });
    }

    if (content) {
        content = '# ===== 事件检测tick逻辑 =====\n' + content;
    }
    return content;
}

// 生成区域检测函数
function generateAreaDetectionFunctions() {
    const ns = datapackData.namespace;
    const areaFunctions = {};
    const areaLoadContent = [];
    const areaTickContent = [];

    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return;
        if (func.triggerType !== 'area_detect') return;

        const mode = func.areaMode || 'enter';
        const areaName = func.areaName || 'spawn_area';
        const x1 = Math.min(func.areaX1 || 0, func.areaX2 || 0);
        const y1 = Math.min(func.areaY1 || -64, func.areaY2 || 320);
        const z1 = Math.min(func.areaZ1 || 0, func.areaZ2 || 0);
        const x2 = Math.max(func.areaX1 || 0, func.areaX2 || 100);
        const y2 = Math.max(func.areaY1 || -64, func.areaY2 || 320);
        const z2 = Math.max(func.areaZ1 || 0, func.areaZ2 || 100);

        // 区域检测函数
        const checkFuncId = `area/${areaName}_check`;
        let checkContent = `# 区域检测: ${areaName}\n`;
        checkContent += `# 区域范围: ${x1} ${y1} ${z1} -> ${x2} ${y2} ${z2}\n`;
        checkContent += `# 检测模式: ${mode}\n\n`;

        // 检测玩家是否在区域内
        checkContent += `# 检测区域内的玩家\n`;
        checkContent += `execute as @a[x=${x1},y=${y1},z=${z1},dx=${x2 - x1},dy=${y2 - y1},dz=${z2 - z1}] run scoreboard players set @s area_in_${areaName} 1\n`;
        checkContent += `execute as @a unless entity @s[x=${x1},y=${y1},z=${z1},dx=${x2 - x1},dy=${y2 - y1},dz=${z2 - z1}] run scoreboard players set @s area_in_${areaName} 0\n\n`;

        if (mode === 'enter') {
            checkContent += `# 检测进入区域\n`;
            checkContent += `execute as @a[scores={area_in_${areaName}=1,area_prev_${areaName}=0}] run function ${ns}:${funcId}\n`;
        } else if (mode === 'leave') {
            checkContent += `# 检测离开区域\n`;
            checkContent += `execute as @a[scores={area_in_${areaName}=0,area_prev_${areaName}=1}] run function ${ns}:${funcId}\n`;
        } else if (mode === 'inside') {
            checkContent += `# 在区域内每刻触发\n`;
            checkContent += `execute as @a[scores={area_in_${areaName}=1}] run function ${ns}:${funcId}\n`;
        }

        checkContent += `\n# 保存当前状态作为下次检测的上一状态\n`;
        checkContent += `scoreboard players operation @a area_prev_${areaName} = @a area_in_${areaName}\n`;
        areaFunctions[checkFuncId] = checkContent;

        // 添加到load
        areaLoadContent.push(`scoreboard objectives add area_in_${areaName} dummy`);
        areaLoadContent.push(`scoreboard objectives add area_prev_${areaName} dummy`);
        areaTickContent.push(`function ${ns}:${checkFuncId}`);
    });

    return { functions: areaFunctions, load: areaLoadContent.join('\n'), tick: areaTickContent.join('\n') };
}

// 导出数据包
export async function exportDatapack() {
    const packMeta = {
        pack: {
            pack_format: datapackData.format,
            description: datapackData.description || "A custom datapack",
            supported_formats: {
                min_inclusive: 11,
                max_inclusive: datapackData.format
            }
        }
    };

    const recipeUnlockLoad = generateRecipeUnlockLoad();
    const recipeUnlockTick = generateRecipeUnlockTick();
    const recipeRemovalLoad = generateRecipeRemovalLoad();
    const recipeRemovalTick = generateRecipeRemovalTick();
    const recipeUnlockAdvancements = generateRecipeUnlockAdvancements();
    const recipeUnlockFunctions = generateRecipeUnlockFunctions();
    const eventAdvancements = generateFunctionEventAdvancements();
    const allAdvancements = { ...generateAdvancements(), ...recipeUnlockAdvancements, ...eventAdvancements };

    // 构建函数内容（plain string map）
    const updatedFunctions = {};
    Object.keys(datapackData.functions).forEach(funcId => {
        let content = getFuncContent(funcId);
        // 为advancement触发的函数追加revoke命令，确保可重复触发
        const func = datapackData.functions[funcId];
        if (func && typeof func === 'object' && func.triggerType === 'event' && func.eventType) {
            if (!TICK_DETECT_EVENTS[func.eventType]) {
                content += '\n\n# 撤销触发进度以便重复触发\nadvancement revoke @s only ' + datapackData.namespace + ':func_trigger_' + funcId;
            }
        }
        updatedFunctions[funcId] = content;
    });
    Object.keys(recipeUnlockFunctions).forEach(funcId => {
        if (updatedFunctions[funcId]) {
            updatedFunctions[funcId] += '\n' + recipeUnlockFunctions[funcId];
        } else {
            updatedFunctions[funcId] = recipeUnlockFunctions[funcId];
        }
    });

    // 生成间隔显示函数
    const intervalDisplayFunctions = generateIntervalDisplayFunctions();
    Object.keys(intervalDisplayFunctions).forEach(funcId => {
        updatedFunctions[funcId] = intervalDisplayFunctions[funcId];
    });

    // 生成区域检测函数
    const areaResult = generateAreaDetectionFunctions();
    Object.keys(areaResult.functions).forEach(funcId => {
        updatedFunctions[funcId] = areaResult.functions[funcId];
    });

    // 检查是否需要 rng_random 计分板
    const hasRandomCall = Object.keys(datapackData.functions).some(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return false;
        if (func.actions && Array.isArray(func.actions)) {
            return func.actions.some(a => a.type === 'random_call');
        }
        return false;
    });

    // 处理 load/tick 的自动生成内容
    const intervalTickContent = generateIntervalTickContent();
    const intervalLoadContent = generateIntervalLoadContent();
    const eventTickContent = generateEventTickContent();
    const eventLoadContent = generateEventLoadContent();

    // 收集榜单创建函数（需要在数据包加载时执行）
    const LEADERBOARD_CRITERIA = {
        walk_distance: 'minecraft.custom:minecraft.walk_one_cm',
        sprint_distance: 'minecraft.custom:minecraft.sprint_one_cm',
        swim_distance: 'minecraft.custom:minecraft.swim_one_cm',
        fly_distance: 'minecraft.custom:minecraft.fly_one_cm',
        aviate_distance: 'minecraft.custom:minecraft.aviate_one_cm',
        crouch_distance: 'minecraft.custom:minecraft.crouch_one_cm',
        climb_distance: 'minecraft.custom:minecraft.climb_one_cm',
        boat_distance: 'minecraft.custom:minecraft.boat_one_cm',
        horse_distance: 'minecraft.custom:minecraft.horse_one_cm',
        minecart_distance: 'minecraft.custom:minecraft.minecart_one_cm',
        pig_distance: 'minecraft.custom:minecraft.pig_one_cm',
        strider_distance: 'minecraft.custom:minecraft.strider_one_cm',
        walk_on_water_distance: 'minecraft.custom:minecraft.walk_on_water_one_cm',
        walk_under_water_distance: 'minecraft.custom:minecraft.walk_under_water_one_cm',
        fall_distance: 'minecraft.custom:minecraft.fall_one_cm',
        plane_movement: 'dummy',
        mob_kills: 'minecraft.custom:minecraft.mob_kills',
        player_kills: 'minecraft.custom:minecraft.player_kills',
        damage_taken: 'minecraft.custom:minecraft.damage_taken',
        damage_dealt: 'minecraft.custom:minecraft.damage_dealt',
        deaths: 'minecraft.custom:minecraft.deaths',
        target_hit: 'minecraft.custom:minecraft.target_hit',
        play_time: 'minecraft.custom:minecraft.play_time',
        jumps: 'minecraft.custom:minecraft.jump',
        fish_caught: 'minecraft.custom:minecraft.fish_caught',
        traded_with_villager: 'minecraft.custom:minecraft.traded_with_villager',
        enchant_item: 'minecraft.custom:minecraft.enchant_item',
        animals_bred: 'minecraft.custom:minecraft.animals_bred',
        sleep_in_bed: 'minecraft.custom:minecraft.sleep_in_bed',
        bell_ring: 'minecraft.custom:minecraft.bell_ring',
        play_record: 'minecraft.custom:minecraft.play_record',
        open_chest: 'minecraft.custom:minecraft.open_chest',
        raid_win: 'minecraft.custom:minecraft.raid_win',
        sneak_time: 'minecraft.custom:minecraft.sneak_time',
        drop_count: 'minecraft.custom:minecraft.drop',
        leave_game: 'minecraft.custom:minecraft.leave_game',
        dummy: 'dummy',
        trigger: 'trigger',
        deathCount: 'deathCount',
        playerKillCount: 'playerKillCount',
        totalKillCount: 'totalKillCount',
        health: 'health',
        xp: 'xp',
        level: 'level',
        food: 'food',
        armor: 'armor'
    };

    const ns = datapackData.namespace;
    let leaderboardLoadContent = '';
    let leaderboardTickContent = '';
    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        if (!func || typeof func === 'string') return;
        if (func.triggerType === 'leaderboard') {
            const presetId = func.leaderboardPreset || 'dummy';
            const displayName = func.leaderboardDisplayName || '我的榜单';
            const slot = func.leaderboardSlot || 'sidebar';
            const color = func.leaderboardColor || 'white';
            const isCustom = presetId === '__custom__';
            const criteria = isCustom ? (func.leaderboardCustomCriteria || 'dummy') : (LEADERBOARD_CRITERIA[presetId] || 'dummy');

            leaderboardLoadContent += `\n# 创建榜单：${func.name || funcId}\n`;
            leaderboardLoadContent += `scoreboard objectives add ${funcId} ${criteria}\n`;
            leaderboardLoadContent += `scoreboard objectives modify ${funcId} displayname {"text":"${displayName}","color":"${color}"}\n`;
            leaderboardLoadContent += `scoreboard objectives setdisplay ${slot} ${funcId}\n`;

            if (presetId === 'plane_movement') {
                leaderboardLoadContent += `# 移动榜：创建各移动类型统计记分板\n`;
                const moveTypes = [
                    'walk_one_cm', 'sprint_one_cm', 'swim_one_cm', 'fly_one_cm',
                    'aviate_one_cm', 'crouch_one_cm', 'climb_one_cm', 'boat_one_cm',
                    'horse_one_cm', 'minecart_one_cm', 'pig_one_cm', 'strider_one_cm',
                    'walk_on_water_one_cm', 'walk_under_water_one_cm'
                ];
                moveTypes.forEach(type => {
                    leaderboardLoadContent += `scoreboard objectives add ${funcId}_${type} minecraft.custom:minecraft.${type}\n`;
                });
                leaderboardLoadContent += `scoreboard objectives add ${funcId}_cm dummy\n`;
                leaderboardLoadContent += `scoreboard objectives add ${funcId}_m dummy\n`;
                leaderboardLoadContent += `scoreboard objectives add const100 dummy\n`;
                leaderboardLoadContent += `scoreboard players set #const const100 100\n`;

                leaderboardTickContent += `\n# 移动榜追踪：${func.name || funcId}\n`;
                leaderboardTickContent += `# 重置cm\n`;
                leaderboardTickContent += `execute as @a run scoreboard players set @s ${funcId}_cm 0\n`;
                moveTypes.forEach(type => {
                    leaderboardTickContent += `execute as @a run scoreboard players operation @s ${funcId}_cm += @s ${funcId}_${type}\n`;
                });
                leaderboardTickContent += `# 转换为米（cm/100）\n`;
                leaderboardTickContent += `execute as @a run scoreboard players operation @s ${funcId}_m = @s ${funcId}_cm\n`;
                leaderboardTickContent += `execute as @a run scoreboard players operation @s ${funcId}_m /= #const const100\n`;
                leaderboardTickContent += `# 更新榜单\n`;
                leaderboardTickContent += `execute as @a run scoreboard players operation @s ${funcId} = @s ${funcId}_m\n`;
            }
        }
    });
    const hasLeaderboard = leaderboardLoadContent.length > 0;

    if (recipeUnlockLoad || recipeRemovalLoad || intervalLoadContent || eventLoadContent || areaResult.load || hasRandomCall || hasLeaderboard) {
        let loadCommands = '';
        if (recipeRemovalLoad) loadCommands += recipeRemovalLoad;
        if (recipeUnlockLoad) loadCommands += recipeUnlockLoad;
        if (intervalLoadContent) loadCommands += intervalLoadContent;
        if (eventLoadContent) loadCommands += eventLoadContent;
        if (areaResult.load) loadCommands += '\n' + areaResult.load;
        if (hasRandomCall) loadCommands += '\nscoreboard objectives add rng_random dummy';
        if (hasLeaderboard) {
            loadCommands += '\n# ===== 榜单创建 =====' + leaderboardLoadContent;
        }
        if (updatedFunctions.load) {
            updatedFunctions.load = updatedFunctions.load + '\n' + loadCommands;
        } else {
            updatedFunctions.load = loadCommands;
        }
    }
    if (recipeUnlockTick || recipeRemovalTick || intervalTickContent || eventTickContent || areaResult.tick || leaderboardTickContent) {
        let tickCommands = '';
        if (recipeRemovalTick) tickCommands += recipeRemovalTick;
        if (recipeUnlockTick) tickCommands += recipeUnlockTick;
        if (intervalTickContent) tickCommands += intervalTickContent;
        if (eventTickContent) tickCommands += eventTickContent;
        if (areaResult.tick) tickCommands += '\n' + areaResult.tick;
        if (leaderboardTickContent) tickCommands += '\n# ===== 移动榜追踪 =====' + leaderboardTickContent;
        if (updatedFunctions.tick) {
            updatedFunctions.tick = updatedFunctions.tick + '\n' + tickCommands;
        } else {
            updatedFunctions.tick = tickCommands;
        }
    }

    const datapack = {
        'pack.mcmeta': packMeta,
        'data': {}
    };

    datapack.data[datapackData.namespace] = {
        'function': updatedFunctions,
        'advancement': allAdvancements,
        'loot_table': generateLootTables(),
        'recipe': generateRecipes()
    };

    const minecraftData = {
        'tags': {
            'function': {
                'load.json': { values: [datapackData.namespace + ':load'] },
                'tick.json': { values: [datapackData.namespace + ':tick'] }
            }
        }
    };

    // 添加覆盖原版战利品表
    let overrideTables;
    try {
        overrideTables = await generateOverrideLootTables();
    } catch (e) {
        console.warn('[原版战利品表加载失败，仅使用自定义掉落]', e);
        overrideTables = { blocks: {}, chests: {}, entities: {} };
    }
    const lootTableOverrides = {};
    if (Object.keys(overrideTables.blocks).length > 0) {
        lootTableOverrides['blocks'] = overrideTables.blocks;
    }
    if (Object.keys(overrideTables.chests).length > 0) {
        lootTableOverrides['chests'] = overrideTables.chests;
    }
    if (Object.keys(overrideTables.entities).length > 0) {
        lootTableOverrides['entities'] = overrideTables.entities;
    }
    if (Object.keys(lootTableOverrides).length > 0) {
        minecraftData['loot_table'] = lootTableOverrides;
    }

    // 添加覆写原版配方（不可合成配方覆盖，效果比命令更彻底）
    const disabledRecipes = generateDisabledRecipes();
    if (Object.keys(disabledRecipes).length > 0) {
        minecraftData['recipe'] = disabledRecipes;
    }

    datapack.data['minecraft'] = minecraftData;

    downloadDatapackZip(datapack, updatedFunctions, allAdvancements, overrideTables);
}

// 生成进度JSON
export function generateAdvancements() {
    const advs = {};
    Object.keys(datapackData.advancements).forEach(advId => {
        const adv = datapackData.advancements[advId];
        const advJson = {};

        // 父进度
        if (adv.parent) {
            if (adv.parent.startsWith('minecraft:')) {
                advJson.parent = adv.parent;
            } else {
                advJson.parent = datapackData.namespace + ':' + adv.parent;
            }
        }

        // 显示设置
        if (adv.title || adv.name) {
            const display = {
                title: { text: adv.title || adv.name },
                description: { text: adv.description || '' },
                icon: { id: adv.icon || 'minecraft:diamond' },
                frame: adv.frame || 'task',
                show_toast: true,
                announce_to_chat: adv.broadcast !== 'false',
                hidden: false
            };
            if (adv.background && !adv.parent) {
                display.background = adv.background;
            }
            advJson.display = display;
        }

        // 触发条件
        const trigger = adv.trigger || 'inventory_changed';
        advJson.criteria = {};
        const criteriaKey = advId + '_triggered';

        switch (trigger) {
            case 'inventory_changed':
                advJson.criteria[criteriaKey] = buildItemTrigger(trigger, adv);
                break;

            case 'fishing_rod_hooked':
                advJson.criteria[criteriaKey] = buildFishingTrigger(adv);
                break;

            case 'consume_item':
                advJson.criteria[criteriaKey] = buildConsumeTrigger(adv);
                break;

            case 'brewed_potion':
                advJson.criteria[criteriaKey] = buildPotionTrigger(adv);
                break;

            case 'enchanted_item':
                advJson.criteria[criteriaKey] = buildEnchantedTrigger(adv);
                break;

            case 'filled_bucket':
                advJson.criteria[criteriaKey] = buildBucketTrigger(adv);
                break;

            case 'player_killed_entity':
                advJson.criteria[criteriaKey] = buildEntityKillTrigger(adv);
                break;

            case 'entity_killed_player':
                advJson.criteria[criteriaKey] = buildPlayerDeathTrigger(adv);
                break;

            case 'tame_animal':
                advJson.criteria[criteriaKey] = buildTameTrigger(adv);
                break;

            case 'placed_block':
                advJson.criteria[criteriaKey] = buildBlockTrigger(trigger, adv);
                break;

            case 'location':
                advJson.criteria[criteriaKey] = buildLocationTrigger(adv);
                break;

            case 'changed_dimension':
                advJson.criteria[criteriaKey] = buildDimensionTrigger(adv);
                break;

            case 'recipe_unlocked':
                buildRecipeUnlockedCriteria(advJson, criteriaKey, adv);
                break;

            case 'recipe_crafted':
                buildRecipeCraftedCriteria(advJson, criteriaKey, adv);
                break;

            case 'slept_in_bed':
                advJson.criteria[criteriaKey] = {
                    trigger: 'minecraft:slept_in_bed'
                };
                break;

            case 'cured_zombie_villager':
                advJson.criteria[criteriaKey] = {
                    trigger: 'minecraft:cured_zombie_villager'
                };
                break;

            case 'villager_trade':
                advJson.criteria[criteriaKey] = buildTradeTrigger(adv);
                break;

            default:
                advJson.criteria[criteriaKey] = {
                    trigger: 'minecraft:' + trigger
                };
        }

        // 奖励
        if (adv.reward) {
            advJson.rewards = { function: adv.reward };
        }

        advs[advId] = advJson;
    });
    return advs;
}

function buildItemTrigger(trigger, adv) {
    const criterion = {
        trigger: 'minecraft:' + trigger
    };
    if (adv.triggerItem) {
        const itemValue = adv.triggerItem.startsWith('#') ? { tag: adv.triggerItem.slice(1) } : { items: [adv.triggerItem] };
        criterion.conditions = {
            items: [itemValue]
        };
    }
    return criterion;
}

function buildFishingTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:fishing_rod_hooked'
    };
    if (adv.triggerItem) {
        const itemValue = adv.triggerItem.startsWith('#') ? { tag: adv.triggerItem.slice(1) } : { items: [adv.triggerItem] };
        criterion.conditions = {
            item: itemValue
        };
    }
    return criterion;
}

function buildConsumeTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:consume_item'
    };
    if (adv.triggerItem) {
        const itemValue = adv.triggerItem.startsWith('#') ? { tag: adv.triggerItem.slice(1) } : { items: [adv.triggerItem] };
        criterion.conditions = {
            item: itemValue
        };
    }
    return criterion;
}

function buildPotionTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:brewed_potion'
    };
    if (adv.triggerItem) {
        criterion.conditions = {
            potion: adv.triggerItem
        };
    }
    return criterion;
}

function buildEnchantedTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:enchanted_item'
    };
    if (adv.triggerItem) {
        const itemValue = adv.triggerItem.startsWith('#') ? { tag: adv.triggerItem.slice(1) } : { items: [adv.triggerItem] };
        criterion.conditions = {
            item: itemValue
        };
    }
    return criterion;
}

function buildBucketTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:filled_bucket'
    };
    if (adv.triggerItem) {
        const itemValue = adv.triggerItem.startsWith('#') ? { tag: adv.triggerItem.slice(1) } : { items: [adv.triggerItem] };
        criterion.conditions = {
            item: itemValue
        };
    }
    return criterion;
}

function buildEntityKillTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:player_killed_entity'
    };
    if (adv.triggerEntity) {
        criterion.conditions = {
            entity: {
                type: adv.triggerEntity
            }
        };
    }
    return criterion;
}

function buildPlayerDeathTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:entity_killed_player'
    };
    if (adv.triggerEntity) {
        criterion.conditions = {
            entity: {
                type: adv.triggerEntity
            }
        };
    }
    return criterion;
}

function buildTameTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:tame_animal'
    };
    if (adv.triggerEntity) {
        criterion.conditions = {
            entity: {
                type: adv.triggerEntity
            }
        };
    }
    return criterion;
}

function buildBlockTrigger(trigger, adv) {
    const criterion = {
        trigger: 'minecraft:' + trigger
    };
    if (adv.triggerBlock) {
        criterion.conditions = {
            location: [
                {
                    condition: 'minecraft:location_check',
                    predicate: {
                        block: {
                            blocks: [adv.triggerBlock]
                        }
                    }
                }
            ]
        };
    }
    return criterion;
}

function buildLocationTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:location'
    };
    const location = {};

    if (adv.locationBiome) {
        location.biomes = [adv.locationBiome];
    }
    if (adv.locationStructure) {
        location.structures = [adv.locationStructure];
    }
    if (adv.locationDimension) {
        location.dimension = adv.locationDimension;
    }
    if (adv.locationUsePosition) {
        location.position = {
            x: adv.locationX || 0,
            y: adv.locationY || 0,
            z: adv.locationZ || 0
        };
    }

    if (Object.keys(location).length > 0) {
        criterion.conditions = { player: { location: location } };
    }
    return criterion;
}

function buildDimensionTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:changed_dimension'
    };
    const conditions = {};
    if (adv.dimensionFrom) {
        conditions.from = adv.dimensionFrom;
    }
    if (adv.dimensionTo) {
        conditions.to = adv.dimensionTo;
    }
    if (Object.keys(conditions).length > 0) {
        criterion.conditions = conditions;
    }
    return criterion;
}

function buildTradeTrigger(adv) {
    const criterion = {
        trigger: 'minecraft:villager_trade'
    };
    if (adv.triggerItem) {
        const itemValue = adv.triggerItem.startsWith('#') ? { tag: adv.triggerItem.slice(1) } : { items: [adv.triggerItem] };
        criterion.conditions = {
            item: itemValue
        };
    }
    return criterion;
}

function buildRecipeUnlockedCriteria(advJson, criteriaKey, adv) {
    const recipes = adv.triggerRecipe ? adv.triggerRecipe.split(',').filter(s => s.trim()) : [];
    if (recipes.length === 0) {
        advJson.criteria[criteriaKey] = { trigger: 'minecraft:recipe_unlocked' };
        return;
    }
    if (recipes.length === 1) {
        advJson.criteria[criteriaKey] = {
            trigger: 'minecraft:recipe_unlocked',
            conditions: { recipe: recipes[0] }
        };
        return;
    }
    const reqList = [];
    recipes.forEach((recipeId, idx) => {
        const key = criteriaKey + '_' + idx;
        advJson.criteria[key] = {
            trigger: 'minecraft:recipe_unlocked',
            conditions: { recipe: recipeId }
        };
        reqList.push(key);
    });
    advJson.requirements = [reqList];
}

function buildRecipeCraftedCriteria(advJson, criteriaKey, adv) {
    const recipes = adv.triggerRecipe ? adv.triggerRecipe.split(',').filter(s => s.trim()) : [];
    if (recipes.length === 0) {
        advJson.criteria[criteriaKey] = {
            trigger: 'minecraft:recipe_crafted'
        };
        return;
    }
    if (recipes.length === 1) {
        advJson.criteria[criteriaKey] = {
            trigger: 'minecraft:recipe_crafted',
            conditions: { recipe_id: recipes[0] }
        };
        return;
    }
    const reqList = [];
    recipes.forEach((recipeId, idx) => {
        const key = criteriaKey + '_' + idx;
        advJson.criteria[key] = {
            trigger: 'minecraft:recipe_crafted',
            conditions: { recipe_id: recipeId }
        };
        reqList.push(key);
    });
    advJson.requirements = [reqList];
}

// 生成战利品表JSON（仅返回自定义命名空间下的表）
export function generateLootTables() {
    const tables = {};
    Object.keys(datapackData.lootTables).forEach(lootId => {
        const loot = datapackData.lootTables[lootId];
        if (!isValidLootTable(loot)) return;
        const typeMapping = {
            'block': 'minecraft:block',
            'entity': 'minecraft:entity',
            'chest': 'minecraft:chest',
            'gameplay': 'minecraft:generic',
            'none': 'minecraft:generic',
            'fishing': 'minecraft:fishing',
            'empty': 'minecraft:empty',
            'generic': 'minecraft:generic'
        };

        // 判断是新格式（有 drops）还是旧格式（有 pools）
        const hasSimpleDrops = loot.drops && loot.drops.length > 0 && loot.drops.some(d => d.item);
        const hasOldPools = loot.pools && loot.pools.length > 0;

        let tablePools;
        if (hasSimpleDrops) {
            tablePools = buildSimplePool(loot.drops);
        } else if (hasOldPools) {
            tablePools = loot.pools.map(pool => buildPoolJson(pool));
        } else {
            tablePools = [];
        }

        const tableJson = {
            type: typeMapping[loot.type] || 'minecraft:block',
            pools: tablePools
        };

        tables[lootId] = tableJson;
    });
    return tables;
}

// 生成覆盖原版的战利品表
export async function generateOverrideLootTables() {
    const blockTables = {};     // minecraft/loot_table/blocks/
    const chestTables = {};     // minecraft/loot_table/chests/
    const entityTables = {};    // minecraft/loot_table/entities/
    const gameplayTables = {};  // minecraft/loot_table/gameplay/
    
    const lootIds = Object.keys(datapackData.lootTables);
    for (const lootId of lootIds) {
        const loot = datapackData.lootTables[lootId];
        if (!isValidLootTable(loot)) continue;
        
        if (loot.type === 'block') {
            const targets = loot.targets || loot.overrideBlocks || [];
            for (const targetId of targets) {
                const blockName = targetId.split('/').pop();
                
                if (loot.coexist) {
                    const vanillaPools = await ensureVanillaDataLoaded('block', targetId);
                    blockTables[blockName] = {
                        type: 'minecraft:block',
                        pools: [
                            ...(vanillaPools || []),
                            ...buildSimplePool(loot.drops)
                        ],
                        random_sequence: targetId
                    };
                } else {
                    blockTables[blockName] = {
                        type: 'minecraft:block',
                        pools: [
                            {
                                rolls: 1,
                                entries: [
                                    {
                                        type: 'minecraft:alternatives',
                                        children: [
                                            {
                                                type: 'minecraft:item',
                                                conditions: [
                                                    {
                                                        condition: 'minecraft:match_tool',
                                                        predicate: {
                                                            predicates: {
                                                                'minecraft:enchantments': [
                                                                    {
                                                                        enchantments: 'minecraft:silk_touch',
                                                                        levels: { min: 1 }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                ],
                                                name: 'minecraft:' + blockName
                                            },
                                            {
                                                type: 'minecraft:loot_table',
                                                conditions: [
                                                    {
                                                        condition: 'minecraft:survives_explosion'
                                                    }
                                                ],
                                                value: datapackData.namespace + ':' + lootId
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        random_sequence: targetId
                    };
                }
            }
        } else if (loot.type === 'chest') {
            const targets = loot.targets || [];
            for (const targetId of targets) {
                const chestPrefix = 'minecraft:chests/';
                const chestName = targetId.startsWith(chestPrefix) ? targetId.slice(chestPrefix.length) : targetId.split('/').pop();
                
                if (loot.coexist) {
                    const vanillaPools = await ensureVanillaDataLoaded('chest', targetId);
                    chestTables[chestName] = {
                        type: 'minecraft:chest',
                        pools: [
                            ...(vanillaPools || []),
                            ...buildSimplePool(loot.drops)
                        ],
                        random_sequence: targetId
                    };
                } else {
                    chestTables[chestName] = {
                        type: 'minecraft:chest',
                        pools: [
                            {
                                rolls: 1,
                                entries: [
                                    {
                                        type: 'minecraft:loot_table',
                                        value: datapackData.namespace + ':' + lootId
                                    }
                                ]
                            }
                        ],
                        random_sequence: targetId
                    };
                }
            }
        } else if (loot.type === 'entity') {
            const entityTarget = loot.entityTarget;
            if (entityTarget) {
                const entityIds = entityTarget.split(',').map(s => s.trim()).filter(s => s);
                for (const singleTarget of entityIds) {
                    const entityName = singleTarget.split(':').pop();

                    if (loot.coexist) {
                         const vanillaPools = await ensureVanillaDataLoaded('entity', singleTarget);
                         entityTables[entityName] = {
                             type: 'minecraft:entity',
                             pools: [
                                 ...(vanillaPools || []),
                                 ...buildSimplePool(loot.drops)
                             ]
                         };
                    } else {
                        entityTables[entityName] = {
                            type: 'minecraft:entity',
                            pools: [
                                {
                                    rolls: 1,
                                    entries: [
                                        {
                                            type: 'minecraft:loot_table',
                                            value: datapackData.namespace + ':' + lootId
                                        }
                                    ]
                                }
                            ]
                        };
                    }
                }
            }
        } else if (loot.type === 'gameplay') {
            const targets = loot.targets || [];
            for (const targetId of targets) {
                const gameplayPrefix = 'minecraft:gameplay/';
                const gameplayPath = targetId.startsWith(gameplayPrefix) ? targetId.slice(gameplayPrefix.length) : targetId;
                const gameplayName = gameplayPath.replace(/\//g, '_');
                
                if (loot.coexist) {
                    const vanillaPools = await ensureVanillaDataLoaded('gameplay', targetId);
                    gameplayTables[gameplayPath] = {
                        type: 'minecraft:generic',
                        pools: [
                            ...(vanillaPools || []),
                            ...buildSimplePool(loot.drops)
                        ],
                        random_sequence: targetId
                    };
                } else {
                    gameplayTables[gameplayPath] = {
                        type: 'minecraft:generic',
                        pools: [
                            {
                                rolls: 1,
                                entries: [
                                    {
                                        type: 'minecraft:loot_table',
                                        value: datapackData.namespace + ':' + lootId
                                    }
                                ]
                            }
                        ],
                        random_sequence: targetId
                    };
                }
            }
        }
    }
    
    return { blocks: blockTables, chests: chestTables, entities: entityTables, gameplay: gameplayTables };
}

// 从简化掉落格式构建物品池（每个物品独立概率，互不影响）
function buildSimplePool(drops) {
    return drops.map(drop => {
        const entry = {
            type: 'minecraft:item',
            name: drop.item || 'minecraft:stone'
        };

        const functions = [];

        if (drop.minCount !== undefined || drop.maxCount !== undefined) {
            const min = drop.minCount || 1;
            const max = drop.maxCount || min;
            if (min === max) {
                functions.push({ function: 'minecraft:set_count', count: min });
            } else {
                functions.push({
                    function: 'minecraft:set_count',
                    count: { min: min, max: max, type: 'minecraft:uniform' }
                });
            }
        }

        if (drop.enchantType === 'random') {
            if (drop.allowIncompatible) {
                const enchLevel = drop.exceedVanilla ? 
                    (drop.enchantMax || 10) : 
                    1;
                PRESET_ENCHANTMENTS.forEach(e => {
                    const chance = drop.multiEnchant ? 0.3 : 0.018;
                    const level = drop.exceedVanilla ? 
                        (Math.floor(Math.random() * (drop.enchantMax - drop.enchantMin + 1)) + (drop.enchantMin || 1)) :
                        enchLevel;
                    functions.push({
                        function: 'minecraft:set_enchantments',
                        enchantments: { [e.id]: Math.min(level, 255) },
                        add: true,
                        conditions: [
                            {
                                condition: 'minecraft:random_chance',
                                chance: chance
                            }
                        ]
                    });
                });
            } else if (drop.multiEnchant) {
                for (let i = 0; i < (drop.multiEnchantMax || 3); i++) {
                    const enchFn = { function: 'minecraft:enchant_randomly' };
                    if (drop.treasure) {
                        enchFn.treasure = true;
                    }
                    functions.push(enchFn);
                }
            } else {
                const enchFn = { function: 'minecraft:enchant_randomly' };
                if (drop.treasure) {
                    enchFn.treasure = true;
                }
                functions.push(enchFn);
            }
        } else if (drop.enchantType === 'custom' && drop.customEnchants && drop.customEnchants.length > 0) {
            const enchants = {};
            drop.customEnchants.forEach(e => {
                enchants[e.id] = Math.min(e.level || 1, 255);
            });
            const enchFn = {
                function: 'minecraft:set_enchantments',
                enchantments: enchants,
                add: true
            };
            functions.push(enchFn);
        }

        if (drop.potionIds && drop.potionIds.length > 0) {
            const customEffects = [];
            drop.potionIds.forEach(ef => {
                const potionId = typeof ef === 'string' ? ef : ef.id;
                const level = typeof ef === 'string' ? 1 : (ef.level || 1);
                const durationSec = typeof ef === 'string' ? 30 : (ef.duration || 30);

                // 处理特殊药水（如乌龟大师 -> 缓慢+抗性提升）
                if (POTION_MULTI_EFFECT[potionId]) {
                    POTION_MULTI_EFFECT[potionId].forEach(effectId => {
                        customEffects.push({
                            id: effectId,
                            amplifier: Math.max(0, level - 1),
                            duration: durationSec * 20
                        });
                    });
                    return;
                }

                const effectId = POTION_TO_EFFECT_ID[potionId] || potionId;
                customEffects.push({
                    id: effectId,
                    amplifier: Math.max(0, level - 1),
                    duration: durationSec * 20
                });
            });

            functions.push({
                function: 'minecraft:set_components',
                components: {
                    'minecraft:potion_contents': {
                        custom_effects: customEffects
                    }
                }
            });
        }

        if (functions.length > 0) {
            entry.functions = functions;
        }

        const pool = {
            rolls: 1,
            entries: [entry]
        };

        const chance = (drop.weight || 100) / 100;
        if (chance < 1) {
            pool.conditions = [
                {
                    condition: 'minecraft:random_chance',
                    chance: chance
                }
            ];
        }

        return pool;
    });
}

function buildPoolJson(pool) {
    const poolJson = {};

    if (pool.rolls) {
        if (pool.rolls.min !== undefined && pool.rolls.max !== undefined) {
            if (pool.rolls.min === pool.rolls.max) {
                poolJson.rolls = pool.rolls.min;
            } else {
                poolJson.rolls = {
                    min: pool.rolls.min,
                    max: pool.rolls.max,
                    type: 'minecraft:uniform'
                };
            }
        } else {
            poolJson.rolls = 1;
        }
    } else {
        poolJson.rolls = 1;
    }

    if (pool.bonus_rolls) {
        poolJson.bonus_rolls = pool.bonus_rolls;
    }

    if (pool.conditions && pool.conditions.length > 0) {
        poolJson.conditions = pool.conditions.map(c => buildConditionJson(c));
    }

    if (pool.entries && pool.entries.length > 0) {
        poolJson.entries = pool.entries.map(e => buildEntryJson(e));
    } else {
        poolJson.entries = [{ type: 'minecraft:empty' }];
    }

    return poolJson;
}

function buildEntryJson(entry) {
    if (entry.entryType === 'loot_table') {
        return {
            type: 'minecraft:loot_table',
            name: entry.value || 'minecraft:blocks/dirt',
            weight: entry.weight || 1,
            quality: entry.quality || 0
        };
    }

    if (entry.entryType === 'empty') {
        return {
            type: 'minecraft:empty',
            weight: entry.weight || 1
        };
    }

    if (entry.entryType === 'alternatives') {
        return {
            type: 'minecraft:alternatives',
            children: (entry.children || []).map(c => buildEntryJson(c))
        };
    }

    const entryJson = {
        type: 'minecraft:item',
        name: entry.item || 'minecraft:stone',
        weight: entry.weight || 1,
        quality: entry.quality || 0
    };

    const functions = buildEntryFunctions(entry);
    if (functions.length > 0) {
        entryJson.functions = functions;
    }

    const conditions = buildEntryConditions(entry);
    if (conditions.length > 0) {
        entryJson.conditions = conditions;
    }

    return entryJson;
}

function buildEntryFunctions(entry) {
    const functions = [];
    if (!entry.functions) return functions;

    entry.functions.forEach(fn => {
        const fnJson = { function: 'minecraft:' + fn.function };
        const p = fn.params || {};

        switch (fn.function) {
            case 'set_count':
                if (p.min !== undefined && p.max !== undefined) {
                    if (p.min === p.max) {
                        fnJson.count = p.min;
                    } else {
                        fnJson.count = { min: p.min, max: p.max, type: 'minecraft:uniform' };
                    }
                } else {
                    fnJson.count = 1;
                }
                break;

            case 'enchant_randomly':
                if (p.treasure !== undefined) {
                    fnJson.treasure = p.treasure;
                }
                break;

            case 'set_potion':
                fnJson.id = p.potion_id || 'minecraft:night_vision';
                break;

            case 'set_damage':
                if (p.min !== undefined && p.max !== undefined) {
                    fnJson.damage = { min: p.min, max: p.max, type: 'minecraft:uniform' };
                } else {
                    fnJson.damage = 0;
                }
                break;

            default:
                if (Object.keys(p).length > 0) {
                    Object.assign(fnJson, p);
                }
        }

        functions.push(fnJson);
    });

    return functions;
}

function buildEntryConditions(entry) {
    const conditions = [];
    if (!entry.conditions) return conditions;

    entry.conditions.forEach(cond => {
        const condJson = buildConditionJson(cond);
        if (condJson) conditions.push(condJson);
    });

    return conditions;
}

function buildConditionJson(cond) {
    if (!cond || !cond.type) return null;

    const p = cond.params || {};

    switch (cond.type) {
        case 'survives_explosion':
            return { condition: 'minecraft:survives_explosion' };

        case 'random_chance':
            return {
                condition: 'minecraft:random_chance',
                chance: p.chance || 0.5
            };

        case 'random_chance_with_looting':
            return {
                condition: 'minecraft:random_chance_with_looting',
                chance: p.chance || 0.5,
                looting_multiplier: p.looting_multiplier || 0.01
            };

        case 'table_bonus':
            return {
                condition: 'minecraft:table_bonus',
                enchantment: p.enchantment || 'minecraft:fortune',
                chances: p.chances || [0.05, 0.0625, 0.083333336, 0.1]
            };

        case 'match_tool':
            return {
                condition: 'minecraft:match_tool',
                predicate: p.tool_predicate || { items: 'minecraft:shears' }
            };

        case 'killed_by_player':
            return { condition: 'minecraft:killed_by_player' };

        case 'entity_properties':
            return {
                condition: 'minecraft:entity_properties',
                entity: p.entity || 'this',
                predicate: p.predicate || {}
            };

        case 'weather_check':
            const weatherCond = { condition: 'minecraft:weather_check' };
            if (p.raining !== undefined) weatherCond.raining = p.raining;
            if (p.thundering !== undefined) weatherCond.thundering = p.thundering;
            return weatherCond;

        case 'location_check':
            return {
                condition: 'minecraft:location_check',
                predicate: p.predicate || {}
            };

        case 'inverted':
            return {
                condition: 'minecraft:inverted',
                term: p.term || { condition: 'minecraft:survives_explosion' }
            };

        case 'any_of':
            return {
                condition: 'minecraft:any_of',
                terms: p.terms || [{ condition: 'minecraft:survives_explosion' }]
            };

        case 'all_of':
            return {
                condition: 'minecraft:all_of',
                terms: p.terms || [{ condition: 'minecraft:survives_explosion' }]
            };

        default:
            return { condition: 'minecraft:' + cond.type };
    }
}

function isValidRecipe(recipe) {
    return recipe && recipe.result && recipe.result.trim() !== '';
}

function isValidLootTable(loot) {
    if (!loot) return false;
    const hasSimpleDrops = loot.drops && loot.drops.length > 0 && loot.drops.some(d => d.item);
    const hasOldPools = loot.pools && loot.pools.length > 0 && loot.pools.some(pool => pool.entries && pool.entries.length > 0);
    return hasSimpleDrops || hasOldPools;
}

// 构建结果物品的 components 对象（Minecraft 1.21+ 格式）
function buildResultComponents(resultComponents) {
    if (!resultComponents || Object.keys(resultComponents).length === 0) return null;

    const components = {};

    if (resultComponents.customName) {
        components['minecraft:custom_name'] = resultComponents.customName;
    }

    if (resultComponents.lore && Array.isArray(resultComponents.lore) && resultComponents.lore.length > 0) {
        components['minecraft:lore'] = resultComponents.lore;
    }

    if (resultComponents.customData) {
        components['minecraft:custom_data'] = resultComponents.customData;
    }

    if (resultComponents.glint) {
        components['minecraft:enchantment_glint_override'] = true;
    }

    if (resultComponents.enchantments && Array.isArray(resultComponents.enchantments) && resultComponents.enchantments.length > 0) {
        const levels = {};
        resultComponents.enchantments.forEach(e => {
            levels[e.id] = e.level;
        });
        components['minecraft:enchantments'] = {
            levels: levels
        };
    }

    return Object.keys(components).length > 0 ? components : null;
}

// 构建配方结果对象（包含可选的 components）
function buildRecipeResult(recipe, subtype) {
    const count = subtype === 'stonecutting'
        ? (recipe.stonecuttingCount || 1)
        : (recipe.count || 1);

    const result = {
        id: recipe.result,
        count: count
    };

    const comps = buildResultComponents(recipe.resultComponents);
    if (comps) {
        result.components = comps;
    }

    return result;
}

// 生成配方JSON
export function generateRecipes() {
    const recipes = {};
    Object.keys(datapackData.recipes).forEach(recipeId => {
        const recipe = datapackData.recipes[recipeId];
        if (!isValidRecipe(recipe)) return;

        if (recipe.type === 'crafting_shaped') {
            const pattern = [];
            const key = {};
            let keyIndex = 97;
            const keyMap = {};

            recipe.pattern.forEach(row => {
                let rowStr = '';
                row.forEach(cell => {
                    if (cell) {
                        if (!keyMap[cell]) {
                            const keyChar = String.fromCharCode(keyIndex);
                            keyMap[cell] = keyChar;
                            key[keyChar] = { item: cell };
                            keyIndex++;
                        }
                        rowStr += keyMap[cell];
                    } else {
                        rowStr += ' ';
                    }
                });
                pattern.push(rowStr);
            });

            recipes[recipeId] = {
                type: 'minecraft:crafting_shaped',
                category: recipe.category || 'misc',
                group: recipe.group || '',
                show_notification: recipe.showNotification !== false,
                pattern: pattern,
                key: key,
                result: buildRecipeResult(recipe)
            };
        } else if (recipe.type === 'crafting_shapeless') {
            const ingredients = [];
            recipe.pattern.forEach(row => {
                row.forEach(cell => {
                    if (cell) {
                        ingredients.push({ item: cell });
                    }
                });
            });

            recipes[recipeId] = {
                type: 'minecraft:crafting_shapeless',
                category: recipe.category || 'misc',
                group: recipe.group || '',
                show_notification: recipe.showNotification !== false,
                ingredients: ingredients,
                result: buildRecipeResult(recipe)
            };
        } else if (['smelting', 'blasting', 'smoking', 'campfire_cooking'].includes(recipe.type)) {
            recipes[recipeId] = {
                type: 'minecraft:' + recipe.type,
                category: recipe.category || 'misc',
                group: recipe.group || '',
                show_notification: recipe.showNotification !== false,
                ingredient: { item: recipe.input },
                result: buildRecipeResult(recipe),
                experience: recipe.xp || 0,
                cookingtime: recipe.cookingTime || 200
            };
        } else if (recipe.type === 'stonecutting') {
            recipes[recipeId] = {
                type: 'minecraft:stonecutting',
                category: recipe.category || 'misc',
                show_notification: recipe.showNotification !== false,
                ingredient: { item: recipe.input },
                result: buildRecipeResult(recipe, 'stonecutting')
            };
        } else if (recipe.type === 'smithing_transform') {
            recipes[recipeId] = {
                type: 'minecraft:smithing_transform',
                category: recipe.category || 'misc',
                show_notification: recipe.showNotification !== false,
                template: { item: recipe.template },
                base: { item: recipe.base },
                addition: { item: recipe.addition },
                result: buildRecipeResult(recipe)
            };
        }
    });
    return recipes;
}

// 生成配方解锁进度
export function generateRecipeUnlockAdvancements() {
    const advancements = {};
    Object.keys(datapackData.recipes).forEach(recipeId => {
        const recipe = datapackData.recipes[recipeId];
        if (!isValidRecipe(recipe)) return;
        if (recipe.unlockType === 'material') {
            const ingredients = getRecipeIngredients(recipe);
            if (ingredients.length > 0) {
                advancements[recipeId + '_unlock'] = {
                    criteria: {
                        obtain_ingredient: {
                            trigger: 'minecraft:inventory_changed',
                            conditions: {
                                items: ingredients.map(item => ({ items: [item] }))
                            }
                        }
                    },
                    rewards: {
                        function: datapackData.namespace + ':unlock_recipe_' + recipeId
                    }
                };
            }
        }
    });
    return advancements;
}

// 生成配方解锁函数（用于 material 模式，进度奖励调用）
export function generateRecipeUnlockFunctions() {
    const functions = {};
    Object.keys(datapackData.recipes).forEach(recipeId => {
        const recipe = datapackData.recipes[recipeId];
        if (!isValidRecipe(recipe)) return;
        if (recipe.unlockType === 'material') {
            const recipeKey = datapackData.namespace + ':' + recipeId;
            functions['unlock_recipe_' + recipeId] = 'recipe give @s ' + recipeKey + '\n';
        }
    });
    return functions;
}

// 生成配方解锁load函数
export function generateRecipeUnlockLoad() {
    let loadContent = '';
    Object.keys(datapackData.recipes).forEach(recipeId => {
        const recipe = datapackData.recipes[recipeId];
        if (!isValidRecipe(recipe)) return;
        if (recipe.unlockType === 'immediate') {
            const recipeKey = datapackData.namespace + ':' + recipeId;
            loadContent += 'recipe give @a ' + recipeKey + '\n';
            loadContent += 'tag @a add recipe_unlocked_' + recipeId + '\n';
        }
    });
    return loadContent;
}

// 生成配方解锁tick函数
export function generateRecipeUnlockTick() {
    let tickContent = '';
    Object.keys(datapackData.recipes).forEach(recipeId => {
        const recipe = datapackData.recipes[recipeId];
        if (!isValidRecipe(recipe)) return;
        if (recipe.unlockType === 'immediate') {
            const recipeKey = datapackData.namespace + ':' + recipeId;
            tickContent += 'recipe give @a[tag=!recipe_unlocked_' + recipeId + '] ' + recipeKey + '\n';
            tickContent += 'tag @a[tag=!recipe_unlocked_' + recipeId + '] add recipe_unlocked_' + recipeId + '\n';
        }
    });
    return tickContent;
}

// 生成原版配方移除load命令
export function generateRecipeRemovalLoad() {
    const excluded = datapackData.excludedVanillaRecipes || [];
    if (excluded.length === 0) return '';
    let content = '# ===== 移除原版配方 =====\n';
    excluded.forEach(recipeId => {
        content += 'recipe take @a minecraft:' + recipeId + '\n';
        content += 'tag @a add vr_removed_' + recipeId + '\n';
    });
    return content;
}

// 生成原版配方移除tick命令（对新玩家生效）
export function generateRecipeRemovalTick() {
    const excluded = datapackData.excludedVanillaRecipes || [];
    if (excluded.length === 0) return '';
    let content = '# ===== 为新玩家移除原版配方 =====\n';
    excluded.forEach(recipeId => {
        content += 'recipe take @a[tag=!vr_removed_' + recipeId + '] minecraft:' + recipeId + '\n';
        content += 'tag @a[tag=!vr_removed_' + recipeId + '] add vr_removed_' + recipeId + '\n';
    });
    return content;
}

// 生成不可合成的覆写配方（覆盖原版配方文件，使其在游戏中彻底消失）
export function generateDisabledRecipes() {
    const excluded = datapackData.excludedVanillaRecipes || [];
    const recipes = {};
    excluded.forEach(recipeId => {
        recipes[recipeId] = {
            type: 'minecraft:crafting_shapeless',
            ingredients: [
                { item: 'minecraft:barrier' }
            ],
            result: {
                id: 'minecraft:barrier',
                count: 1
            }
        };
    });
    return recipes;
}

function getRecipeIngredients(recipe) {
    const ingredients = [];
    if (recipe.type === 'crafting_shaped' || recipe.type === 'crafting_shapeless') {
        if (recipe.pattern) {
            recipe.pattern.forEach(row => {
                row.forEach(cell => {
                    if (cell && !ingredients.includes(cell)) {
                        ingredients.push(cell);
                    }
                });
            });
        }
    } else if (['smelting', 'blasting', 'smoking', 'campfire_cooking', 'stonecutting'].includes(recipe.type)) {
        if (recipe.input && !ingredients.includes(recipe.input)) {
            ingredients.push(recipe.input);
        }
    } else if (recipe.type === 'smithing_transform') {
        if (recipe.template && !ingredients.includes(recipe.template)) {
            ingredients.push(recipe.template);
        }
        if (recipe.base && !ingredients.includes(recipe.base)) {
            ingredients.push(recipe.base);
        }
        if (recipe.addition && !ingredients.includes(recipe.addition)) {
            ingredients.push(recipe.addition);
        }
    }
    return ingredients;
}

// 下载数据包ZIP
export function downloadDatapackZip(datapack, updatedFunctions, allAdvancements, overrideTables) {
    if (typeof JSZip === 'undefined') {
        showNotification('JSZip库未加载，请检查网络连接。', 'error');
        return;
    }
    
    const zip = new JSZip();
    const packName = (datapackData.name || 'datapack').replace(/[^a-zA-Z0-9_\-]/g, '_');
    
    // 添加 pack.mcmeta
    zip.file('pack.mcmeta', JSON.stringify({
        pack: {
            pack_format: datapackData.format,
            description: datapackData.description || "A custom datapack",
            supported_formats: {
                min_inclusive: 11,
                max_inclusive: datapackData.format
            }
        }
    }, null, 2));
    
    // 添加函数文件
    Object.keys(updatedFunctions).forEach(funcId => {
        zip.file('data/' + datapackData.namespace + '/function/' + funcId + '.mcfunction', updatedFunctions[funcId]);
    });
    
    // 添加进度文件
    Object.keys(allAdvancements).forEach(advId => {
        zip.file('data/' + datapackData.namespace + '/advancement/' + advId + '.json', JSON.stringify(allAdvancements[advId], null, 2));
    });
    
    // 添加自定义命名空间下的战利品表文件
    const lootTables = generateLootTables();
    Object.keys(lootTables).forEach(lootId => {
        zip.file('data/' + datapackData.namespace + '/loot_table/' + lootId + '.json', JSON.stringify(lootTables[lootId], null, 2));
    });

    // 添加覆盖原版战利品表文件（放在 minecraft 命名空间下）
    const override = overrideTables || { blocks: {}, chests: {}, entities: {}, gameplay: {} };
    Object.keys(override.blocks).forEach(blockName => {
        zip.file('data/minecraft/loot_table/blocks/' + blockName + '.json', JSON.stringify(override.blocks[blockName], null, 2));
    });
    Object.keys(override.chests).forEach(chestName => {
        zip.file('data/minecraft/loot_table/chests/' + chestName + '.json', JSON.stringify(override.chests[chestName], null, 2));
    });
    Object.keys(override.entities).forEach(entityName => {
        zip.file('data/minecraft/loot_table/entities/' + entityName + '.json', JSON.stringify(override.entities[entityName], null, 2));
    });
    Object.keys(override.gameplay).forEach(gameplayPath => {
        zip.file('data/minecraft/loot_table/gameplay/' + gameplayPath + '.json', JSON.stringify(override.gameplay[gameplayPath], null, 2));
    });
    
    // 添加配方文件
    const recipes = generateRecipes();
    Object.keys(recipes).forEach(recipeId => {
        zip.file('data/' + datapackData.namespace + '/recipe/' + recipeId + '.json', JSON.stringify(recipes[recipeId], null, 2));
    });
    
    
    // 添加 minecraft 标签
    zip.file('data/minecraft/tags/function/load.json', JSON.stringify({ values: [datapackData.namespace + ':load'] }, null, 2));
    zip.file('data/minecraft/tags/function/tick.json', JSON.stringify({ values: [datapackData.namespace + ':tick'] }, null, 2));
    
    // 添加覆写原版配方文件（覆盖原版配方，使其在游戏中彻底消失）
    const disabledRecipes = generateDisabledRecipes();
    Object.keys(disabledRecipes).forEach(recipeId => {
        zip.file('data/minecraft/recipe/' + recipeId + '.json', JSON.stringify(disabledRecipes[recipeId], null, 2));
    });

    // 添加数据包图标 pack.png
    if (datapackData.packImage) {
        const base64Data = datapackData.packImage.split(',')[1];
        if (base64Data) {
            zip.file('pack.png', base64Data, { base64: true });
        }
    }

    // 生成并下载 ZIP
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        if (typeof saveAs !== 'undefined') {
            saveAs(content, packName + '.zip');
        } else {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = packName + '.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        showNotification('数据包ZIP已导出！', 'success');
    }).catch(function(error) {
        showNotification('ZIP导出失败：' + error.message, 'error');
    });
}



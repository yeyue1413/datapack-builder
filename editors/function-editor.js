import { datapackData } from '../data/data-core.js';
import { showNotification } from '../utils.js';
import { PRESET_ENTITIES } from '../data/data-entities.js';
import { getInviconHtml } from '../invicon-map.js';
import { PRESET_ITEMS } from '../data/data-items.js';
import { EVENT_EXTRA_CONFIG, EVENT_WIKI_DESC, TICK_DETECT_EVENTS } from '../export.js';
import { PRESET_CHEST_LOOT_TABLES } from '../data/data-loot.js';
import { vanillaRecipes } from './recipe-editor.js';

const PRESET_EFFECTS = [
    { name: '迅捷', id: 'minecraft:speed' },
    { name: '缓慢', id: 'minecraft:slowness' },
    { name: '急迫', id: 'minecraft:haste' },
    { name: '挖掘疲劳', id: 'minecraft:mining_fatigue' },
    { name: '力量', id: 'minecraft:strength' },
    { name: '瞬间治疗', id: 'minecraft:instant_health' },
    { name: '瞬间伤害', id: 'minecraft:instant_damage' },
    { name: '跳跃提升', id: 'minecraft:jump_boost' },
    { name: '反胃', id: 'minecraft:nausea' },
    { name: '生命恢复', id: 'minecraft:regeneration' },
    { name: '抗性提升', id: 'minecraft:resistance' },
    { name: '抗火', id: 'minecraft:fire_resistance' },
    { name: '水下呼吸', id: 'minecraft:water_breathing' },
    { name: '隐身', id: 'minecraft:invisibility' },
    { name: '失明', id: 'minecraft:blindness' },
    { name: '夜视', id: 'minecraft:night_vision' },
    { name: '饥饿', id: 'minecraft:hunger' },
    { name: '虚弱', id: 'minecraft:weakness' },
    { name: '中毒', id: 'minecraft:poison' },
    { name: '凋零', id: 'minecraft:wither' },
    { name: '生命提升', id: 'minecraft:health_boost' },
    { name: '伤害吸收', id: 'minecraft:absorption' },
    { name: '饱和', id: 'minecraft:saturation' },
    { name: '发光', id: 'minecraft:glowing' },
    { name: '飘浮', id: 'minecraft:levitation' },
    { name: '幸运', id: 'minecraft:luck' },
    { name: '霉运', id: 'minecraft:unluck' },
    { name: '缓降', id: 'minecraft:slow_falling' },
    { name: '潮涌能量', id: 'minecraft:conduit_power' },
    { name: '海豚的恩惠', id: 'minecraft:dolphins_grace' },
    { name: '不祥之兆', id: 'minecraft:bad_omen' },
    { name: '村庄英雄', id: 'minecraft:hero_of_the_village' },
    { name: '黑暗', id: 'minecraft:darkness' },
    { name: '试炼之兆', id: 'minecraft:trial_omen' },
    { name: '蓄风', id: 'minecraft:wind_charged' },
    { name: '盘丝', id: 'minecraft:weaving' },
    { name: '渗浆', id: 'minecraft:oozing' },
    { name: '寄生', id: 'minecraft:infested' },
    { name: '袭击之兆', id: 'minecraft:raid_omen' }
];

const PRESET_SOUNDS = [
    { id: 'minecraft:entity.ender_dragon.growl', name: '末影龙咆哮', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.wither.spawn', name: '凋灵生成', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.ghast.scream', name: '恶魂尖叫', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:block.portal.trigger', name: '传送门激活', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.creeper.primed', name: '苦力怕点燃', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:block.anvil.destroy', name: '铁砧破坏', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.villager.celebrate', name: '村民庆祝', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.cat.ambient', name: '猫叫', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.wolf.growl', name: '狼低吼', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:block.note_block.pling', name: '音符盒高音', volume: 1.0, pitch: 2.0 },
    { id: 'minecraft:entity.experience_orb.pickup', name: '经验拾取', volume: 1.0, pitch: 0.5 },
    { id: 'minecraft:block.glass.break', name: '玻璃破碎', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.firework_rocket.blast', name: '烟花爆炸', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.zombie.ambient', name: '僵尸叫声', volume: 1.0, pitch: 0.8 },
    { id: 'minecraft:entity.enderman.teleport', name: '末影人传送', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:block.beacon.activate', name: '信标激活', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.horse.gallop', name: '马奔跑', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.pig.ambient', name: '猪叫', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:block.lava.pop', name: '熔岩爆裂', volume: 1.0, pitch: 1.0 },
    { id: 'minecraft:entity.player.levelup', name: '玩家升级', volume: 1.0, pitch: 1.0 }
];

// ===== 动作类型定义 =====
const ACTION_TYPES = {
    spawn_mob: {
        label: '生成生物',
        getCommands: (params, target) => {
            const cmds = [];
            if (params.mode === 'random') {
                const count = params.count || 1;
                const mobs = params.randomMobs && params.randomMobs.length > 0
                    ? params.randomMobs
                    : ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'];
                if (!window._randomMobCounter) window._randomMobCounter = {};
                const funcId = document.getElementById('func-id')?.value || 'unknown';
                if (!window._randomMobCounter[funcId]) window._randomMobCounter[funcId] = 0;
                window._randomMobCounter[funcId]++;
                const counter = window._randomMobCounter[funcId];
                cmds.push(`# 随机生成生物（${count}个）`);
                cmds.push(`execute store result score @s func_rnd_${counter} run random value 1..${mobs.length * count}`);
                const target2 = target || '@s';
                for (let i = 1; i <= mobs.length * count; i++) {
                    const mobIndex = Math.min(Math.ceil(i / count), mobs.length) - 1;
                    cmds.push(`execute at ${target2}[scores={func_rnd_${counter}=${i}}] run summon ${mobs[mobIndex]}`);
                }
            } else {
                const mob = params.specificMob || 'zombie';
                const count = params.count || 1;
                const target2 = target || '@s';
                for (let i = 0; i < count; i++) {
                    cmds.push(`execute at ${target2} run summon ${mob}`);
                }
            }
            return cmds;
        },
        params: [
            { id: 'mode', label: '生成模式', type: 'select', options: [
                { value: 'random', label: '随机生物' },
                { value: 'specific', label: '指定生物' }
            ], default: 'random' },
            { id: 'count', label: '数量', type: 'number', default: 1, min: 1, max: 100, showIf: { mode: ['random', 'specific'] } },
            { id: 'specificMob', label: '选择生物', type: 'mob', default: 'minecraft:zombie', showIf: { mode: ['specific'] } },
            { id: 'randomMobs', label: '可选生物列表', type: 'mob-list', default: ['minecraft:zombie', 'minecraft:skeleton', 'minecraft:creeper'], showIf: { mode: ['random'] } }
        ]
    },
    give_item: {
        label: '给予物品',
        getCommands: (params, target) => {
            const item = params.item || 'minecraft:diamond';
            const count = params.count || 1;
            const target2 = target || '@s';
            return [`give ${target2} ${item} ${count}`];
        },
        params: [
            { id: 'item', label: '选择物品', type: 'item', default: 'minecraft:diamond' },
            { id: 'count', label: '数量', type: 'number', default: 1, min: 1, max: 999 }
        ]
    },
    apply_effect: {
        label: '应用效果',
        getCommands: (params, target) => {
            const effects = params.effects || [];
            const target2 = target || '@s';
            const cmds = [];
            if (params.mode === 'random') {
                if (effects.length === 0) return [];
                const funcId = document.getElementById('func-id')?.value || 'unknown';
                if (!window._randomEffectCounter) window._randomEffectCounter = {};
                if (!window._randomEffectCounter[funcId]) window._randomEffectCounter[funcId] = 0;
                window._randomEffectCounter[funcId]++;
                const counter = window._randomEffectCounter[funcId];
                cmds.push(`# 随机应用效果（从${effects.length}个效果中选1个）`);
                cmds.push(`execute store result score @s func_rnd_ef_${counter} run random value 1..${effects.length}`);
                effects.forEach((ef, idx) => {
                    const num = idx + 1;
                    const effectId = ef.id || 'minecraft:speed';
                    const amplifier = ef.level || 1;
                    const duration = ef.duration || 30;
                    cmds.push(`execute if score @s func_rnd_ef_${counter} matches ${num} run effect give ${target2} ${effectId} ${duration} ${amplifier}`);
                });
            } else {
                effects.forEach(ef => {
                    const effectId = ef.id || 'minecraft:speed';
                    const amplifier = ef.level || 1;
                    const duration = ef.duration || 30;
                    cmds.push(`effect give ${target2} ${effectId} ${duration} ${amplifier}`);
                });
            }
            return cmds;
        },
        params: [
            { id: 'mode', label: '效果模式', type: 'select', options: [
                { value: 'specific', label: '指定效果（应用所有选中的效果）' },
                { value: 'random', label: '随机效果（从列表中随机选一个）' }
            ], default: 'specific' },
            { id: 'effects', label: '选择效果（可多选，自定义等级与时长）', type: 'effect-list', default: [] }
        ]
    },
    send_message: {
        label: '发送消息',
        getCommands: (params, target) => {
            const msg = params.message || '你好！';
            const msgType = params.messageType || 'tellraw';
            const target2 = target || '@a';
            if (msgType === 'title') {
                return [`title ${target2} title {"text":"${msg}"}`];
            } else if (msgType === 'actionbar') {
                return [`title ${target2} actionbar {"text":"${msg}"}`];
            } else {
                return [`tellraw ${target2} [{"text":"${msg}"}]`];
            }
        },
        params: [
            { id: 'messageType', label: '消息类型', type: 'select', options: [
                { value: 'tellraw', label: '聊天消息' },
                { value: 'title', label: '标题' },
                { value: 'actionbar', label: '快捷栏上方' }
            ], default: 'tellraw' },
            { id: 'message', label: '消息内容', type: 'text', default: '你好！' }
        ]
    },
    clear_inventory: {
        label: '清除背包',
        getCommands: (params, target) => {
            const target2 = target || '@s';
            return [`clear ${target2}`];
        },
        params: []
    },
    custom_command: {
        label: '自定义命令',
        getCommands: (params) => {
            return params.command ? [params.command] : [];
        },
        params: [
            { id: 'command', label: '输入Minecraft命令', type: 'textarea', default: '', placeholder: '例如: give @s minecraft:diamond 1' }
        ]
    },
    random_teleport: {
        label: '随机传送',
        getCommands: (params, target) => {
            const range = params.range || 10;
            const center = params.center || '~ ~ ~';
            const target2 = target || '@s';
            return [`spreadplayers ${center.replace(/~ ?/g, '').split(' ')[0] || '0'} ${center.replace(/~ ?/g, '').split(' ')[1] || '0'} 0 ${range} false ${target2}`];
        },
        params: [
            { id: 'range', label: '传送范围（格）', type: 'number', default: 10, min: 1, max: 100000 },
            { id: 'center', label: '中心坐标（x z）', type: 'text', default: '~ ~', placeholder: '例如: 100 200 或 ~ ~' }
        ]
    },
    set_block: {
        label: '放置方块',
        getCommands: (params, target) => {
            const block = params.block || 'minecraft:stone';
            const pos = params.position || '~ ~1 ~';
            const mode = params.mode || 'replace';
            return [`setblock ${pos} ${block} ${mode}`];
        },
        params: [
            { id: 'block', label: '选择方块', type: 'item', default: 'minecraft:stone' },
            { id: 'position', label: '坐标位置', type: 'text', default: '~ ~1 ~', placeholder: '例如: ~ ~1 ~ 或 100 64 200' },
            { id: 'mode', label: '放置模式', type: 'select', options: [
                { value: 'replace', label: '替换' },
                { value: 'destroy', label: '破坏并放置' },
                { value: 'keep', label: '仅空气处放置' }
            ], default: 'replace' }
        ]
    },
    playsound: {
        label: '播放声音',
        getCommands: (params, target) => {
            const sound = params.sound || 'minecraft:entity.experience_orb.pickup';
            const volume = params.volume || 1;
            const pitch = params.pitch || 1;
            const target2 = target || '@a';
            const pos = params.position || '~ ~ ~';
            return [`playsound ${sound} master ${target2} ${pos} ${volume} ${pitch}`];
        },
        params: [
            { id: 'sound', label: '声音ID', type: 'sound', default: 'minecraft:entity.experience_orb.pickup', placeholder: '例如: minecraft:entity.player.levelup' },
            { id: 'volume', label: '音量', type: 'number', default: 1, min: 0, max: 100, step: 0.1 },
            { id: 'pitch', label: '音调', type: 'number', default: 1, min: 0, max: 100, step: 0.1 },
            { id: 'position', label: '播放位置', type: 'text', default: '~ ~ ~', placeholder: '~ ~ ~' }
        ]
    },
    xp_operation: {
        label: '经验操作',
        getCommands: (params, target) => {
            const mode = params.mode || 'add';
            const amount = params.amount || 10;
            const operation = params.operationType || 'points';
            const target2 = target || '@s';
            if (mode === 'add') {
                if (operation === 'levels') {
                    return [`xp add ${target2} ${amount} levels`];
                }
                return [`xp add ${target2} ${amount} points`];
            } else {
                if (operation === 'levels') {
                    return [`xp set ${target2} ${amount} levels`];
                }
                return [`xp set ${target2} ${amount} points`];
            }
        },
        params: [
            { id: 'mode', label: '操作方式', type: 'select', options: [
                { value: 'add', label: '增加' },
                { value: 'set', label: '设置' }
            ], default: 'add' },
            { id: 'operationType', label: '类型', type: 'select', options: [
                { value: 'points', label: '经验值' },
                { value: 'levels', label: '经验等级' }
            ], default: 'points' },
            { id: 'amount', label: '数量', type: 'number', default: 10, min: 0, max: 999999 }
        ]
    },
    random_call: {
        label: '随机调用函数',
        getCommands: (params, target) => {
            const functions = params.functions || [];
            const target2 = target || '@s';
            if (functions.length === 0) return [];
            const count = functions.length;
            const cmds = [];
            cmds.push(`# 从 ${count} 个函数中随机选择一个`);
            const rngId = 'rng_' + Math.random().toString(36).substr(2, 5);
            cmds.push(`execute store result score $${rngId} rng_random run random value 1..${count}`);
            functions.forEach((func, idx) => {
                const num = idx + 1;
                cmds.push(`execute if score $${rngId} rng_random matches ${num} as ${target2} run function ${func}`);
            });
            return cmds;
        },
        params: [
            { id: 'functions', label: '可选函数列表', type: 'function-list', default: [], placeholder: '输入函数路径 (例如: my_namespace:func1)' }
        ]
    },
    give_loot: {
        label: '给予战利品',
        getCommands: (params, target) => {
            const lootTable = params.lootTable || '';
            const target2 = target || '@s';
            if (!lootTable) return [];
            return [`loot give ${target2} loot ${lootTable}`];
        },
        params: [
            { id: 'lootTable', label: '选择战利品表', type: 'loot-table', default: '' }
        ]
    }
};

// ===== 动作代码生成 =====
function generateActionsCode(actions, target) {
    const lines = [];
    actions.forEach((action, idx) => {
        const typeDef = ACTION_TYPES[action.type];
        if (!typeDef) return;
        const cmds = typeDef.getCommands(action.params, target);
        if (cmds.length > 0) {
            if (idx > 0 || true) {
                lines.push('');
            }
            lines.push(...cmds);
        }
    });
    return lines.join('\n');
}

const PRESET_LEADERBOARDS = {
    walk_distance: { criteria: 'minecraft.custom:minecraft.walk_one_cm', displayName: '行走距离', color: 'white' },
    sprint_distance: { criteria: 'minecraft.custom:minecraft.sprint_one_cm', displayName: '疾跑距离', color: 'blue' },
    swim_distance: { criteria: 'minecraft.custom:minecraft.swim_one_cm', displayName: '游泳距离', color: 'dark_aqua' },
    fly_distance: { criteria: 'minecraft.custom:minecraft.fly_one_cm', displayName: '飞行距离', color: 'aqua' },
    aviate_distance: { criteria: 'minecraft.custom:minecraft.aviate_one_cm', displayName: '鞘翅飞行', color: 'light_purple' },
    crouch_distance: { criteria: 'minecraft.custom:minecraft.crouch_one_cm', displayName: '潜行距离', color: 'gray' },
    climb_distance: { criteria: 'minecraft.custom:minecraft.climb_one_cm', displayName: '攀爬距离', color: 'dark_green' },
    boat_distance: { criteria: 'minecraft.custom:minecraft.boat_one_cm', displayName: '划船距离', color: 'blue' },
    horse_distance: { criteria: 'minecraft.custom:minecraft.horse_one_cm', displayName: '骑马距离', color: 'brown' },
    minecart_distance: { criteria: 'minecraft.custom:minecraft.minecart_one_cm', displayName: '矿车距离', color: 'dark_gray' },
    pig_distance: { criteria: 'minecraft.custom:minecraft.pig_one_cm', displayName: '骑猪距离', color: 'red' },
    strider_distance: { criteria: 'minecraft.custom:minecraft.strider_one_cm', displayName: '骑炽足兽', color: 'gold' },
    walk_on_water_distance: { criteria: 'minecraft.custom:minecraft.walk_on_water_one_cm', displayName: '水面行走', color: 'dark_aqua' },
    walk_under_water_distance: { criteria: 'minecraft.custom:minecraft.walk_under_water_one_cm', displayName: '水下行走', color: 'dark_blue' },
    fall_distance: { criteria: 'minecraft.custom:minecraft.fall_one_cm', displayName: '坠落距离', color: 'dark_red' },
    plane_movement: { criteria: 'dummy', displayName: '移动榜', color: 'green' },
    mob_kills: { criteria: 'minecraft.custom:minecraft.mob_kills', displayName: '击杀生物', color: 'red' },
    player_kills: { criteria: 'minecraft.custom:minecraft.player_kills', displayName: '玩家击杀', color: 'dark_red' },
    damage_taken: { criteria: 'minecraft.custom:minecraft.damage_taken', displayName: '承受伤害', color: 'dark_red' },
    damage_dealt: { criteria: 'minecraft.custom:minecraft.damage_dealt', displayName: '造成伤害', color: 'gold' },
    deaths: { criteria: 'minecraft.custom:minecraft.deaths', displayName: '死亡次数', color: 'dark_gray' },
    target_hit: { criteria: 'minecraft.custom:minecraft.target_hit', displayName: '击中标靶', color: 'gold' },
    play_time: { criteria: 'minecraft.custom:minecraft.play_time', displayName: '活跃时间', color: 'green' },
    jumps: { criteria: 'minecraft.custom:minecraft.jump', displayName: '跳跃次数', color: 'yellow' },
    fish_caught: { criteria: 'minecraft.custom:minecraft.fish_caught', displayName: '钓鱼数量', color: 'blue' },
    traded_with_villager: { criteria: 'minecraft.custom:minecraft.traded_with_villager', displayName: '村民交易', color: 'gold' },
    enchant_item: { criteria: 'minecraft.custom:minecraft.enchant_item', displayName: '附魔次数', color: 'light_purple' },
    animals_bred: { criteria: 'minecraft.custom:minecraft.animals_bred', displayName: '繁殖动物', color: 'gold' },
    sleep_in_bed: { criteria: 'minecraft.custom:minecraft.sleep_in_bed', displayName: '入眠次数', color: 'blue' },
    bell_ring: { criteria: 'minecraft.custom:minecraft.bell_ring', displayName: '鸣钟次数', color: 'gold' },
    play_record: { criteria: 'minecraft.custom:minecraft.play_record', displayName: '播放唱片', color: 'light_purple' },
    open_chest: { criteria: 'minecraft.custom:minecraft.open_chest', displayName: '打开箱子', color: 'dark_aqua' },
    raid_win: { criteria: 'minecraft.custom:minecraft.raid_win', displayName: '袭击胜利', color: 'red' },
    sneak_time: { criteria: 'minecraft.custom:minecraft.sneak_time', displayName: '潜行时间', color: 'gray' },
    drop_count: { criteria: 'minecraft.custom:minecraft.drop', displayName: '丢弃物品', color: 'dark_gray' },
    leave_game: { criteria: 'minecraft.custom:minecraft.leave_game', displayName: '退出游戏', color: 'gray' },
    dummy: { criteria: 'dummy', displayName: '虚拟型', color: 'white' },
    trigger: { criteria: 'trigger', displayName: '触发器', color: 'white' },
    deathCount: { criteria: 'deathCount', displayName: '死亡次数', color: 'dark_red' },
    playerKillCount: { criteria: 'playerKillCount', displayName: '击杀玩家', color: 'red' },
    totalKillCount: { criteria: 'totalKillCount', displayName: '击杀生物', color: 'red' },
    health: { criteria: 'health', displayName: '生命值', color: 'red' },
    xp: { criteria: 'xp', displayName: '经验值', color: 'green' },
    level: { criteria: 'level', displayName: '等级', color: 'aqua' },
    food: { criteria: 'food', displayName: '饥饿值', color: 'gold' },
    armor: { criteria: 'armor', displayName: '护甲值', color: 'gray' }
};

function getLeaderboardPresetInfo(presetId) {
    return PRESET_LEADERBOARDS[presetId] || null;
}

function generateLeaderboardCommands(funcId, presetId, displayName, slot, color, customCriteria) {
    const lines = [];
    const objectiveId = funcId || 'leaderboard';
    const preset = getLeaderboardPresetInfo(presetId);
    let actualCriteria = customCriteria || (preset ? preset.criteria : 'dummy');

    lines.push(`# 榜单：${displayName}`);
    lines.push(`# 创建记分项`);

    if (presetId === 'plane_movement') {
        const moveTypes = [
            'walk_one_cm', 'sprint_one_cm', 'swim_one_cm', 'fly_one_cm',
            'aviate_one_cm', 'crouch_one_cm', 'climb_one_cm', 'boat_one_cm',
            'horse_one_cm', 'minecart_one_cm', 'pig_one_cm', 'strider_one_cm',
            'walk_on_water_one_cm', 'walk_under_water_one_cm'
        ];
        lines.push(`scoreboard objectives add ${objectiveId} dummy`);
        moveTypes.forEach(type => {
            lines.push(`scoreboard objectives add ${objectiveId}_${type} minecraft.custom:minecraft.${type}`);
        });
        lines.push(`scoreboard objectives add ${objectiveId}_cm dummy`);
        lines.push(`scoreboard objectives add ${objectiveId}_m dummy`);
        lines.push(`scoreboard objectives add const100 dummy`);
        lines.push(`scoreboard players set #const const100 100`);
    } else {
        lines.push(`scoreboard objectives add ${objectiveId} ${actualCriteria}`);
    }

    lines.push('');
    lines.push(`# 设置显示名称`);
    let nameColor = color || (preset ? preset.color : 'white');
    lines.push(`scoreboard objectives modify ${objectiveId} displayname {"text":"${displayName}","color":"${nameColor}"}`);

    lines.push('');
    lines.push(`# 设置显示位置`);
    lines.push(`scoreboard objectives setdisplay ${slot} ${objectiveId}`);

    return lines;
}

function getDefaultActions(triggerType, eventType) {
    if (triggerType === 'load') {
        return [{
            type: 'send_message',
            params: { messageType: 'tellraw', message: '数据包已加载' }
        }];
    }
    if (triggerType === 'event') {
        const eventMessages = {
            // 玩家行为
            jump: '你跳跃了！',
            hurt: '你受伤了！',
            death: '你死亡了！',
            kill_entity: '你击杀了实体！',
            place_block: '你放置了方块！',
            use_item: '你使用了物品！',
            consume_item: '你消耗了物品！',
            fish: '钓鱼成功！',
            sleep: '你睡觉了！',
            trade_villager: '交易成功！',
            sneak: '你开始潜行了！',
            dimension_change: '维度已切换！',
            enchant_item: '你附魔了物品！',
            brew_potion: '你酿造了药水！',
            tame_animal: '你驯服了动物！'
        };
        return [{
            type: 'send_message',
            params: { messageType: 'tellraw', message: eventMessages[eventType] || '事件触发了！' }
        }];
    }
    if (triggerType === 'interval') {
        return [{
            type: 'send_message',
            params: { messageType: 'tellraw', message: '定时触发了！' }
        }];
    }
    if (triggerType === 'health_check') {
        return [{
            type: 'send_message',
            params: { messageType: 'tellraw', message: '血量条件触发！' }
        }];
    }
    if (triggerType === 'leaderboard') {
        return [];
    }
    return [];
}

// ===== 生成完整函数内容 =====
function generateFunctionContent(funcName, triggerType, eventType, interval, actions, target, funcId) {
    const lines = [];
    lines.push(`# ${funcName}`);
    const triggerLabels = {
        load: '数据包加载时执行',
        tick: '每游戏刻循环执行',
        interval: `每${interval}秒触发一次`,
        manual: '手动调用',
        event: `事件触发（${eventType}）`,
        health_check: '血量检测触发',
        area_detect: '区域检测触发',
        leaderboard: '榜单创建'
    };
    lines.push(`# ${triggerLabels[triggerType] || '触发'}`);

    if (triggerType === 'leaderboard') {
        lines.push('');
        if (!funcId) {
            funcId = document.getElementById('func-id')?.value || 'leaderboard';
        }
        const presetId = document.getElementById('func-leaderboard-preset')?.value || 'dummy';
        const displayName = document.getElementById('func-leaderboard-displayname')?.value || '我的榜单';
        const slot = document.getElementById('func-leaderboard-slot')?.value || 'sidebar';
        const color = document.getElementById('func-leaderboard-color')?.value || 'white';
        const isCustom = presetId === '__custom__';
        const customCriteria = isCustom ? (document.getElementById('func-leaderboard-custom-criteria-input')?.value || '') : '';
        const leaderboardLines = generateLeaderboardCommands(funcId, presetId, displayName, slot, color, customCriteria);
        lines.push(leaderboardLines.join('\n'));
        return lines.join('\n');
    }

    lines.push('');
    const actionLines = generateActionsCode(actions, target);
    lines.push(actionLines);

    return lines.join('\n');
}

// ===== UI渲染 =====
function renderActionConfig(action, index) {
    const typeDef = ACTION_TYPES[action.type];
    if (!typeDef) return '';

    let paramsHtml = '';
    typeDef.params.forEach(param => {
        const value = action.params[param.id] !== undefined ? action.params[param.id] : param.default;
        const showIfAttr = param.showIf ? ` data-showif='${JSON.stringify(param.showIf)}'` : '';

        if (param.type === 'select') {
            const options = param.options.map(opt =>
                `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
            ).join('');
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <select data-param-id="${param.id}" data-action-index="${index}">${options}</select>
            </div>`;
        } else if (param.type === 'number') {
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <input type="number" value="${value}" min="${param.min || 0}" max="${param.max || 9999}" data-param-id="${param.id}" data-action-index="${index}">
            </div>`;
        } else if (param.type === 'text') {
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <input type="text" value="${value}" data-param-id="${param.id}" data-action-index="${index}">
            </div>`;
        } else if (param.type === 'textarea') {
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <textarea rows="2" data-param-id="${param.id}" data-action-index="${index}">${value}</textarea>
            </div>`;
        } else if (param.type === 'item') {
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <div class="item-input-group">
                    <input type="text" value="${value}" class="item-input" data-param-id="${param.id}" data-action-index="${index}" placeholder="minecraft:diamond">
                    <button type="button" class="btn-select-item" data-action-index="${index}" data-param-id="${param.id}">选择</button>
                </div>
            </div>`;
        } else if (param.type === 'sound') {
            const soundPreset = PRESET_SOUNDS.find(s => s.id === value);
            const soundHint = soundPreset ? `当前预设: ${soundPreset.name}` : '';
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <div class="item-input-group">
                    <input type="text" value="${value}" class="sound-input" data-param-id="${param.id}" data-action-index="${index}" placeholder="minecraft:entity.player.levelup">
                    <button type="button" class="btn-select-sound" data-action-index="${index}" data-param-id="${param.id}">预设</button>
                </div>
                <span class="field-hint" style="font-size:11px;color:#94a3b8;">${soundHint || '直接输入声音ID，或点击"预设"从20种混乱声音中选择'}</span>
            </div>`;
        } else if (param.type === 'effect-list') {
            const effectList = Array.isArray(value) ? value : [];
            const tags = effectList.map(ef => {
                const eName = getEffectDisplayName(ef.id);
                const level = ef.level || 1;
                const duration = ef.duration || 30;
                return `<span class="custom-enchant-tag">${eName} Lv.${level} ${duration}秒<span class="effect-tag-remove" data-effect-id="${ef.id}" data-action-index="${index}">&times;</span></span>`;
            }).join('');
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <div class="mob-list-container">
                    <div class="mob-tags" data-param-id="${param.id}" data-action-index="${index}">${tags || '<span class="field-hint">暂未选择效果</span>'}</div>
                    <button type="button" class="btn-select-effects" data-action-index="${index}" data-param-id="${param.id}" style="margin-top:4px;">+ 选择效果</button>
                </div>
            </div>`;
        } else if (param.type === 'mob') {
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <div class="item-input-group">
                    <input type="text" value="${value}" data-param-id="${param.id}" data-action-index="${index}" placeholder="minecraft:zombie">
                    <button type="button" class="btn-select-mob" data-action-index="${index}" data-param-id="${param.id}">选择</button>
                </div>
            </div>`;
        } else if (param.type === 'mob-list') {
            const mobList = Array.isArray(value) ? value : [value];
            const tags = mobList.map(m => `<span class="mob-tag" data-mob="${m}">${m.split(':').pop()}<span class="mob-tag-remove" data-mob="${m}">×</span></span>`).join('');
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <div class="mob-list-container">
                    <div class="mob-tags" data-param-id="${param.id}" data-action-index="${index}">${tags}</div>
                    <div class="item-input-group" style="gap:6px;">
                        <button type="button" class="btn-select-mob" data-action-index="${index}" data-param-id="${param.id}" data-multiselect="true" style="flex:1;">从列表选择生物</button>
                    </div>
                    <div class="item-input-group" style="margin-top:4px;">
                        <input type="text" class="mob-add-input" placeholder="或手动输入ID回车添加" style="flex:1;">
                        <button type="button" class="btn-add-mob" data-action-index="${index}" data-param-id="${param.id}">添加</button>
                    </div>
                </div>
            </div>`;
        } else if (param.type === 'function-list') {
            const funcList = Array.isArray(value) ? value : [value];
            const tags = funcList.map(f => `<span class="mob-tag" data-func="${f}">${f.split(':').pop() || f}<span class="mob-tag-remove" data-func="${f}">×</span></span>`).join('');
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <div class="mob-list-container">
                    <div class="mob-tags" data-param-id="${param.id}" data-action-index="${index}">${tags}</div>
                    <div class="item-input-group" style="gap:6px;">
                        <button type="button" class="btn-select-saved-func" data-action-index="${index}" data-param-id="${param.id}" style="flex:1;">从已保存函数选择</button>
                    </div>
                    <div class="item-input-group" style="margin-top:4px;">
                        <input type="text" class="func-add-input" placeholder="输入函数路径回车添加 (my_ns:func)" style="flex:1;">
                        <button type="button" class="btn-add-func" data-action-index="${index}" data-param-id="${param.id}">添加</button>
                    </div>
                </div>
            </div>`;
        } else if (param.type === 'loot-table') {
            const lootName = value ? value.split(':').pop() || value : '';
            paramsHtml += `<div class="action-param" data-param="${param.id}"${showIfAttr}>
                <label>${param.label}</label>
                <div class="item-input-group">
                    <input type="text" value="${value}" class="loot-table-input" data-param-id="${param.id}" data-action-index="${index}" placeholder="选择无条件触发的战利品表" readonly>
                    <button type="button" class="btn-select-loot-table" data-action-index="${index}" data-param-id="${param.id}">选择</button>
                </div>
            </div>`;
        }
    });

    return `<div class="action-item" data-action-index="${index}">
        <div class="action-header">
            <span class="action-type-label">${typeDef.label}</span>
            <button type="button" class="action-remove" data-action-index="${index}" title="删除此动作">✕</button>
        </div>
        <div class="action-params">${paramsHtml}</div>
    </div>`;
}

function renderActionList(actions) {
    const container = document.getElementById('action-list');
    if (!container) return;
    container.innerHTML = '';
    actions.forEach((action, index) => {
        container.insertAdjacentHTML('beforeend', renderActionConfig(action, index));
    });
    bindActionEvents(actions);
    applyShowIfConditions(actions);
}

function applyShowIfConditions(actions) {
    document.querySelectorAll('.action-item').forEach((item, idx) => {
        const action = actions[idx];
        if (!action) return;
        item.querySelectorAll('.action-param').forEach(paramEl => {
            const showIfRaw = paramEl.getAttribute('data-showif');
            if (!showIfRaw) {
                paramEl.style.display = '';
                return;
            }
            try {
                const conditions = JSON.parse(showIfRaw);
                let visible = true;
                for (const [paramId, allowedValues] of Object.entries(conditions)) {
                    const currentVal = action.params[paramId];
                    visible = allowedValues.includes(currentVal);
                    if (!visible) break;
                }
                paramEl.style.display = visible ? '' : 'none';
            } catch (e) {
                paramEl.style.display = '';
            }
        });
    });
}

function bindActionEvents(actions) {
    // 移除动作
    document.querySelectorAll('.action-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.actionIndex);
            actions.splice(idx, 1);
            renderActionList(actions);
            updateGeneratedContent();
            showNotification('动作已删除', 'info');
        });
    });

    // 参数变更
    document.querySelectorAll('#action-list select, #action-list input, #action-list textarea').forEach(el => {
        el.addEventListener('change', function() {
            const idx = parseInt(this.dataset.actionIndex);
            const paramId = this.dataset.paramId;
            if (!isNaN(idx) && paramId && actions[idx]) {
                if (this.tagName === 'SELECT') {
                    actions[idx].params[paramId] = this.value;
                } else if (this.type === 'number') {
                    actions[idx].params[paramId] = parseInt(this.value) || 0;
                } else {
                    actions[idx].params[paramId] = this.value;
                }
                updateGeneratedContent();
                // 重新渲染以处理 showIf
                renderActionList(actions);
            }
        });
        // 实时输入
        if (el.tagName !== 'SELECT') {
            el.addEventListener('input', function() {
                const idx = parseInt(this.dataset.actionIndex);
                const paramId = this.dataset.paramId;
                if (!isNaN(idx) && paramId && actions[idx]) {
                    if (this.type === 'number') {
                        actions[idx].params[paramId] = parseInt(this.value) || 0;
                    } else {
                        actions[idx].params[paramId] = this.value;
                    }
                    updateGeneratedContent(false);
                }
            });
        }
    });

    // 物品选择
    document.querySelectorAll('.btn-select-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.item-input');
            if (input) {
                openItemSelector(input, (itemId) => {
                    input.value = itemId;
                    input.dispatchEvent(new Event('input'));
                });
            }
        });
    });

    // 声音预设选择
    document.querySelectorAll('.btn-select-sound').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.sound-input');
            if (input) {
                openSoundPresetSelector(input, (soundId, presetVol, presetPitch) => {
                    input.value = soundId;
                    input.dispatchEvent(new Event('input'));
                    // 自动填充音量与音调
                    const actionItem = input.closest('.action-item');
                    if (actionItem) {
                        const volInput = actionItem.querySelector('input[data-param-id="volume"]');
                        const pitchInput = actionItem.querySelector('input[data-param-id="pitch"]');
                        if (volInput && presetVol !== undefined) {
                            volInput.value = presetVol;
                            volInput.dispatchEvent(new Event('input'));
                        }
                        if (pitchInput && presetPitch !== undefined) {
                            pitchInput.value = presetPitch;
                            pitchInput.dispatchEvent(new Event('input'));
                        }
                    }
                });
            }
        });
    });

    // 生物选择（支持单/多选）
    document.querySelectorAll('.btn-select-mob').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input[type="text"]');
            const multiSelect = this.dataset.multiselect === 'true';
            if (multiSelect) {
                const idx = parseInt(this.dataset.actionIndex);
                const paramId = this.dataset.paramId;
                const list = actions[idx].params[paramId];
                openEntityListSelector(list, function() {
                    renderActionList(actions);
                    updateGeneratedContent();
                });
            } else if (input) {
                openMobSelector(input, (mobId) => {
                    input.value = mobId;
                    input.dispatchEvent(new Event('input'));
                });
            }
        });
    });

    // mob-list: 添加生物（通过弹窗选择）
    document.querySelectorAll('.btn-add-mob').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.actionIndex);
            const paramId = this.dataset.paramId;
            const list = actions[idx].params[paramId];
            openEntityListSelector(list, function() {
                renderActionList(actions);
                updateGeneratedContent();
            });
        });
    });
    document.querySelectorAll('.mob-add-input').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const idx = parseInt(this.closest('.action-param')?.querySelector('[data-action-index]')?.dataset.actionIndex || '0');
                const paramId = this.closest('.action-param')?.dataset.param;
                if (actions[idx] && paramId && this.value.trim()) {
                    const mobId = this.value.trim();
                    if (!actions[idx].params[paramId].includes(mobId)) {
                        actions[idx].params[paramId].push(mobId);
                    }
                    this.value = '';
                    renderActionList(actions);
                    updateGeneratedContent();
                }
            }
        });
    });
    // mob-list: 删除生物标签
    document.querySelectorAll('.mob-tag-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const mob = this.dataset.mob;
            const container = this.closest('.mob-tags');
            if (container) {
                const idx = parseInt(container.dataset.actionIndex);
                const paramId = container.dataset.paramId;
                const actionsList = window._currentActions;
                if (actionsList && actionsList[idx] && actionsList[idx].params[paramId]) {
                    const list = actionsList[idx].params[paramId];
                    const pos = list.indexOf(mob);
                    if (pos > -1) list.splice(pos, 1);
                    renderActionList(actionsList);
                    updateGeneratedContent();
                }
            }
        });
    });

    // function-list: 添加函数
    document.querySelectorAll('.btn-add-func').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.actionIndex);
            const paramId = this.dataset.paramId;
            const input = this.parentElement.querySelector('.func-add-input');
            const val = input ? input.value.trim() : '';
            if (val && window._currentActions[idx] && window._currentActions[idx].params[paramId]) {
                const list = window._currentActions[idx].params[paramId];
                if (!list.includes(val)) {
                    list.push(val);
                }
                input.value = '';
                renderActionList(window._currentActions);
                updateGeneratedContent();
            }
        });
    });
    document.querySelectorAll('.func-add-input').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const btn = this.parentElement.querySelector('.btn-add-func');
                if (btn) btn.click();
            }
        });
    });
    // function-list: 删除函数标签
    document.querySelectorAll('.mob-tag-remove[data-func]').forEach(btn => {
        btn.addEventListener('click', function() {
            const func = this.dataset.func;
            const container = this.closest('.mob-tags');
            if (container) {
                const idx = parseInt(container.dataset.actionIndex);
                const paramId = container.dataset.paramId;
                const actionsList = window._currentActions;
                if (actionsList && actionsList[idx] && actionsList[idx].params[paramId]) {
                    const list = actionsList[idx].params[paramId];
                    const pos = list.indexOf(func);
                    if (pos > -1) list.splice(pos, 1);
                    renderActionList(actionsList);
                    updateGeneratedContent();
                }
            }
        });
    });

    // 效果选择（多选+等级）
    document.querySelectorAll('.btn-select-effects').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.actionIndex);
            const paramId = this.dataset.paramId;
            if (actions[idx]) {
                const list = actions[idx].params[paramId] || [];
                openEffectSelectorModal(list, function() {
                    renderActionList(actions);
                    updateGeneratedContent();
                });
            }
        });
    });
    // 效果标签删除
    document.querySelectorAll('.effect-tag-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const effectId = this.dataset.effectId;
            const idx = parseInt(this.dataset.actionIndex);
            const paramId = this.closest('.mob-tags')?.dataset.paramId;
            if (actions[idx] && paramId) {
                const list = actions[idx].params[paramId] || [];
                const pos = list.findIndex(ef => ef.id === effectId);
                if (pos > -1) list.splice(pos, 1);
                renderActionList(actions);
                updateGeneratedContent();
            }
        });
    });

    // 已保存函数选择
    document.querySelectorAll('.btn-select-saved-func').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.actionIndex);
            const paramId = this.dataset.paramId;
            const list = actions[idx].params[paramId];
            openSavedFunctionSelector(list, function() {
                renderActionList(actions);
                updateGeneratedContent();
            });
        });
    });

    // 战利品表选择
    document.querySelectorAll('.btn-select-loot-table').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.actionIndex);
            const paramId = this.dataset.paramId;
            const input = this.parentElement.querySelector('.loot-table-input');
            if (input && actions[idx]) {
                const currentValue = actions[idx].params[paramId] || '';
                openLootTableSelector(currentValue, function(lootTableId) {
                    actions[idx].params[paramId] = lootTableId;
                    input.value = lootTableId;
                    updateGeneratedContent();
                });
            }
        });
    });
}

function openItemSelector(input, callback) {
    const currentValue = input.value;
    createItemSelectorModal(PRESET_ITEMS, currentValue, callback);
}

function openMobSelector(input, callback) {
    const currentValue = input.value;
    createEntitySelectorModal(PRESET_ENTITIES, currentValue, false, function(selected) {
        if (selected.length > 0) callback(selected[0]);
    });
}

function openEntityListSelector(existing, callback) {
    createEntitySelectorModal(PRESET_ENTITIES, '', true, function(selected) {
        selected.forEach(id => {
            if (!existing.includes(id)) {
                existing.push(id);
            }
        });
        callback();
    });
}

// ===== 通用物品选择弹窗 =====
function createItemSelectorModal(items, currentValue, callback) {
    const existing = document.getElementById('func-selector-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'func-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content">
            <span class="close-modal" onclick="document.getElementById('func-selector-modal').remove()">&times;</span>
            <div class="modal-header"><h3>选择物品</h3></div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="func-selector-search" placeholder="搜索物品...">
                </div>
                <div class="item-grid" id="func-selector-grid">
                    ${items.map(item => {
                        const iconHtml = getInviconHtml(item.id, item.name, 'item-icon') || `<span class="item-icon-placeholder">?</span>`;
                        const isSelected = item.id === currentValue;
                        return `<div class="item-option${isSelected ? ' selected' : ''}" data-id="${item.id}">
                            <span class="item-icon">${iconHtml}</span>
                            <span class="item-name">${item.name}</span>
                            <span class="item-id">${item.id}</span>
                        </div>`;
                    }).join('')}
                </div>
                <div class="custom-item-section" style="margin-top:12px;">
                    <div class="custom-item-divider"><span>或者手动输入自定义ID</span></div>
                    <div class="custom-item-input-group">
                        <input type="text" id="func-selector-custom" value="${currentValue}" placeholder="minecraft:diamond">
                        <button id="func-selector-custom-add" class="btn-custom-item">确认</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button id="func-selector-confirm" class="btn-primary">确认选择</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    let selectedId = currentValue || '';

    // 点选
    modal.querySelectorAll('.item-option').forEach(opt => {
        opt.addEventListener('click', function() {
            modal.querySelectorAll('.item-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedId = this.dataset.id;
        });
    });

    // 搜索
    const searchInput = modal.querySelector('#func-selector-search');
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        modal.querySelectorAll('.item-option').forEach(opt => {
            const id = opt.dataset.id.toLowerCase();
            const name = opt.querySelector('.item-name').textContent.toLowerCase();
            opt.style.display = id.includes(q) || name.includes(q) ? '' : 'none';
        });
    });

    // 自定义输入
    const customInput = modal.querySelector('#func-selector-custom');
    modal.querySelector('#func-selector-custom-add').addEventListener('click', function() {
        if (customInput.value.trim()) {
            selectedId = customInput.value.trim();
            modal.querySelectorAll('.item-option').forEach(o => o.classList.remove('selected'));
            callback(selectedId);
            modal.remove();
        }
    });
    customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            modal.querySelector('#func-selector-custom-add').click();
        }
    });

    // 确认
    modal.querySelector('#func-selector-confirm').addEventListener('click', function() {
        if (selectedId) {
            callback(selectedId);
            modal.remove();
        }
    });

    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

// ===== 声音预设选择弹窗 =====
function openSoundPresetSelector(input, callback) {
    const existing = document.getElementById('func-selector-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'func-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content">
            <span class="close-modal" onclick="document.getElementById('func-selector-modal').remove()">&times;</span>
            <div class="modal-header"><h3>选择声音预设（20种混乱声音）</h3></div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="func-selector-search" placeholder="搜索声音...">
                </div>
                <div class="item-grid" id="func-selector-grid">
                    ${PRESET_SOUNDS.map(sound => {
                        return `<div class="item-option" data-id="${sound.id}" data-volume="${sound.volume}" data-pitch="${sound.pitch}">
                            <span class="item-icon">🔊</span>
                            <span class="item-name">${sound.name}</span>
                            <span class="item-id">${sound.id}</span>
                        </div>`;
                    }).join('')}
                </div>
                <div class="custom-item-section" style="margin-top:12px;">
                    <div class="custom-item-divider"><span>或者手动输入自定义声音ID</span></div>
                    <div class="custom-item-input-group">
                        <input type="text" id="func-selector-custom" value="${input.value}" placeholder="minecraft:entity.player.levelup">
                        <button id="func-selector-custom-add" class="btn-custom-item">确认</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button id="func-selector-confirm" class="btn-primary">确认选择</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    let selectedId = input.value || '';
    let selectedVolume = 1;
    let selectedPitch = 1;

    modal.querySelectorAll('.item-option').forEach(opt => {
        opt.addEventListener('click', function() {
            modal.querySelectorAll('.item-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedId = this.dataset.id;
            selectedVolume = parseFloat(this.dataset.volume) || 1;
            selectedPitch = parseFloat(this.dataset.pitch) || 1;
        });
    });

    const searchInput = modal.querySelector('#func-selector-search');
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        modal.querySelectorAll('.item-option').forEach(opt => {
            const id = opt.dataset.id.toLowerCase();
            const name = opt.querySelector('.item-name').textContent.toLowerCase();
            opt.style.display = id.includes(q) || name.includes(q) ? '' : 'none';
        });
    });

    const customInput = modal.querySelector('#func-selector-custom');
    modal.querySelector('#func-selector-custom-add').addEventListener('click', function() {
        if (customInput.value.trim()) {
            selectedId = customInput.value.trim();
            modal.querySelectorAll('.item-option').forEach(o => o.classList.remove('selected'));
            callback(selectedId, 1, 1);
            modal.remove();
        }
    });
    customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            modal.querySelector('#func-selector-custom-add').click();
        }
    });

    modal.querySelector('#func-selector-confirm').addEventListener('click', function() {
        if (selectedId) {
            callback(selectedId, selectedVolume, selectedPitch);
            modal.remove();
        }
    });

    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

// ===== 通用实体选择弹窗 =====
function createEntitySelectorModal(entities, currentValue, multiSelect, callback) {
    const existing = document.getElementById('func-selector-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'func-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content">
            <span class="close-modal" onclick="document.getElementById('func-selector-modal').remove()">&times;</span>
            <div class="modal-header"><h3>${multiSelect ? '选择生物（可多选）' : '选择生物'}</h3></div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="func-selector-search" placeholder="搜索生物...">
                </div>
                <div class="item-grid" id="func-selector-grid">
                    ${entities.map(entity => {
                        const eggId = entity.id + '_spawn_egg';
                        const iconHtml = getInviconHtml(eggId, entity.name, 'item-icon') ||
                            getInviconHtml(entity.id, entity.name, 'item-icon') ||
                            `<span class="item-icon-placeholder">?</span>`;
                        const isSelected = multiSelect ? false : entity.id === currentValue;
                        return `<div class="item-option${isSelected ? ' selected' : ''}" data-id="${entity.id}">
                            <span class="item-icon">${iconHtml}</span>
                            <span class="item-name">${entity.name}</span>
                            <span class="item-id">${entity.id.replace('minecraft:', '')}</span>
                        </div>`;
                    }).join('')}
                </div>
                <div class="custom-item-section" style="margin-top:12px;">
                    <div class="custom-item-divider"><span>或者手动输入自定义实体ID</span></div>
                    <div class="custom-item-input-group">
                        <input type="text" id="func-selector-custom" value="${multiSelect ? '' : currentValue}" placeholder="minecraft:zombie">
                        <button id="func-selector-custom-add" class="btn-custom-item">${multiSelect ? '添加' : '确认'}</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                ${multiSelect ? '<span id="func-selected-count">已选择 0 个</span>' : ''}
                ${multiSelect ? '<button id="func-select-all-btn" class="btn-add-mini">☑ 全选当前显示</button>' : ''}
                <button id="func-selector-confirm" class="btn-primary">${multiSelect ? '确认选择' : '确认选择'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    const selectedIds = multiSelect ? new Set() : new Set(currentValue ? [currentValue] : []);

    // 预选已有值
    if (!multiSelect && currentValue) {
        modal.querySelectorAll('.item-option').forEach(opt => {
            if (opt.dataset.id === currentValue) opt.classList.add('selected');
        });
    }

    // 点选
    modal.querySelectorAll('.item-option').forEach(opt => {
        opt.addEventListener('click', function() {
            const id = this.dataset.id;
            if (multiSelect) {
                if (selectedIds.has(id)) {
                    selectedIds.delete(id);
                    this.classList.remove('selected');
                } else {
                    selectedIds.add(id);
                    this.classList.add('selected');
                }
                const countEl = modal.querySelector('#func-selected-count');
                if (countEl) countEl.textContent = '已选择 ' + selectedIds.size + ' 个';
            } else {
                modal.querySelectorAll('.item-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                selectedIds.clear();
                selectedIds.add(id);
            }
        });
    });

    // 搜索
    const searchInput = modal.querySelector('#func-selector-search');
    const filterFn = function() {
        const q = searchInput.value.toLowerCase();
        modal.querySelectorAll('.item-option').forEach(opt => {
            const id = opt.dataset.id.toLowerCase();
            const name = opt.querySelector('.item-name').textContent.toLowerCase();
            opt.style.display = id.includes(q) || name.includes(q) ? '' : 'none';
        });
    };
    searchInput.addEventListener('input', filterFn);

    // 全选
    const selectAllBtn = modal.querySelector('#func-select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const visibleOptions = [];
            modal.querySelectorAll('.item-option').forEach(opt => {
                if (opt.style.display !== 'none') visibleOptions.push(opt);
            });
            const allVisibleSelected = visibleOptions.every(o => selectedIds.has(o.dataset.id));
            visibleOptions.forEach(opt => {
                const id = opt.dataset.id;
                if (allVisibleSelected) {
                    selectedIds.delete(id);
                    opt.classList.remove('selected');
                } else {
                    selectedIds.add(id);
                    opt.classList.add('selected');
                }
            });
            const countEl = modal.querySelector('#func-selected-count');
            if (countEl) countEl.textContent = '已选择 ' + selectedIds.size + ' 个';
            selectAllBtn.textContent = allVisibleSelected ? '☑ 全选当前显示' : '☑ 取消全选';
        });
    }

    // 自定义输入
    const customInput = modal.querySelector('#func-selector-custom');
    modal.querySelector('#func-selector-custom-add').addEventListener('click', function() {
        const val = customInput.value.trim();
        if (val) {
            if (multiSelect) {
                if (!selectedIds.has(val)) {
                    selectedIds.add(val);
                    const countEl = modal.querySelector('#func-selected-count');
                    if (countEl) countEl.textContent = '已选择 ' + selectedIds.size + ' 个';
                }
                customInput.value = '';
            } else {
                callback([val]);
                modal.remove();
            }
        }
    });
    customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            modal.querySelector('#func-selector-custom-add').click();
        }
    });

    // 确认
    modal.querySelector('#func-selector-confirm').addEventListener('click', function() {
        callback(Array.from(selectedIds));
        modal.remove();
    });

    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

function getEffectDisplayName(effectId) {
    if (!effectId) return '';
    const found = PRESET_EFFECTS.find(e => e.id === effectId);
    return found ? found.name : effectId.split(':').pop() || effectId;
}

// ===== 效果选择弹窗（多选+等级+时长） =====
function openEffectSelectorModal(existingList, callback) {
    const existing = document.getElementById('func-selector-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'func-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content" style="max-width: 680px;">
            <span class="close-modal" onclick="document.getElementById('func-selector-modal').remove()">&times;</span>
            <div class="modal-header">
                <h3>选择效果（可多选，自定义等级与时长）</h3>
                <p class="field-hint" style="color:#f59e0b;font-weight:600;margin-top:4px;">⚠ 等级最高 255 级，时长最长 9999 秒</p>
            </div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="func-selector-search" placeholder="搜索效果...">
                </div>
                <div id="func-selector-list" style="max-height:350px;overflow-y:auto;">
                    ${PRESET_EFFECTS.map(effect => {
                        const existing = existingList.find(ef => ef.id === effect.id);
                        const checked = existing ? 'checked' : '';
                        const level = existing ? existing.level : 1;
                        const duration = existing ? existing.duration : 30;
                        return `
                            <div class="enchant-item" data-id="${effect.id}" style="border-bottom:1px solid var(--mc-border);">
                                <label class="checkbox-label" style="display:flex;align-items:center;gap:8px;padding:8px;cursor:pointer;">
                                    <input type="checkbox" class="effect-checkbox" data-id="${effect.id}" ${checked}>
                                    <span style="flex:1;min-width:80px;">${effect.name}</span>
                                    <span style="color:#94a3b8;font-size:12px;white-space:nowrap;">等级</span>
                                    <input type="number" class="effect-level-input" value="${level}" min="1" max="255" style="width:55px;padding:4px;border:1px solid #475569;border-radius:4px;text-align:center;background:rgba(15,23,42,0.6);color:#f1f5f9;" ${checked ? '' : 'disabled'}>
                                    <span style="color:#94a3b8;font-size:12px;white-space:nowrap;">时长</span>
                                    <input type="number" class="effect-duration-input" value="${duration}" min="1" max="9999" style="width:60px;padding:4px;border:1px solid #475569;border-radius:4px;text-align:center;background:rgba(15,23,42,0.6);color:#f1f5f9;" ${checked ? '' : 'disabled'}>
                                    <span style="color:#94a3b8;font-size:12px;white-space:nowrap;">秒</span>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="custom-item-section" style="margin-top:12px;">
                    <div class="custom-item-divider"><span>或者手动输入自定义效果ID</span></div>
                    <div class="custom-item-input-group">
                        <input type="text" id="func-selector-custom" placeholder="例如: minecraft:custom_effect">
                        <button id="func-selector-custom-add" class="btn-custom-item">添加</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <span id="func-selected-count" style="color:var(--mc-text-secondary);font-size:13px;margin-right:auto;">已选择 ${existingList.length} 个</span>
                <button id="func-select-all-effects-btn" class="btn-add-mini">☑ 全选当前显示</button>
                <button class="btn-cancel" onclick="document.getElementById('func-selector-modal').remove()">取消</button>
                <button id="func-selector-confirm" class="btn-primary">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    const selectedEffects = existingList.map(ef => ({ id: ef.id, level: ef.level, duration: ef.duration }));

    function updateCount() {
        const countEl = modal.querySelector('#func-selected-count');
        if (countEl) countEl.textContent = '已选择 ' + selectedEffects.length + ' 个';
    }

    modal.querySelectorAll('.effect-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const id = this.dataset.id;
            const label = this.closest('.checkbox-label');
            const levelInput = label.querySelector('.effect-level-input');
            const durationInput = label.querySelector('.effect-duration-input');
            levelInput.disabled = !this.checked;
            durationInput.disabled = !this.checked;
            if (!this.checked) {
                const idx = selectedEffects.findIndex(ef => ef.id === id);
                if (idx > -1) selectedEffects.splice(idx, 1);
                levelInput.value = 1;
                durationInput.value = 30;
            } else {
                if (!selectedEffects.find(ef => ef.id === id)) {
                    selectedEffects.push({ id, level: parseInt(levelInput.value) || 1, duration: parseInt(durationInput.value) || 30 });
                }
            }
            updateCount();
            updateSelectAllEffectsBtn();
        });
    });

    modal.querySelectorAll('.effect-level-input').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.closest('.checkbox-label').querySelector('.effect-checkbox')?.dataset.id;
            if (id) {
                const ef = selectedEffects.find(e => e.id === id);
                if (ef) ef.level = parseInt(this.value) || 1;
                else {
                    const durationInput = this.closest('.checkbox-label').querySelector('.effect-duration-input');
                    selectedEffects.push({ id, level: parseInt(this.value) || 1, duration: parseInt(durationInput.value) || 30 });
                }
            }
        });
        input.addEventListener('input', function() {
            const id = this.closest('.checkbox-label').querySelector('.effect-checkbox')?.dataset.id;
            if (id) {
                const ef = selectedEffects.find(e => e.id === id);
                if (ef) ef.level = parseInt(this.value) || 1;
            }
        });
    });

    modal.querySelectorAll('.effect-duration-input').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.closest('.checkbox-label').querySelector('.effect-checkbox')?.dataset.id;
            if (id) {
                const ef = selectedEffects.find(e => e.id === id);
                if (ef) ef.duration = parseInt(this.value) || 30;
                else {
                    const levelInput = this.closest('.checkbox-label').querySelector('.effect-level-input');
                    selectedEffects.push({ id, level: parseInt(levelInput.value) || 1, duration: parseInt(this.value) || 30 });
                }
            }
        });
        input.addEventListener('input', function() {
            const id = this.closest('.checkbox-label').querySelector('.effect-checkbox')?.dataset.id;
            if (id) {
                const ef = selectedEffects.find(e => e.id === id);
                if (ef) ef.duration = parseInt(this.value) || 30;
            }
        });
    });

    const searchInput = modal.querySelector('#func-selector-search');
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        modal.querySelectorAll('.enchant-item').forEach(item => {
            const name = item.querySelector('.checkbox-label span').textContent.toLowerCase();
            const id = item.dataset.id.toLowerCase();
            item.style.display = (name.includes(q) || id.includes(q)) ? '' : 'none';
        });
        updateSelectAllEffectsBtn();
    });

    function updateSelectAllEffectsBtn() {
        const btn = modal.querySelector('#func-select-all-effects-btn');
        if (!btn) return;
        const visibleItems = [];
        modal.querySelectorAll('.enchant-item').forEach(item => {
            if (item.style.display !== 'none') visibleItems.push(item);
        });
        const allVisibleChecked = visibleItems.length > 0 && visibleItems.every(item => {
            const cb = item.querySelector('.effect-checkbox');
            return cb && cb.checked;
        });
        btn.textContent = allVisibleChecked ? '☐ 取消全选' : '☑ 全选当前显示';
    }

    const selectAllEffectsBtn = modal.querySelector('#func-select-all-effects-btn');
    if (selectAllEffectsBtn) {
        selectAllEffectsBtn.addEventListener('click', function() {
            const visibleItems = [];
            modal.querySelectorAll('.enchant-item').forEach(item => {
                if (item.style.display !== 'none') visibleItems.push(item);
            });
            const allVisibleChecked = visibleItems.length > 0 && visibleItems.every(item => {
                const cb = item.querySelector('.effect-checkbox');
                return cb && cb.checked;
            });
            visibleItems.forEach(item => {
                const cb = item.querySelector('.effect-checkbox');
                const id = cb.dataset.id;
                const label = item.querySelector('.checkbox-label');
                const levelInput = label.querySelector('.effect-level-input');
                const durationInput = label.querySelector('.effect-duration-input');
                if (allVisibleChecked) {
                    cb.checked = false;
                    levelInput.disabled = true;
                    durationInput.disabled = true;
                    const idx = selectedEffects.findIndex(ef => ef.id === id);
                    if (idx > -1) selectedEffects.splice(idx, 1);
                } else {
                    cb.checked = true;
                    levelInput.disabled = false;
                    durationInput.disabled = false;
                    if (!selectedEffects.find(ef => ef.id === id)) {
                        selectedEffects.push({ id, level: parseInt(levelInput.value) || 1, duration: parseInt(durationInput.value) || 30 });
                    }
                }
            });
            updateCount();
            this.textContent = allVisibleChecked ? '☑ 全选当前显示' : '☐ 取消全选';
        });
    }

    const customInput = modal.querySelector('#func-selector-custom');
    modal.querySelector('#func-selector-custom-add').addEventListener('click', function() {
        const val = customInput.value.trim();
        if (val) {
            if (!selectedEffects.find(ef => ef.id === val)) {
                selectedEffects.push({ id: val, level: 1, duration: 30 });
                updateCount();
                updateSelectAllEffectsBtn();
                modal.querySelectorAll('.effect-checkbox').forEach(cb => {
                    if (cb.dataset.id === val) cb.checked = true;
                });
            }
            customInput.value = '';
        }
    });
    customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            modal.querySelector('#func-selector-custom-add').click();
        }
    });

    modal.querySelector('#func-selector-confirm').addEventListener('click', function() {
        existingList.length = 0;
        selectedEffects.forEach(ef => existingList.push({ id: ef.id, level: ef.level, duration: ef.duration }));
        callback();
        modal.remove();
    });

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

// ===== 已保存函数选择弹窗（用于随机调用函数） =====
function openSavedFunctionSelector(existingList, callback) {
    const existing = document.getElementById('func-selector-modal');
    if (existing) existing.remove();

    const savedFunctions = window.datapackData ? window.datapackData.functions || {} : {};
    const funcEntries = Object.keys(savedFunctions).filter(id => id !== 'load' && id !== 'tick');
    const namespace = window.datapackData ? window.datapackData.namespace || 'my_datapack' : 'my_datapack';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'func-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content">
            <span class="close-modal" onclick="document.getElementById('func-selector-modal').remove()">&times;</span>
            <div class="modal-header"><h3>从已保存函数选择（可多选）</h3></div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="func-selector-search" placeholder="搜索函数...">
                </div>
                <div class="item-grid" id="func-selector-grid" style="max-height:350px;overflow-y:auto;">
                    ${funcEntries.length > 0 ? funcEntries.map(funcId => {
                        const func = savedFunctions[funcId];
                        const fullPath = namespace + ':' + funcId;
                        const isSelected = existingList.includes(fullPath);
                        return `<div class="item-option${isSelected ? ' selected' : ''}" data-id="${fullPath}">
                            <span class="item-icon">📄</span>
                            <span class="item-name">${func.name || funcId}</span>
                            <span class="item-id">${fullPath}</span>
                        </div>`;
                    }).join('') : '<div style="color:#888;padding:20px;text-align:center;">暂无已保存的函数（系统函数 load/tick 除外），请先在函数编辑器中添加函数</div>'}
                </div>
                <div class="custom-item-section" style="margin-top:12px;">
                    <div class="custom-item-divider"><span>或者手动输入函数路径</span></div>
                    <div class="custom-item-input-group">
                        <input type="text" id="func-selector-custom" placeholder="my_namespace:my_function">
                        <button id="func-selector-custom-add" class="btn-custom-item">添加</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <span id="func-selected-count" style="color:var(--mc-text-secondary);font-size:13px;margin-right:auto;">已选择 ${existingList.length} 个</span>
                <button id="func-selector-confirm" class="btn-primary">确认选择</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    const selectedIds = new Set(existingList);

    function updateCount() {
        const countEl = modal.querySelector('#func-selected-count');
        if (countEl) countEl.textContent = '已选择 ' + selectedIds.size + ' 个';
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
            updateCount();
        });
    });

    const searchInput = modal.querySelector('#func-selector-search');
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        modal.querySelectorAll('.item-option').forEach(opt => {
            const id = opt.dataset.id.toLowerCase();
            const name = opt.querySelector('.item-name').textContent.toLowerCase();
            opt.style.display = id.includes(q) || name.includes(q) ? '' : 'none';
        });
    });

    const customInput = modal.querySelector('#func-selector-custom');
    modal.querySelector('#func-selector-custom-add').addEventListener('click', function() {
        const val = customInput.value.trim();
        if (val) {
            if (!selectedIds.has(val)) {
                selectedIds.add(val);
                updateCount();
            }
            customInput.value = '';
        }
    });
    customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            modal.querySelector('#func-selector-custom-add').click();
        }
    });

    modal.querySelector('#func-selector-confirm').addEventListener('click', function() {
        existingList.length = 0;
        selectedIds.forEach(id => existingList.push(id));
        callback();
        modal.remove();
    });

    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

// ===== 战利品表选择弹窗（用于给予战利品动作，只显示无条件触发的战利品表） =====
function openLootTableSelector(currentValue, callback) {
    const existing = document.getElementById('func-selector-modal');
    if (existing) existing.remove();

    const lootTables = window.datapackData ? window.datapackData.lootTables || {} : {};
    const namespace = window.datapackData ? window.datapackData.namespace || 'my_datapack' : 'my_datapack';
    const noneLootTables = Object.keys(lootTables).filter(id => {
        const lt = lootTables[id];
        return lt && lt.type === 'none';
    });

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'func-selector-modal';
    modal.innerHTML = `
        <div class="modal-content item-selector-content">
            <span class="close-modal" onclick="document.getElementById('func-selector-modal').remove()">&times;</span>
            <div class="modal-header"><h3>选择战利品表（无条件触发）</h3></div>
            <div class="modal-body">
                <div class="item-search">
                    <input type="text" id="func-selector-search" placeholder="搜索战利品表...">
                </div>
                <div class="item-grid" id="func-selector-grid" style="max-height:400px;overflow-y:auto;">
                    ${noneLootTables.length > 0 ? noneLootTables.map(lootId => {
                        const lt = lootTables[lootId];
                        const fullPath = namespace + ':' + lootId;
                        const isSelected = fullPath === currentValue;
                        return `<div class="item-option${isSelected ? ' selected' : ''}" data-id="${fullPath}">
                            <span class="item-icon">📦</span>
                            <span class="item-name">${lt.name || lootId}</span>
                            <span class="item-id">${fullPath}</span>
                        </div>`;
                    }).join('') : '<div style="color:#888;padding:20px;text-align:center;">暂无无条件触发的战利品表，请在战利品表编辑器中添加"无触发条件"类型的战利品表</div>'}
                </div>
            </div>
            <div class="modal-actions">
                <button id="func-selector-confirm" class="btn-primary">确认选择</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');

    let selectedId = currentValue || '';

    modal.querySelectorAll('.item-option').forEach(opt => {
        opt.addEventListener('click', function() {
            modal.querySelectorAll('.item-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedId = this.dataset.id;
        });
    });

    const searchInput = modal.querySelector('#func-selector-search');
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        modal.querySelectorAll('.item-option').forEach(opt => {
            const id = opt.dataset.id.toLowerCase();
            const name = opt.querySelector('.item-name').textContent.toLowerCase();
            opt.style.display = id.includes(q) || name.includes(q) ? '' : 'none';
        });
    });

    modal.querySelector('#func-selector-confirm').addEventListener('click', function() {
        if (selectedId) {
            callback(selectedId);
            modal.remove();
        }
    });

    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

// ===== 事件Wiki介绍UI =====
function updateEventWikiDesc(eventType) {
    const panel = document.getElementById('func-event-wiki-panel');
    const content = document.getElementById('func-event-wiki-content');
    const arrow = document.getElementById('event-wiki-arrow');
    const toggle = document.getElementById('func-event-wiki-toggle');
    if (!panel || !content) return;

    // 计分板检测的事件不是真正的触发器事件，不显示Wiki介绍
    if (eventType && TICK_DETECT_EVENTS[eventType]) {
        panel.style.display = 'none';
        return;
    }

    if (eventType && EVENT_WIKI_DESC[eventType]) {
        panel.style.display = 'block';
        content.textContent = EVENT_WIKI_DESC[eventType];

        // 默认折叠
        content.style.display = 'none';
        if (arrow) arrow.textContent = '▶';
        if (arrow) arrow.style.transform = 'rotate(0deg)';

        // 移除旧监听器，添加新监听器
        if (toggle) {
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);
            const newContent = document.getElementById('func-event-wiki-content');
            const newArrow = document.getElementById('event-wiki-arrow');
            if (newToggle) {
                newToggle.addEventListener('click', function() {
                    if (newContent) {
                        const isHidden = newContent.style.display === 'none';
                        newContent.style.display = isHidden ? 'block' : 'none';
                        if (newArrow) {
                            newArrow.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
                        }
                    }
                });
            }
        }
    } else {
        panel.style.display = 'none';
    }
}

// ===== 事件额外条件字段UI =====
function renderEventExtraFields(eventType, savedValues = {}) {
    const container = document.getElementById('func-event-extra-fields-container');
    const wrapper = document.getElementById('func-event-extra-fields');
    const toggle = document.getElementById('func-event-extra-toggle');
    const arrow = document.getElementById('func-event-extra-arrow');
    if (!container || !wrapper) return;

    const config = EVENT_EXTRA_CONFIG[eventType];
    if (!config || !config.fields || config.fields.length === 0) {
        wrapper.style.display = 'none';
        return;
    }

    wrapper.style.display = 'block';
    let html = '';
    config.fields.forEach(field => {
        const value = savedValues[field.id] !== undefined ? savedValues[field.id] : '';
        const requiredMark = field.required ? ' <span style="color:#ff5555;">*</span>' : '';
        if (field.type === 'loot_table_multi') {
            html += renderLootTableMultiField(field, value);
        } else if (field.type === 'recipe') {
            html += renderRecipeSelectorField(field, value);
        } else if (field.type === 'dimension') {
            html += `<div class="form-group" style="margin-bottom:8px;">
                <label>${field.label}${requiredMark}</label>
                <select id="event-extra-${field.id}" class="event-extra-field" data-field-id="${field.id}" style="width:100%;padding:6px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;">
                    <option value="">不限</option>
                    <option value="minecraft:overworld" ${value === 'minecraft:overworld' ? 'selected' : ''}>主世界</option>
                    <option value="minecraft:the_nether" ${value === 'minecraft:the_nether' ? 'selected' : ''}>下界</option>
                    <option value="minecraft:the_end" ${value === 'minecraft:the_end' ? 'selected' : ''}>末地</option>
                </select>
                <span class="field-hint">${field.hint}</span>
            </div>`;
        } else if (field.type === 'select') {
            const optionsHtml = (field.options || []).map(opt => {
                const selected = value === opt.value ? 'selected' : '';
                return `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
            }).join('');
            html += `<div class="form-group" style="margin-bottom:8px;">
                <label>${field.label}${requiredMark}</label>
                <select id="event-extra-${field.id}" class="event-extra-field" data-field-id="${field.id}" style="width:100%;padding:6px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;">
                    ${optionsHtml}
                </select>
                <span class="field-hint">${field.hint}</span>
            </div>`;
        } else if (field.type === 'number') {
            html += `<div class="form-group" style="margin-bottom:8px;">
                <label>${field.label}${requiredMark}</label>
                <input type="number" id="event-extra-${field.id}" class="event-extra-field" data-field-id="${field.id}" value="${value}" min="${field.min || 0}" max="${field.max || 9999}" style="width:100%;padding:6px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;">
                <span class="field-hint">${field.hint}</span>
            </div>`;
        } else {
            html += `<div class="form-group" style="margin-bottom:8px;">
                <label>${field.label}${requiredMark}</label>
                <input type="text" id="event-extra-${field.id}" class="event-extra-field" data-field-id="${field.id}" value="${value}" placeholder="输入${field.label}" style="width:100%;padding:6px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;">
                <span class="field-hint">${field.hint}</span>
            </div>`;
        }
    });
    container.innerHTML = html;

    // 默认折叠隐藏
    container.style.display = 'none';
    if (arrow) arrow.textContent = '▶';

    // 绑定折叠/展开切换
    if (toggle) {
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        const newContainer = document.getElementById('func-event-extra-fields-container');
        const newArrow = document.getElementById('func-event-extra-arrow');
        if (newToggle) {
            newToggle.addEventListener('click', function() {
                if (newContainer) {
                    const isHidden = newContainer.style.display === 'none';
                    newContainer.style.display = isHidden ? 'block' : 'none';
                    if (newArrow) {
                        newArrow.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
                    }
                }
            });
        }
    }

    // 额外绑定事件
    bindEventExtraFieldEvents(container);
}

function renderLootTableMultiField(field, savedValue) {
    const selectedTables = savedValue ? savedValue.split(',').filter(s => s.trim()) : [];
    let optionsHtml = '';
    PRESET_CHEST_LOOT_TABLES.forEach(t => {
        const checked = selectedTables.includes(t.id) ? 'checked' : '';
        optionsHtml += `<label class="checkbox-label loot-table-checkbox-label" data-loot-id="${t.id}" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;">
            <input type="checkbox" class="event-extra-loot-checkbox" data-loot-id="${t.id}" ${checked}>
            <span>${t.name}</span>
            <span style="color:#888;font-size:11px;">(${t.id})</span>
        </label>`;
    });
    return `<div class="form-group" style="margin-bottom:8px;">
        <label>${field.label}${' <span style="color:#ff5555;">*</span>'} <span style="font-size:12px;color:#888;">（可多选，满足任一即触发）</span></label>
        <div style="margin-bottom:4px;display:flex;gap:4px;">
            <input type="text" id="event-extra-loot-search" placeholder="搜索战利品表..." style="flex:1;padding:4px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;font-size:12px;">
            <button type="button" id="event-extra-loot-select-all-btn" class="btn-add-mini" style="white-space:nowrap;font-size:11px;">☑ 全选当前显示</button>
        </div>
        <div style="max-height:200px;overflow-y:auto;border:1px solid #444;border-radius:4px;padding:8px;background:#16213e;">
            ${optionsHtml}
        </div>
        <div style="margin-top:6px;display:flex;gap:6px;">
            <input type="text" id="event-extra-loot_table-custom-input" placeholder="手动输入自定义战利品表ID（多个用逗号分隔）" style="flex:1;padding:6px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;">
            <button type="button" id="event-extra-loot-add-custom" class="btn-add-mini" style="white-space:nowrap;">添加</button>
        </div>
        <input type="hidden" id="event-extra-loot_table" class="event-extra-field" data-field-id="loot_table" value="${selectedTables.join(',')}">
        <div id="event-extra-loot-selected-tags" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">
            ${selectedTables.map(id => `<span class="loot-tag" data-loot="${id}">${id.split('/').pop()}<span class="loot-tag-remove" data-loot="${id}" style="cursor:pointer;margin-left:4px;">×</span></span>`).join('')}
        </div>
        <span class="field-hint">${field.hint}</span>
    </div>`;
}

function renderRecipeSelectorField(field, savedValue) {
    const selectedRecipes = savedValue ? savedValue.split(',').filter(s => s.trim()) : [];
    const customRecipes = window.datapackData ? window.datapackData.recipes || {} : {};
    let vanillaOptionsHtml = '';
    if (vanillaRecipes && vanillaRecipes.length > 0) {
        vanillaRecipes.forEach(r => {
            const checked = selectedRecipes.includes(r.id) ? 'checked' : '';
            vanillaOptionsHtml += `<label class="checkbox-label recipe-checkbox-label" data-recipe-id="${r.id}" data-recipe-source="vanilla" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;">
                <input type="checkbox" class="event-extra-recipe-checkbox" data-recipe-id="${r.id}" ${checked}>
                <span class="recipe-name">${r.name}</span>
                <span style="color:#64748b;font-size:11px;">${r.id}</span>
            </label>`;
        });
    }
    let customOptionsHtml = '';
    const hasCustom = Object.keys(customRecipes).length > 0;
    if (hasCustom) {
        Object.keys(customRecipes).forEach(recipeId => {
            const r = customRecipes[recipeId];
            const label = (r && r.name) ? r.name : recipeId;
            const fullId = window.datapackData ? (window.datapackData.namespace + ':' + recipeId) : recipeId;
            const checked = selectedRecipes.includes(fullId) ? 'checked' : '';
            customOptionsHtml += `<label class="checkbox-label recipe-checkbox-label" data-recipe-id="${fullId}" data-recipe-source="custom" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;">
                <input type="checkbox" class="event-extra-recipe-checkbox" data-recipe-id="${fullId}" ${checked}>
                <span class="recipe-name">${label}</span>
                <span style="color:#f59e0b;font-size:11px;">${fullId}</span>
            </label>`;
        });
    }
    if (!vanillaOptionsHtml && !customOptionsHtml) {
        vanillaOptionsHtml = '<div style="color:#888;padding:8px;text-align:center;">暂无配方数据</div>';
    } else {
        if (vanillaOptionsHtml) {
            vanillaOptionsHtml = `<div style="padding:4px 0;color:#f59e0b;font-size:12px;font-weight:bold;border-bottom:1px solid #444;margin-bottom:4px;">原版配方</div>${vanillaOptionsHtml}`;
        }
        if (customOptionsHtml) {
            customOptionsHtml = `<div style="padding:4px 0;color:#4fc3f7;font-size:12px;font-weight:bold;border-bottom:1px solid #444;margin-bottom:4px;">自定义配方</div>${customOptionsHtml}`;
        }
    }
    return `<div class="form-group" style="margin-bottom:8px;">
        <label>${field.label}${' <span style="color:#ff5555;">*</span>'} <span style="font-size:12px;color:#888;">（可多选，满足任一即触发）</span></label>
        <div style="margin-bottom:4px;display:flex;gap:4px;">
            <input type="text" id="event-extra-recipe-search" placeholder="搜索配方..." style="flex:1;padding:4px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;font-size:12px;">
            <button type="button" id="event-extra-recipe-select-all-btn" class="btn-add-mini" style="white-space:nowrap;font-size:11px;">☑ 全选当前显示</button>
        </div>
        <div style="max-height:200px;overflow-y:auto;border:1px solid #444;border-radius:4px;padding:8px;background:#16213e;">
            ${vanillaOptionsHtml}
            ${customOptionsHtml}
        </div>
        <div style="margin-top:6px;display:flex;gap:6px;">
            <input type="text" id="event-extra-recipe-custom-input" placeholder="手动输入自定义配方ID（多个用逗号分隔）" style="flex:1;padding:6px 8px;background:#16213e;color:#ccc;border:1px solid #555;border-radius:4px;">
            <button type="button" id="event-extra-recipe-add-custom" class="btn-add-mini" style="white-space:nowrap;">添加</button>
        </div>
        <input type="hidden" id="event-extra-recipe_id" class="event-extra-field" data-field-id="recipe_id" value="${selectedRecipes.join(',')}">
        <div id="event-extra-recipe-selected-tags" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">
            ${selectedRecipes.map(id => {
                const shortName = id.includes(':') ? id.split(':').pop() : id;
                return `<span class="loot-tag" data-recipe="${id}">${shortName}<span class="recipe-tag-remove" data-recipe="${id}" style="cursor:pointer;margin-left:4px;">×</span></span>`;
            }).join('')}
        </div>
        <span class="field-hint">${field.hint}</span>
    </div>`;
}

function bindEventExtraFieldEvents(container) {
    // ===== 战利品表多选 - 搜索过滤 =====
    const searchInput = container.querySelector('#event-extra-loot-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const q = this.value.toLowerCase().trim();
            container.querySelectorAll('.loot-table-checkbox-label').forEach(label => {
                const id = label.dataset.lootId.toLowerCase();
                const name = label.querySelector('span').textContent.toLowerCase();
                label.style.display = (!q || id.includes(q) || name.includes(q)) ? '' : 'none';
            });
            updateLootTableSelectAllBtn();
        });
    }

    // ===== 战利品表多选 - 全选/取消全选 =====
    const selectAllBtn = container.querySelector('#event-extra-loot-select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const visibleLabels = [];
            container.querySelectorAll('.loot-table-checkbox-label').forEach(label => {
                if (label.style.display !== 'none') visibleLabels.push(label);
            });
            const allVisibleChecked = visibleLabels.length > 0 && visibleLabels.every(label => {
                const cb = label.querySelector('.event-extra-loot-checkbox');
                return cb && cb.checked;
            });
            visibleLabels.forEach(label => {
                const cb = label.querySelector('.event-extra-loot-checkbox');
                if (cb) cb.checked = !allVisibleChecked;
            });
            updateLootTableHiddenValue();
            updateLootTableSelectAllBtn();
        });
    }

    function updateLootTableSelectAllBtn() {
        const btn = container.querySelector('#event-extra-loot-select-all-btn');
        if (!btn) return;
        const visibleLabels = [];
        container.querySelectorAll('.loot-table-checkbox-label').forEach(label => {
            if (label.style.display !== 'none') visibleLabels.push(label);
        });
        const allVisibleChecked = visibleLabels.length > 0 && visibleLabels.every(label => {
            const cb = label.querySelector('.event-extra-loot-checkbox');
            return cb && cb.checked;
        });
        btn.textContent = allVisibleChecked ? '☐ 取消全选' : '☑ 全选当前显示';
    }

    // 战利品表多选 - 点击复选框
    container.querySelectorAll('.event-extra-loot-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            updateLootTableHiddenValue();
            updateLootTableSelectAllBtn();
        });
    });
    // 战利品表多选 - 点击标签切换（利用label原生行为切换复选框）
    container.querySelectorAll('.loot-table-checkbox-label').forEach(label => {
        label.addEventListener('click', function(e) {
            // 原生label行为会自动切换checkbox，只需确保change事件触发更新
            setTimeout(() => {
                updateLootTableHiddenValue();
                updateLootTableSelectAllBtn();
            }, 0);
        });
    });
    // 战利品表多选 - 添加自定义
    const addCustomBtn = container.querySelector('#event-extra-loot-add-custom');
    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', function() {
            const input = document.getElementById('event-extra-loot_table-custom-input');
            if (input && input.value.trim()) {
                const ids = input.value.trim().split(',').map(s => s.trim()).filter(s => s);
                const hiddenInput = document.getElementById('event-extra-loot_table');
                if (hiddenInput) {
                    const current = hiddenInput.value ? hiddenInput.value.split(',').filter(s => s.trim()) : [];
                    ids.forEach(id => {
                        if (!current.includes(id)) current.push(id);
                    });
                    hiddenInput.value = current.join(',');
                }
                input.value = '';
                refreshLootTableTags();
                updateGeneratedContent();
            }
        });
    }
    // 战利品表多选 - 删除标签
    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('loot-tag-remove')) {
            const id = e.target.dataset.loot;
            const hiddenInput = document.getElementById('event-extra-loot_table');
            if (hiddenInput) {
                const current = hiddenInput.value ? hiddenInput.value.split(',').filter(s => s.trim()) : [];
                const idx = current.indexOf(id);
                if (idx > -1) current.splice(idx, 1);
                hiddenInput.value = current.join(',');
                refreshLootTableTags();
                // 更新复选框
                container.querySelectorAll('.event-extra-loot-checkbox').forEach(cb => {
                    if (cb.dataset.lootId === id) cb.checked = false;
                });
                updateGeneratedContent();
            }
        }
    });

    // ===== 配方多选 - 搜索过滤 =====
    const recipeSearchInput = container.querySelector('#event-extra-recipe-search');
    if (recipeSearchInput) {
        recipeSearchInput.addEventListener('input', function() {
            const q = this.value.toLowerCase().trim();
            container.querySelectorAll('.recipe-checkbox-label').forEach(label => {
                const id = label.dataset.recipeId.toLowerCase();
                const name = label.querySelector('.recipe-name').textContent.toLowerCase();
                label.style.display = (!q || id.includes(q) || name.includes(q)) ? '' : 'none';
            });
            updateRecipeSelectAllBtn();
        });
    }

    // ===== 配方多选 - 全选/取消全选 =====
    const recipeSelectAllBtn = container.querySelector('#event-extra-recipe-select-all-btn');
    if (recipeSelectAllBtn) {
        recipeSelectAllBtn.addEventListener('click', function() {
            const visibleLabels = [];
            container.querySelectorAll('.recipe-checkbox-label').forEach(label => {
                if (label.style.display !== 'none') visibleLabels.push(label);
            });
            const allVisibleChecked = visibleLabels.length > 0 && visibleLabels.every(label => {
                const cb = label.querySelector('.event-extra-recipe-checkbox');
                return cb && cb.checked;
            });
            visibleLabels.forEach(label => {
                const cb = label.querySelector('.event-extra-recipe-checkbox');
                if (cb) cb.checked = !allVisibleChecked;
            });
            updateRecipeHiddenValue();
            updateRecipeSelectAllBtn();
        });
    }

    function updateRecipeSelectAllBtn() {
        const btn = container.querySelector('#event-extra-recipe-select-all-btn');
        if (!btn) return;
        const visibleLabels = [];
        container.querySelectorAll('.recipe-checkbox-label').forEach(label => {
            if (label.style.display !== 'none') visibleLabels.push(label);
        });
        const allVisibleChecked = visibleLabels.length > 0 && visibleLabels.every(label => {
            const cb = label.querySelector('.event-extra-recipe-checkbox');
            return cb && cb.checked;
        });
        btn.textContent = allVisibleChecked ? '☐ 取消全选' : '☑ 全选当前显示';
    }

    // 配方多选 - 点击复选框
    container.querySelectorAll('.event-extra-recipe-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            updateRecipeHiddenValue();
            updateRecipeSelectAllBtn();
        });
    });
    // 配方多选 - 点击标签切换（利用label原生行为切换复选框）
    container.querySelectorAll('.recipe-checkbox-label').forEach(label => {
        label.addEventListener('click', function(e) {
            // 原生label行为会自动切换checkbox，只需确保change事件触发更新
            setTimeout(() => {
                updateRecipeHiddenValue();
                updateRecipeSelectAllBtn();
            }, 0);
        });
    });
    // 配方多选 - 添加自定义配方
    const addRecipeCustomBtn = container.querySelector('#event-extra-recipe-add-custom');
    if (addRecipeCustomBtn) {
        addRecipeCustomBtn.addEventListener('click', function() {
            const input = document.getElementById('event-extra-recipe-custom-input');
            if (input && input.value.trim()) {
                const ids = input.value.trim().split(',').map(s => s.trim()).filter(s => s);
                const hiddenInput = document.getElementById('event-extra-recipe_id');
                if (hiddenInput) {
                    const current = hiddenInput.value ? hiddenInput.value.split(',').filter(s => s.trim()) : [];
                    ids.forEach(id => {
                        if (!current.includes(id)) current.push(id);
                    });
                    hiddenInput.value = current.join(',');
                }
                input.value = '';
                refreshRecipeTags();
                updateGeneratedContent();
            }
        });
    }
    // 配方多选 - 删除标签
    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('recipe-tag-remove')) {
            const id = e.target.dataset.recipe;
            const hiddenInput = document.getElementById('event-extra-recipe_id');
            if (hiddenInput) {
                const current = hiddenInput.value ? hiddenInput.value.split(',').filter(s => s.trim()) : [];
                const idx = current.indexOf(id);
                if (idx > -1) current.splice(idx, 1);
                hiddenInput.value = current.join(',');
                refreshRecipeTags();
                // 更新复选框
                container.querySelectorAll('.event-extra-recipe-checkbox').forEach(cb => {
                    if (cb.dataset.recipeId === id) cb.checked = false;
                });
                updateGeneratedContent();
            }
        }
    });
}

function refreshRecipeTags() {
    const tagsContainer = document.getElementById('event-extra-recipe-selected-tags');
    const hiddenInput = document.getElementById('event-extra-recipe_id');
    if (!tagsContainer || !hiddenInput) return;
    const selected = hiddenInput.value ? hiddenInput.value.split(',').filter(s => s.trim()) : [];
    tagsContainer.innerHTML = selected.map(id => {
        const shortName = id.includes(':') ? id.split(':').pop() : id;
        return `<span class="loot-tag" data-recipe="${id}">${shortName}<span class="recipe-tag-remove" data-recipe="${id}" style="cursor:pointer;margin-left:4px;">×</span></span>`;
    }).join('');
}

function updateRecipeHiddenValue() {
    const checkboxes = document.querySelectorAll('.event-extra-recipe-checkbox:checked');
    const selected = Array.from(checkboxes).map(cb => cb.dataset.recipeId);
    const hiddenInput = document.getElementById('event-extra-recipe_id');
    if (hiddenInput) {
        hiddenInput.value = selected.join(',');
        refreshRecipeTags();
        updateGeneratedContent();
    }
}

function refreshLootTableTags() {
    const hiddenInput = document.getElementById('event-extra-loot_table');
    const tagsContainer = document.getElementById('event-extra-loot-selected-tags');
    if (!hiddenInput || !tagsContainer) return;
    const selected = hiddenInput.value ? hiddenInput.value.split(',').filter(s => s.trim()) : [];
    tagsContainer.innerHTML = selected.map(id =>
        `<span class="loot-tag" data-loot="${id}">${id.split('/').pop()}<span class="loot-tag-remove" data-loot="${id}" style="cursor:pointer;margin-left:4px;">×</span></span>`
    ).join('');
}

function updateLootTableHiddenValue() {
    const checkboxes = document.querySelectorAll('.event-extra-loot-checkbox:checked');
    const selected = Array.from(checkboxes).map(cb => cb.dataset.lootId);
    const hiddenInput = document.getElementById('event-extra-loot_table');
    if (hiddenInput) {
        // 合并已选中的自定义项
        const customInput = document.getElementById('event-extra-loot_table-custom-input');
        if (customInput && customInput.value.trim()) {
            const customIds = customInput.value.trim().split(',').map(s => s.trim()).filter(s => s);
            customIds.forEach(id => { if (!selected.includes(id)) selected.push(id); });
        }
        hiddenInput.value = selected.join(',');
        refreshLootTableTags();
        updateGeneratedContent();
    }

    // 更新复选框状态
    document.querySelectorAll('.event-extra-loot-checkbox').forEach(cb => {
        const hiddenInput2 = document.getElementById('event-extra-loot_table');
        if (hiddenInput2) {
            const current = hiddenInput2.value ? hiddenInput2.value.split(',').filter(s => s.trim()) : [];
            cb.checked = current.includes(cb.dataset.lootId);
        }
    });
}

function collectEventExtraFields() {
    const fields = {};
    document.querySelectorAll('.event-extra-field').forEach(el => {
        const fieldId = el.dataset.fieldId;
        if (fieldId && el.value !== undefined && el.value !== null && el.value !== '') {
            fields[fieldId] = el.value;
        }
    });
    // 对于loot_table，使用隐藏字段的值
    const hiddenLoot = document.getElementById('event-extra-loot_table');
    if (hiddenLoot && hiddenLoot.value.trim()) {
        fields.loot_table = hiddenLoot.value.trim();
    }
    // 对于recipe_id，使用隐藏字段的值（包含多选和手动输入的配方）
    const hiddenRecipe = document.getElementById('event-extra-recipe_id');
    if (hiddenRecipe && hiddenRecipe.value.trim()) {
        fields.recipe_id = hiddenRecipe.value.trim();
    }
    return fields;
}

function updateGeneratedContent(showNotif = true) {
    const funcName = document.getElementById('func-name')?.value || '函数';
    const triggerType = document.getElementById('func-trigger')?.value || 'manual';
    const eventType = document.getElementById('func-event-type')?.value || 'jump';
    const interval = parseFloat(document.getElementById('func-interval')?.value) || 5;
    const target = document.getElementById('func-target')?.value || '@a';
    const funcId = document.getElementById('func-id')?.value;
    const actions = window._currentActions || [];
    const content = generateFunctionContent(funcName, triggerType, eventType, interval, actions, target, funcId);
    const contentArea = document.getElementById('function-content');
    if (contentArea) {
        contentArea.value = content;
    }
    if (funcId && typeof datapackData.functions[funcId] === 'object') {
        datapackData.functions[funcId].content = content;
    }
}

// ===== 清除表单 =====
function clearFunctionForm() {
    const fields = ['func-id', 'func-name', 'func-custom-selector', 'function-content',
        'func-area-name',
        'func-area-x1', 'func-area-y1', 'func-area-z1',
        'func-area-x2', 'func-area-y2', 'func-area-z2'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const triggerEl = document.getElementById('func-trigger');
    if (triggerEl) triggerEl.value = 'manual';
    const targetEl = document.getElementById('func-target');
    if (targetEl) targetEl.value = '@a';
    const eventTypeEl = document.getElementById('func-event-type');
    if (eventTypeEl) eventTypeEl.value = 'jump';
    const areaModeEl = document.getElementById('func-area-mode');
    if (areaModeEl) areaModeEl.value = 'enter';
    const intervalActionbarEl = document.getElementById('func-interval-actionbar');
    if (intervalActionbarEl) intervalActionbarEl.value = 'true';

    const interval = document.getElementById('func-interval');
    if (interval) interval.value = 5;

    const healthConditionEl = document.getElementById('func-health-condition');
    if (healthConditionEl) healthConditionEl.value = 'below';
    const healthThresholdEl = document.getElementById('func-health-threshold');
    if (healthThresholdEl) healthThresholdEl.value = 10;

    const presetSelect = document.getElementById('func-leaderboard-preset');
    if (presetSelect) presetSelect.value = 'dummy';
    setFieldValue('func-leaderboard-displayname', '虚拟型');
    setFieldValue('func-leaderboard-slot', 'sidebar');
    setFieldValue('func-leaderboard-color', 'white');
    setFieldValue('func-leaderboard-custom-criteria-input', '');
    const customGroup = document.getElementById('func-leaderboard-custom-criteria-group');
    if (customGroup) customGroup.style.display = 'none';

    window._currentActions = [];
    const container = document.getElementById('action-list');
    if (container) container.innerHTML = '';

    const extraFieldsWrapper = document.getElementById('func-event-extra-fields');
    if (extraFieldsWrapper) extraFieldsWrapper.style.display = 'none';
    const wikiPanel = document.getElementById('func-event-wiki-panel');
    if (wikiPanel) wikiPanel.style.display = 'none';

    updateFuncConditionVisibility('manual');
}

// ===== 主初始化 =====
export function initFunctionEditor() {
    window._currentActions = [];
    refreshFunctionList();

    const initialTrigger = document.getElementById('func-trigger')?.value || 'manual';
    updateFuncConditionVisibility(initialTrigger);

    const addBtn = document.getElementById('add-function');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            window.showPrompt('添加函数', '输入显示名称，将自动生成函数ID', '', function(funcName) {
                if (funcName && funcName.trim()) {
                    let funcId = funcName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    if (!funcId) {
                        let index = 1;
                        while (datapackData.functions['func_' + index]) index++;
                        funcId = 'func_' + index;
                    }
                    if (!datapackData.functions[funcId]) {
                        const triggerType = 'manual';
                        const eventType = 'jump';
                        const actions = getDefaultActions(triggerType, eventType);
                        const content = generateFunctionContent(funcName, triggerType, eventType, 5, actions, '@a', funcId);
                        datapackData.functions[funcId] = {
                            content: content,
                            triggerType: triggerType,
                            name: funcName,
                            interval: 5,
                            target: '@a',
                            customSelector: '',
                            eventType: eventType,
                            intervalActionbar: true,
                            intervalColor: '#0BFF0A',
                            intervalDigitColor: '#FF0000',
                            intervalText: 'Time',
                            areaMode: 'enter',
                            areaName: 'spawn_area',
                            areaX1: 0,
                            areaY1: -64,
                            areaZ1: 0,
                            areaX2: 100,
                            areaY2: 320,
                            areaZ2: 100,
                            eventExtraFields: {},
                            actions: actions
                        };
                        refreshFunctionList();
                        selectFunction(funcId);
                        showNotification('函数已添加！', 'success');
                    } else {
                        showNotification('函数ID已存在！', 'error');
                    }
                }
            });
        });
    }

    const saveBtn = document.getElementById('save-function');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const newId = document.getElementById('func-id')?.value.trim();
            if (!newId) {
                showNotification('请输入函数ID！', 'error');
                return;
            }
            if (window.currentFunction) {
                if (newId !== window.currentFunction) {
                    if (datapackData.functions[newId]) {
                        showNotification('函数ID "' + newId + '" 已存在，请使用其他ID！', 'error');
                        return;
                    }
                    const oldId = window.currentFunction;
                    saveFunctionData(newId);
                    delete datapackData.functions[oldId];
                    window.currentFunction = newId;
                    refreshFunctionList();
                    selectFunction(newId);
                } else {
                    saveFunctionData(window.currentFunction);
                }
                showNotification('函数已保存！', 'success');
            } else {
                if (datapackData.functions[newId]) {
                    showNotification('函数ID "' + newId + '" 已存在，请使用其他ID！', 'error');
                    return;
                }
                window.currentFunction = newId;
                saveFunctionData(newId);
                refreshFunctionList();
                selectFunction(newId);
                showNotification('函数已创建并保存！', 'success');
            }
        });
    }

    const deleteBtn = document.getElementById('delete-function');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const funcId = document.getElementById('func-id')?.value.trim();
            if (!funcId || !window.currentFunction) {
                showNotification('请先选择一个函数！', 'error');
                return;
            }
            const funcData = datapackData.functions[funcId];
            const funcName = funcData ? (funcData.name || funcId) : funcId;
            window.showConfirm('确定要删除函数 "<strong>' + funcName + '</strong>" 吗？', function(result) {
                if (result) {
                    delete datapackData.functions[funcId];
                    window.currentFunction = null;
                    clearFunctionForm();
                    refreshFunctionList();
                    showNotification('函数已删除！', 'success');
                }
            });
        });
    }

    const triggerSelect = document.getElementById('func-trigger');
    if (triggerSelect) {
        triggerSelect.addEventListener('change', function() {
            updateFuncConditionVisibility(this.value);
            const isLeaderboard = this.value === 'leaderboard';

            // 榜单模式下隐藏"触发对象"和"动作配置"
            const targetSection = document.getElementById('func-target')?.closest('.form-group');
            const customSelectorGroup = document.querySelector('.func-condition-group[data-triggers="custom_selector"]');
            const actionConfigSection = document.querySelector('.action-config-section');
            if (targetSection) targetSection.style.display = isLeaderboard ? 'none' : '';
            if (customSelectorGroup) customSelectorGroup.style.display = 'none';
            if (actionConfigSection) actionConfigSection.style.display = isLeaderboard ? 'none' : '';

            // 榜单始终显示颜色组
            if (isLeaderboard) {
                const colorGroup = document.getElementById('func-leaderboard-color-group');
                if (colorGroup) colorGroup.style.display = '';
                const leaderboardSlot = document.getElementById('func-leaderboard-slot');
                if (leaderboardSlot) {
                    leaderboardSlot.addEventListener('change', function() {
                        updateGeneratedContent();
                    });
                }
                // 初始化预设榜单选择
                const presetSelect = document.getElementById('func-leaderboard-preset');
                const customGroup = document.getElementById('func-leaderboard-custom-criteria-group');
                if (presetSelect && customGroup) {
                    customGroup.style.display = presetSelect.value === '__custom__' ? '' : 'none';
                }
            }

            if (this.value === 'event') {
                const eventType = document.getElementById('func-event-type')?.value || 'jump';
                const funcId = document.getElementById('func-id')?.value;
                let savedExtraFields = {};
                if (funcId && datapackData.functions[funcId] && datapackData.functions[funcId].eventExtraFields) {
                    savedExtraFields = datapackData.functions[funcId].eventExtraFields;
                }
                renderEventExtraFields(eventType, savedExtraFields);
                updateEventWikiDesc(eventType);
            } else {
                const wrapper = document.getElementById('func-event-extra-fields');
                if (wrapper) wrapper.style.display = 'none';
                const wikiPanel = document.getElementById('func-event-wiki-panel');
                if (wikiPanel) wikiPanel.style.display = 'none';
            }
            updateGeneratedContent();
        });
    }

    const eventTypeSelect = document.getElementById('func-event-type');
    if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', function() {
            const triggerType = document.getElementById('func-trigger')?.value || 'event';
            if (triggerType === 'event') {
                const actions = getDefaultActions('event', this.value);
                window._currentActions = actions;
                renderActionList(actions);
                // 加载保存的额外条件字段
                const funcId = document.getElementById('func-id')?.value;
                let savedExtraFields = {};
                if (funcId && datapackData.functions[funcId] && datapackData.functions[funcId].eventExtraFields) {
                    savedExtraFields = datapackData.functions[funcId].eventExtraFields;
                }
                renderEventExtraFields(this.value, savedExtraFields);
                updateEventWikiDesc(this.value);
                updateGeneratedContent();
                showNotification('已更新事件模板', 'info');
            }
        });
    }

    // 间隔秒数变化时更新
    const intervalInput = document.getElementById('func-interval');
    if (intervalInput) {
        intervalInput.addEventListener('input', function() {
            updateGeneratedContent(false);
        });
    }

    // 间隔触发 - 倒计时显示切换
    const intervalActionbar = document.getElementById('func-interval-actionbar');
    if (intervalActionbar) {
        intervalActionbar.addEventListener('change', function() {
            const abGroup = document.querySelector('.interval-actionbar-group');
            if (abGroup) {
                abGroup.style.display = this.value === 'true' ? '' : 'none';
            }
            updateGeneratedContent();
        });
    }

    // 颜色设置 - 折叠/展开
    const colorToggle = document.getElementById('color-section-toggle');
    const colorPanel = document.getElementById('color-custom-panel');
    if (colorToggle && colorPanel) {
        colorToggle.addEventListener('click', function() {
            const isHidden = colorPanel.style.display === 'none';
            colorPanel.style.display = isHidden ? '' : 'none';
            this.querySelector('.arrow').classList.toggle('collapsed', !isHidden);
        });
    }

    function syncColorPickerAndText(pickerId, textId) {
        const picker = document.getElementById(pickerId);
        const text = document.getElementById(textId);
        if (picker && text) {
            picker.addEventListener('input', function() {
                text.value = this.value;
                updateGeneratedContent(false);
            });
            text.addEventListener('input', function() {
                if (/^#[0-9a-fA-F]{6}$/.test(this.value)) {
                    picker.value = this.value;
                }
                updateGeneratedContent(false);
            });
        }
    }

    syncColorPickerAndText('func-interval-color', 'func-interval-color-text');
    syncColorPickerAndText('func-interval-digit-color', 'func-interval-digit-color-text');

    // 颜色预设点击
    const colorPresets = document.getElementById('color-presets');
    if (colorPresets) {
        colorPresets.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', function() {
                const textColor = this.dataset.text;
                const digitColor = this.dataset.digit;

                const textPicker = document.getElementById('func-interval-color');
                const textInput = document.getElementById('func-interval-color-text');
                const digitPicker = document.getElementById('func-interval-digit-color');
                const digitInput = document.getElementById('func-interval-digit-color-text');

                if (textPicker && textInput) {
                    textPicker.value = textColor;
                    textInput.value = textColor;
                }
                if (digitPicker && digitInput) {
                    digitPicker.value = digitColor;
                    digitInput.value = digitColor;
                }

                colorPresets.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                updateGeneratedContent(false);
            });
        });
    }

    const targetSelect = document.getElementById('func-target');
    if (targetSelect) {
        targetSelect.addEventListener('change', function() {
            const customGroup = document.querySelector('.func-condition-group[data-triggers="custom_selector"]');
            if (customGroup) {
                customGroup.style.display = this.value === 'custom' ? 'block' : 'none';
            }
            updateGeneratedContent();
        });
    }

    // 榜单字段变更时更新生成内容
    // 预设榜单选择
    const presetSelect = document.getElementById('func-leaderboard-preset');
    if (presetSelect) {
        presetSelect.addEventListener('change', function() {
            const isCustom = this.value === '__custom__';
            const customGroup = document.getElementById('func-leaderboard-custom-criteria-group');
            if (customGroup) customGroup.style.display = isCustom ? '' : 'none';
            if (!isCustom) {
                const preset = getLeaderboardPresetInfo(this.value);
                if (preset) {
                    document.getElementById('func-leaderboard-displayname').value = preset.displayName;
                }
            }
            updateGeneratedContent();
        });
    }

    ['func-leaderboard-displayname', 'func-leaderboard-slot', 'func-leaderboard-color', 'func-leaderboard-custom-criteria-input'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function() {
                updateGeneratedContent();
            });
            if (el.tagName === 'INPUT') {
                el.addEventListener('input', function() {
                    updateGeneratedContent(false);
                });
            }
        }
    });

    // 榜单显示位置切换
    const leaderboardSlot = document.getElementById('func-leaderboard-slot');
    if (leaderboardSlot) {
        leaderboardSlot.addEventListener('change', function() {
            updateGeneratedContent();
        });
    }

    // 添加动作按钮
    const addActionBtn = document.getElementById('add-action');
    if (addActionBtn) {
        addActionBtn.addEventListener('click', function() {
            const typeSelect = document.getElementById('action-type-select');
            if (!typeSelect) return;
            const type = typeSelect.value;
            if (!window._currentActions) window._currentActions = [];
            const typeDef = ACTION_TYPES[type];
            if (!typeDef) return;
            const params = {};
            typeDef.params.forEach(p => {
                params[p.id] = p.default;
            });
            window._currentActions.push({ type, params });
            renderActionList(window._currentActions);
            updateGeneratedContent();
            showNotification('已添加动作：' + typeDef.label, 'success');
        });
    }
}

// ===== 条件可见性 =====
function updateFuncConditionVisibility(trigger) {
    document.querySelectorAll('.func-condition-group').forEach(group => {
        const triggers = group.getAttribute('data-triggers');
        if (triggers) {
            const triggerList = triggers.split(',');
            group.style.display = triggerList.includes(trigger) ? 'block' : 'none';
        }
    });
}

// ===== 函数列表刷新 =====
function refreshFunctionList() {
    const list = document.getElementById('function-list');
    if (!list) return;
    list.innerHTML = '';
    Object.keys(datapackData.functions).forEach(funcId => {
        const func = datapackData.functions[funcId];
        const li = document.createElement('li');
        li.className = 'function-item';
        li.setAttribute('data-function', funcId);
        const triggerLabels = {
            'load': '加载',
            'tick': '循环',
            'interval': '定时',
            'manual': '手动',
            'event': '事件',
            'health_check': '血量',
            'area_detect': '区域',
            'leaderboard': '榜单'
        };
        const triggerLabel = triggerLabels[func.triggerType] || func.triggerType || '手动';
        li.innerHTML = '<span class="func-list-icon"></span>' +
            '<span class="func-list-name">' + (func.name || funcId) + '</span>' +
            '<span class="func-list-trigger">' + triggerLabel + '</span>' +
            '<button class="delete-btn" onclick="deleteFunction(\'' + funcId + '\', event)">✕</button>';
        li.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-btn')) return;
            selectFunction(funcId);
        });
        list.appendChild(li);
    });
}

window.deleteFunction = function(funcId, event) {
    event.stopPropagation();
    const func = datapackData.functions[funcId];
    window.showConfirm('确定要删除函数 "<strong>' + (func ? (func.name || funcId) : funcId) + '</strong>" 吗？', function(result) {
        if (result) {
            delete datapackData.functions[funcId];
            if (window.currentFunction === funcId) {
                window.currentFunction = null;
                clearFunctionForm();
            }
            refreshFunctionList();
            showNotification('函数已删除！', 'success');
        }
    });
};

// ===== 函数选择 =====
function selectFunction(funcId) {
    document.querySelectorAll('.function-item').forEach(item => item.classList.remove('active'));
    const item = document.querySelector('[data-function="' + funcId + '"]');
    if (item) item.classList.add('active');
    window.currentFunction = funcId;
    loadFunctionData(funcId);
}

// ===== 加载函数数据 =====
function loadFunctionData(funcId) {
    const func = datapackData.functions[funcId];
    if (!func) return;

    setFieldValue('func-id', funcId);
    setFieldValue('func-name', func.name || '');
    setFieldValue('func-trigger', func.triggerType || 'manual');
    setFieldValue('func-interval', func.interval || 5);
    setFieldValue('func-target', func.target || '@a');
    setFieldValue('func-custom-selector', func.customSelector || '');
    setFieldValue('func-event-type', func.eventType || 'jump');
    setFieldValue('func-interval-actionbar', func.intervalActionbar !== false ? 'true' : 'false');
    setFieldValue('func-interval-color', func.intervalColor || '#0BFF0A');
    setFieldValue('func-interval-color-text', func.intervalColor || '#0BFF0A');
    setFieldValue('func-interval-digit-color', func.intervalDigitColor || '#FF0000');
    setFieldValue('func-interval-digit-color-text', func.intervalDigitColor || '#FF0000');
    setFieldValue('func-interval-text', func.intervalText !== undefined ? func.intervalText : 'Time');
    setFieldValue('func-area-mode', func.areaMode || 'enter');
    setFieldValue('func-area-name', func.areaName || 'spawn_area');
    setFieldValue('func-area-x1', func.areaX1 || 0);
    setFieldValue('func-area-y1', func.areaY1 || -64);
    setFieldValue('func-area-z1', func.areaZ1 || 0);
    setFieldValue('func-area-x2', func.areaX2 || 100);
    setFieldValue('func-area-y2', func.areaY2 || 320);
    setFieldValue('func-area-z2', func.areaZ2 || 100);
    setFieldValue('function-content', func.content || '');
    setFieldValue('func-health-condition', func.healthCondition || 'below');
    setFieldValue('func-health-threshold', func.healthThreshold || 10);

    // 向后兼容：旧版保存的 leaderboardCriteria 映射到新预设
    let presetId = func.leaderboardPreset || 'dummy';
    if (!func.leaderboardPreset && func.leaderboardCriteria) {
        const criteriaToPreset = {
            'dummy': 'dummy',
            'trigger': 'trigger',
            'deathCount': 'deathCount',
            'playerKillCount': 'playerKillCount',
            'totalKillCount': 'totalKillCount',
            'health': 'health',
            'xp': 'xp',
            'level': 'level',
            'food': 'food',
            'armor': 'armor'
        };
        presetId = criteriaToPreset[func.leaderboardCriteria] || 'dummy';
        // 如果使用了自定义准则，转为自定义模式
        if (func.leaderboardCustomCriteria) {
            presetId = '__custom__';
        }
    }
    const presetSelect = document.getElementById('func-leaderboard-preset');
    if (presetSelect) {
        presetSelect.value = presetId;
        const isCustom = presetId === '__custom__';
        const customGroup = document.getElementById('func-leaderboard-custom-criteria-group');
        if (customGroup) customGroup.style.display = isCustom ? '' : 'none';
    }
    setFieldValue('func-leaderboard-displayname', func.leaderboardDisplayName || '虚拟型');
    let slot = func.leaderboardSlot || 'sidebar';
    if (slot === 'sidebar.team') slot = 'sidebar';
    setFieldValue('func-leaderboard-slot', slot);
    setFieldValue('func-leaderboard-color', func.leaderboardColor || 'white');
    setFieldValue('func-leaderboard-custom-criteria-input', func.leaderboardCustomCriteria || '');

    const targetSelect = document.getElementById('func-target');
    if (targetSelect) {
        const customGroup = document.querySelector('.func-condition-group[data-triggers="custom_selector"]');
        if (customGroup) {
            customGroup.style.display = targetSelect.value === 'custom' ? 'block' : 'none';
        }
    }

    const intervalActionbar = document.getElementById('func-interval-actionbar');
    if (intervalActionbar) {
        const abGroup = document.querySelector('.interval-actionbar-group');
        if (abGroup) {
            const isInterval = func.triggerType === 'interval';
            const show = isInterval && intervalActionbar.value === 'true';
            abGroup.style.display = show ? '' : 'none';
        }
    }

    // 加载动作
    if (func.actions && Array.isArray(func.actions)) {
        window._currentActions = JSON.parse(JSON.stringify(func.actions));
    } else {
        window._currentActions = getDefaultActions(func.triggerType || 'manual', func.eventType || 'jump');
    }
    renderActionList(window._currentActions);

    // 加载事件额外条件字段
    if (func.triggerType === 'event' && func.eventType) {
        renderEventExtraFields(func.eventType, func.eventExtraFields || {});
        updateEventWikiDesc(func.eventType);
    } else {
        const wrapper = document.getElementById('func-event-extra-fields');
        if (wrapper) wrapper.style.display = 'none';
        const wikiPanel = document.getElementById('func-event-wiki-panel');
        if (wikiPanel) wikiPanel.style.display = 'none';
    }

    updateFuncConditionVisibility(func.triggerType || 'manual');

    // 加载榜单时隐藏"触发对象"和"动作配置"
    const isLeaderboard = func.triggerType === 'leaderboard';
    const targetSection = document.getElementById('func-target')?.closest('.form-group');
    const customSelectorGroup = document.querySelector('.func-condition-group[data-triggers="custom_selector"]');
    const actionConfigSection = document.querySelector('.action-config-section');
    if (targetSection) targetSection.style.display = isLeaderboard ? 'none' : '';
    if (customSelectorGroup) customSelectorGroup.style.display = 'none';
    if (actionConfigSection) actionConfigSection.style.display = isLeaderboard ? 'none' : '';

    // 榜单颜色组始终显示
    const colorGroup = document.getElementById('func-leaderboard-color-group');
    if (colorGroup) colorGroup.style.display = '';

    updateGeneratedContent(false);
}

// ===== 字段操作 =====
function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

// ===== 保存函数 =====
function saveFunctionData(funcId) {
    const trigger = getFieldValue('func-trigger') || 'manual';
    const target = getFieldValue('func-target') || '@a';

    datapackData.functions[funcId] = {
        name: getFieldValue('func-name'),
        content: getFieldValue('function-content'),
        triggerType: trigger,
        interval: parseFloat(getFieldValue('func-interval')) || 5,
        target: target,
        customSelector: target === 'custom' ? getFieldValue('func-custom-selector') : '',
        eventType: getFieldValue('func-event-type') || 'jump',
        intervalActionbar: getFieldValue('func-interval-actionbar') !== 'false',
        intervalColor: getFieldValue('func-interval-color') || '#0BFF0A',
        intervalDigitColor: getFieldValue('func-interval-digit-color') || '#FF0000',
        intervalText: getFieldValue('func-interval-text'),
        areaMode: getFieldValue('func-area-mode') || 'enter',
        areaName: getFieldValue('func-area-name') || 'spawn_area',
        areaX1: parseInt(getFieldValue('func-area-x1')) || 0,
        areaY1: parseInt(getFieldValue('func-area-y1')) || -64,
        areaZ1: parseInt(getFieldValue('func-area-z1')) || 0,
        areaX2: parseInt(getFieldValue('func-area-x2')) || 100,
        areaY2: parseInt(getFieldValue('func-area-y2')) || 320,
        areaZ2: parseInt(getFieldValue('func-area-z2')) || 100,
        eventExtraFields: collectEventExtraFields(),
        healthCondition: getFieldValue('func-health-condition') || 'below',
        healthThreshold: parseInt(getFieldValue('func-health-threshold')) || 10,
        leaderboardPreset: document.getElementById('func-leaderboard-preset')?.value || 'dummy',
        leaderboardDisplayName: getFieldValue('func-leaderboard-displayname') || '虚拟型',
        leaderboardSlot: getFieldValue('func-leaderboard-slot') || 'sidebar',
        leaderboardColor: getFieldValue('func-leaderboard-color') || 'white',
        leaderboardCustomCriteria: getFieldValue('func-leaderboard-custom-criteria-input') || '',
        actions: window._currentActions || []
    };

    refreshFunctionList();
    return datapackData.functions[funcId];
}

export { refreshFunctionList };

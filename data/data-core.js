export const datapackData = {
    name: '',
    description: '',
    namespace: 'my_datapack',
    format: 48,
    functions: {
        load: {
            content: '# 数据包加载函数\n# 在这里添加初始化命令',
            triggerType: 'load',
            category: '系统函数'
        },
        tick: {
            content: '# 每刻执行的函数\n# 在这里添加循环执行的命令',
            triggerType: 'tick',
            category: '系统函数'
        }
    },
    advancements: {},
    lootTables: {},
    recipes: {},
    excludedVanillaRecipes: [],
    customAdvancementTabs: [],
    packImage: null
};

export let currentFunction = 'load';
export let currentAdvancement = null;
export let currentLootTable = null;
export let currentRecipe = null;
export let currentItemTarget = null;
export let currentItemInputId = null;

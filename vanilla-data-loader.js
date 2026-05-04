let vanillaDataCache = {};
let pendingRequests = {};

export function getVanillaPools(type, targetId) {
    const path = resolvePath(type, targetId);
    if (!path) return null;
    return vanillaDataCache[path] || null;
}

export function ensureVanillaDataLoaded(type, targetId) {
    const path = resolvePath(type, targetId);
    if (!path) return Promise.resolve(null);
    if (vanillaDataCache[path]) return Promise.resolve(vanillaDataCache[path]);
    if (pendingRequests[path]) return pendingRequests[path];

    pendingRequests[path] = Promise.race([
        new Promise((resolve) => {
            fetch(path).then(response => {
                if (response.ok) {
                    response.json().then(data => {
                        vanillaDataCache[path] = data.pools || [];
                        resolve(vanillaDataCache[path]);
                    }).catch(() => {
                        vanillaDataCache[path] = [];
                        resolve([]);
                    });
                } else {
                    vanillaDataCache[path] = [];
                    resolve([]);
                }
            }).catch(() => {
                vanillaDataCache[path] = [];
                resolve([]);
            });
        }),
        new Promise((resolve) => setTimeout(() => {
            if (!vanillaDataCache[path]) {
                vanillaDataCache[path] = [];
            }
            resolve(vanillaDataCache[path]);
        }, 300))
    ]);

    return pendingRequests[path];
}

function resolvePath(type, targetId) {
    if (type === 'block') {
        const prefix = 'minecraft:blocks/';
        if (targetId.startsWith(prefix)) {
            return 'blocks/' + targetId.slice(prefix.length) + '.json';
        }
        return null;
    } else if (type === 'entity') {
        const prefix = 'minecraft:entities/';
        if (targetId.startsWith(prefix)) {
            return 'entities/' + targetId.slice(prefix.length) + '.json';
        }
        const entityId = targetId.replace('minecraft:', '');
        return 'entities/' + entityId + '.json';
    } else if (type === 'chest') {
        const prefix = 'minecraft:chests/';
        if (targetId.startsWith(prefix)) {
            return 'chests/' + targetId.slice(prefix.length) + '.json';
        }
        return null;
    } else if (type === 'gameplay') {
        const prefix = 'minecraft:gameplay/';
        if (targetId.startsWith(prefix)) {
            return 'gameplay/' + targetId.slice(prefix.length) + '.json';
        }
        return null;
    }
    return null;
}

// Immutable reader boundary from src/model.js at released commit
// 7b7fae74d864914c9c4f4dab6a2300c8ee0e0ef5, safeImport's first guard.
// No legacy financial engine is copied or executed by this fixture.
export function legacyV190Header(raw){
 if(!raw||![1,2,3].includes(raw.version)||!Array.isArray(raw.providers)||!Array.isArray(raw.positions)||!Array.isArray(raw.snapshots))throw Error('Datei ist kein unterstütztes FolioLab-Backup.');
}

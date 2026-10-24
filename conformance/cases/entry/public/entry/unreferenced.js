// The manifest above names missing.js as its entry. That file is deliberately
// absent - that IS the case's verdict claim. This unreferenced module exists
// so the bundle is not empty (a loader must refuse, not 404 the whole root).
export default { name: 'entry' }

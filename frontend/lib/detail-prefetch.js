"use strict";
// Cache simples em memória para pré-carregar dados de detalhes de imóveis
// Chave: `${brokerSlug}|${propertySlug}`
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDetailKey = makeDetailKey;
exports.setPrefetchedDetail = setPrefetchedDetail;
exports.getPrefetchedDetail = getPrefetchedDetail;
exports.clearPrefetchedDetail = clearPrefetchedDetail;
const CACHE = new Map();
function makeDetailKey(brokerSlug, propertySlug) {
    return `${brokerSlug}|${propertySlug}`;
}
function setPrefetchedDetail(brokerSlug, propertySlug, data) {
    CACHE.set(makeDetailKey(brokerSlug, propertySlug), {
        ...data,
        fetchedAt: Date.now(),
    });
}
function getPrefetchedDetail(brokerSlug, propertySlug, maxAgeMs = 60000 // 1 min padrão
) {
    const key = makeDetailKey(brokerSlug, propertySlug);
    const val = CACHE.get(key);
    if (!val)
        return null;
    if (Date.now() - val.fetchedAt > maxAgeMs) {
        CACHE.delete(key);
        return null;
    }
    return val;
}
function clearPrefetchedDetail(brokerSlug, propertySlug) {
    CACHE.delete(makeDetailKey(brokerSlug, propertySlug));
}

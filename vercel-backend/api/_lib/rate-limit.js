const buckets = globalThis.__weeklyResetRateBuckets || (globalThis.__weeklyResetRateBuckets = new Map());

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown');
}

export function rateLimit(req, res, { name = 'default', limit = 30, windowMs = 60 * 60 * 1000 } = {}) {
  const now = Date.now();
  const key = `${name}:${clientIp(req)}`;
  let item = buckets.get(key);
  if (!item || now >= item.resetAt) item = { count: 0, resetAt: now + windowMs };
  item.count += 1;
  buckets.set(key, item);
  const remaining = Math.max(0, limit - item.count);
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(item.resetAt / 1000)));
  if (item.count > limit) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '请求过于频繁，请稍后再试。' }));
    return false;
  }
  // 清理少量过期 bucket，避免长时间实例内存持续增长。
  if (buckets.size > 500) {
    for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
  }
  return true;
}

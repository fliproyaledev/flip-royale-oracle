// pages/api/cron/update-prices.ts (ORACLE PROJESİNDE)
import { kv } from '@vercel/kv';
import { ensurePriceOrchestrator } from '../../../lib/price_orchestrator';

export default async function handler(req, res) {
  // 1. Orchestrator fiyatları çeker
  const orchestrator = ensurePriceOrchestrator();
  
  // (Burada orchestrator'ın bir "refreshAll" fonksiyonu olduğunu varsayıyoruz)
  await orchestrator.forceRefresh(); 
  
  const allPrices = orchestrator.getAll();

  // 2. Hata Kontrolü: Eğer veri boşsa kaydetme!
  if (allPrices.length === 0) {
      return res.status(500).json({ error: "No prices fetched, skipping update." });
  }

  // 3. Redis'e "Önbellek" Olarak Yaz
  // Bu veri Game projesi tarafından okunacak
  await kv.set('GLOBAL_PRICE_CACHE', JSON.stringify(allPrices));

  return res.status(200).json({ success: true, count: allPrices.length });
}

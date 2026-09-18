import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { indiaStations } from '../data/indiaStations';

/**
 * Import all Indian stations to Firebase
 * Handles BEE India EV Charging Data format
 */
export const importAllStations = async (ownerId = 'system-import') => {
  const result = { imported: 0, skipped: 0, failed: 0 };
  const total = indiaStations.length;

  console.log(`🚀 Starting import of ${total} stations...`);

  for (let i = 0; i < total; i++) {
    const item = indiaStations[i];
    const progress = `[${i + 1}/${total}]`;

    try {
      // Map BEE data fields to our schema
      const station = {
        name: `${item.operator || 'EV'} - ${item.address?.substring(0, 40) || item.city || 'Station'}`,
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        district: item.district || '',
        latitude: String(item.latitude || ''),
        longitude: String(item.longitude || ''),
        chargerTypes: item.chargerType || 'Type-II AC',
        power: item.chargerRating ? `${item.chargerRating} kW` : '7.4 kW',
        chargers: parseInt(item.connectorCount) || 1,
        totalChargers: parseInt(item.connectorCount) || 1,
        price: 15,
        operator: item.operator || 'Unknown',
        ownership: item.ownership || 'Private',
        openingHours: '24/7',
        ownerId: ownerId,
        status: 'active',
        verified: true,
        source: item.source || 'BEE India EV Data',
        averageRating: 4.5,
        totalReviews: 0,
        featured: false,
        createdAt: serverTimestamp(),
      };

      // Validate required fields
      if (!station.name || !station.latitude || !station.longitude) {
        console.warn(`${progress} ⚠️ Skipping invalid station`);
        result.failed++;
        continue;
      }

      // Validate coordinates are in India
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat < 6 || lat > 38 || lng < 68 || lng > 98) {
        console.warn(`${progress} ⚠️ Invalid coords: ${station.name}`);
        result.failed++;
        continue;
      }

      // Check if already exists
      const existing = await getDocs(
        query(
          collection(db, 'stations'),
          where('name', '==', station.name),
          where('latitude', '==', station.latitude)
        )
      );

      if (!existing.empty) {
        result.skipped++;
        continue;
      }

      // Add to Firestore
      await addDoc(collection(db, 'stations'), station);

      // Log progress every 50 stations
      if ((i + 1) % 50 === 0) {
        console.log(`${progress} ✅ Progress: ${result.imported} imported, ${result.skipped} skipped`);
      }
      
      result.imported++;
    } catch (error) {
      console.error(`${progress} ❌ Failed:`, error.message);
      result.failed++;
    }
  }

  console.log('🎉 Import Complete!', result);
  return result;
};

/**
 * Clear all stations (use with caution!)
 */
export const clearAllStations = async () => {
  if (!window.confirm('⚠️ Delete ALL stations? This cannot be undone!')) return 0;
  
  const snapshot = await getDocs(collection(db, 'stations'));
  let deleted = 0;
  
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    deleted++;
  }
  
  return deleted;
};
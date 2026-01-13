// utils/date.ts

export const getWIBDate = () => {
  // Memaksa waktu ke Zona Asia/Jakarta
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Format 24 Jam
  }).replace(/\./g, ':'); // Ganti pemisah waktu titik jadi titik dua (opsional, biar rapi)
};

// Format outputnya akan string: "28/12/2025, 14:30:45"
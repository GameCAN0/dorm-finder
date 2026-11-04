/* ==========================================================================
   ไฟล์: js/index.js
   หน้าที่: ควบคุมหน้าแรก (index.html) แสดงสถิติภาพรวม และการ์ดหอพักแนะนำ 4 แห่ง
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  updateNavCompareBadge();

  const featuredContainer = document.getElementById('featured-dorms-grid');
  const statusBanner = document.getElementById('home-status-banner');
  const statTotalEl = document.getElementById('stat-total-dorms');
  const statMinRentEl = document.getElementById('stat-min-rent');
  const statMinDistEl = document.getElementById('stat-min-distance');
  const statValueCountEl = document.getElementById('stat-value-count');

  function showHomeBanner(msg, type = 'info') {
    if (!statusBanner) return;
    statusBanner.textContent = msg;
    statusBanner.className = 'status-banner ' + type;
    statusBanner.hidden = false;
  }

  try {
    const dorms = await fetchDormsData();

    // อัปเดตสถิติจากข้อมูลจริงใน dorms.json
    if (statTotalEl) statTotalEl.textContent = dorms.length + ' แห่ง';
    if (statMinRentEl) {
      const minRent = Math.min(...dorms.map(d => d.rent));
      statMinRentEl.textContent = minRent.toLocaleString('th-TH') + ' บาท';
    }
    if (statMinDistEl) {
      const minDist = Math.min(...dorms.map(d => d.distanceKm));
      statMinDistEl.textContent = minDist + ' กม.';
    }
    if (statValueCountEl) {
      const valCount = dorms.filter(d => d.isBestValue).length;
      statValueCountEl.textContent = valCount + ' แห่ง';
    }

    // คัดเลือกหอพักแนะนำ 4 แห่งที่โดดเด่น (ใกล้สุด, คุ้มค่าสุดแอร์, ใกล้ BTS, พัดลมประหยัดสุด)
    const featuredIds = ['d01', 'd09', 'd02', 'd15'];
    const featuredDorms = featuredIds
      .map(id => dorms.find(d => d.id === id))
      .filter(Boolean);

    if (featuredContainer) {
      featuredContainer.textContent = '';
      featuredDorms.forEach(dorm => {
        const card = createDormCardElement(dorm, showHomeBanner);
        featuredContainer.appendChild(card);
      });
    }
  } catch (err) {
    if (featuredContainer) {
      featuredContainer.textContent = '';
      const errBox = document.createElement('div');
      errBox.className = 'status-banner error';
      errBox.textContent = 'ไม่สามารถดึงข้อมูลจาก data/dorms.json ได้ กรุณาเปิดผ่าน Live Server หรือเว็บเซิร์ฟเวอร์';
      featuredContainer.appendChild(errBox);
    }
  }
});

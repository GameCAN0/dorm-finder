/* ==========================================================================
   ไฟล์: js/dorms.js
   หน้าที่: ควบคุมหน้า dorms.html (F1 สร้างการ์ดด้วย DOM, F2 กรองหลายเงื่อนไขและเรียงลำดับ, F3 เปรียบเทียบ)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  updateNavCompareBadge();

  const listContainer = document.getElementById('dorms-grid-container');
  const resultCountEl = document.getElementById('filter-result-count');
  const statusBanner = document.getElementById('dorms-status-banner');
  const filterForm = document.getElementById('dorm-filter-form');
  const keywordInput = document.getElementById('search-keyword');
  const maxRentSelect = document.getElementById('filter-max-rent');
  const maxDistSelect = document.getElementById('filter-max-distance');
  const roomTypeSelect = document.getElementById('filter-room-type');
  const sortBySelect = document.getElementById('sort-by');
  const onlyValueCheck = document.getElementById('filter-only-value');
  const onlyFavCheck = document.getElementById('filter-only-fav');
  const resetBtn = document.getElementById('reset-filters-btn');
  const facilityCheckboxes = document.querySelectorAll('input[name="facility"]');

  let allDorms = [];

  function showStatus(msg, type = 'info') {
    if (!statusBanner) return;
    statusBanner.textContent = msg;
    statusBanner.className = 'status-banner ' + type;
    statusBanner.hidden = false;
  }

  // อ่านค่า Query Parameters จากหน้าแรก (เช่น dorms.html?q=...&roomType=...)
  const params = new URLSearchParams(window.location.search);
  if (params.get('q') && keywordInput) {
    keywordInput.value = params.get('q');
  }
  if (params.get('roomType') && roomTypeSelect) {
    roomTypeSelect.value = params.get('roomType');
  }

  function applyFiltersAndRender() {
    const keyword = (keywordInput ? keywordInput.value : '').trim().toLowerCase();
    const maxRent = maxRentSelect && maxRentSelect.value !== 'all' ? Number(maxRentSelect.value) : Infinity;
    const maxDist = maxDistSelect && maxDistSelect.value !== 'all' ? Number(maxDistSelect.value) : Infinity;
    const roomType = roomTypeSelect ? roomTypeSelect.value : 'all';
    const sortBy = sortBySelect ? sortBySelect.value : 'distance-asc';
    const onlyValue = onlyValueCheck ? onlyValueCheck.checked : false;
    const onlyFav = onlyFavCheck ? onlyFavCheck.checked : false;
    const favIds = getFavoritesList();

    const selectedFacilities = Array.from(facilityCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    // F2: กรองข้อมูลหอพักตามเงื่อนไขทั้งหมด (Checkbox สิ่งอำนวยความสะดวกต้องมีครบทุกข้อที่เลือกด้วย .every())
    const filtered = allDorms.filter(dorm => {
      const matchName = !keyword ||
        dorm.name.toLowerCase().includes(keyword) ||
        dorm.address.toLowerCase().includes(keyword);
      const matchRent = dorm.rent <= maxRent;
      const matchDist = dorm.distanceKm <= maxDist;
      const matchType = roomType === 'all' || dorm.roomType === roomType;
      const matchValue = !onlyValue || dorm.isBestValue;
      const matchFav = !onlyFav || favIds.includes(dorm.id);
      const matchFacilities = selectedFacilities.every(fac => dorm.facilities.includes(fac));

      return matchName && matchRent && matchDist && matchType && matchValue && matchFav && matchFacilities;
    });

    // การเรียงลำดับตามค่าเช่า ระยะทาง หรือคะแนนรีวิว
    filtered.sort((a, b) => {
      if (sortBy === 'rent-asc') return a.rent - b.rent;
      if (sortBy === 'rent-desc') return b.rent - a.rent;
      if (sortBy === 'estimated-asc') return a.estimatedMonthly - b.estimatedMonthly;
      if (sortBy === 'rating-desc') return b.ratingAverage - a.ratingAverage;
      return a.distanceKm - b.distanceKm;
    });

    if (resultCountEl) {
      resultCountEl.textContent = 'พบหอพักที่ตรงเงื่อนไข ' + filtered.length + ' แห่ง (จากทั้งหมด ' + allDorms.length + ' แห่ง)';
    }

    if (!listContainer) return;
    listContainer.textContent = '';

    if (filtered.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'empty-state';
      const p = document.createElement('p');
      p.textContent = 'ไม่พบหอพักที่ตรงกับตัวกรองที่คุณเลือก ลองปรับลดเงื่อนไขหรือกดล้างตัวกรอง';
      emptyBox.appendChild(p);
      listContainer.appendChild(emptyBox);
      return;
    }

    filtered.forEach(dorm => {
      const card = createDormCardElement(dorm, (msg, type) => {
        showStatus(msg, type);
        if (onlyFavCheck && onlyFavCheck.checked) {
          applyFiltersAndRender();
        }
      });
      listContainer.appendChild(card);
    });
  }

  try {
    allDorms = await fetchDormsData();
    applyFiltersAndRender();
  } catch (err) {
    showStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล data/dorms.json กรุณาตรวจสอบการเปิดผ่าน Live Server', 'error');
  }

  if (filterForm) {
    filterForm.addEventListener('submit', e => {
      e.preventDefault();
      applyFiltersAndRender();
    });
    filterForm.addEventListener('input', applyFiltersAndRender);
    filterForm.addEventListener('change', applyFiltersAndRender);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (filterForm) filterForm.reset();
      if (statusBanner) statusBanner.hidden = true;
      applyFiltersAndRender();
    });
  }
});

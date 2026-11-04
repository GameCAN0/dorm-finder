/**
 * Dorm Finder - Group 7 Main JavaScript
 * Handles DOM manipulation, Fetch API, LocalStorage, Filters, Calculator, Comparison & Reviews.
 */

// Storage Keys
const COMPARE_KEY = 'dorm_compare_list';
const FAV_KEY = 'dorm_favorites_list';
const REVIEWS_KEY = 'dorm_reviews_list';

// Global Data Store
let allDorms = [];

// Helper: Show Toast Notification
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// LocalStorage Helpers
function getCompareList() {
  return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
}

function saveCompareList(list) {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
  updateNavBadges();
}

function getFavorites() {
  return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
}

function saveFavorites(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

function getStoredReviews() {
  return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
}

function saveStoredReviews(list) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
}

// Update Nav Badges
function updateNavBadges() {
  const compareList = getCompareList();
  const badge = document.getElementById('compare-badge');
  if (badge) {
    badge.textContent = compareList.length;
  }
}

// Toggle Compare Item (F3)
function toggleCompare(dormId) {
  let list = getCompareList();
  if (list.includes(dormId)) {
    list = list.filter(id => id !== dormId);
    saveCompareList(list);
    showToast('ยกเลิกการเลือกเปรียบเทียบแล้ว');
  } else {
    if (list.length >= 3) {
      alert('คุณสามารถเลือกเปรียบเทียบหอพักได้สูงสุด 3 แห่งเท่านั้น');
      return false;
    }
    list.push(dormId);
    saveCompareList(list);
    showToast('เพิ่มหอพักเข้าตารางเปรียบเทียบแล้ว');
  }
  return true;
}

// Toggle Favorite Item (Extra Feature)
function toggleFavorite(dormId) {
  let list = getFavorites();
  if (list.includes(dormId)) {
    list = list.filter(id => id !== dormId);
    showToast('ลบออกจากรายการโปรด');
  } else {
    list.push(dormId);
    showToast('บันทึกในรายการโปรดเรียบร้อย');
  }
  saveFavorites(list);
}

// Calculate Average Rent by Room Type (For "Value Badge")
function getAverageRentByType(dorms, roomType) {
  const filtered = dorms.filter(d => d.roomType === roomType);
  if (filtered.length === 0) return 0;
  const sum = filtered.reduce((acc, curr) => acc + curr.rent, 0);
  return sum / filtered.length;
}

// Fetch Dorms Data (F1 & T7)
async function fetchDorms() {
  try {
    const response = await fetch('data/dorms.json');
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    allDorms = await response.json();
    return allDorms;
  } catch (error) {
    console.error('Failed to load dorms:', error);
    const container = document.getElementById('dorm-grid') || document.getElementById('featured-grid');
    if (container) {
      container.innerHTML = `<div class="form-panel" style="color:var(--danger)">เกิดข้อผิดพลาดในการโหลดข้อมูลหอพัก กรุณาลองใหม่อีกครั้ง</div>`;
    }
    return [];
  }
}

// Create Card Element DOM Node
function createDormCard(dorm, avgRent) {
  const isValue = dorm.rent < avgRent;
  const compareList = getCompareList();
  const isCompared = compareList.includes(dorm.id);
  const favList = getFavorites();
  const isFav = favList.includes(dorm.id);

  const card = document.createElement('article');
  card.className = 'dorm-card';
  card.dataset.id = dorm.id;

  const facilitiesHTML = dorm.facilities.map(f => `<span class="facility-tag">${f}</span>`).join('');

  card.innerHTML = `
    <div class="dorm-img-wrapper">
      <img src="${dorm.image}" alt="ภาพหอพัก ${dorm.name}" class="dorm-img" loading="lazy">
      ${isValue ? `<span class="badge-value-tag">💡 คุ้มค่า (ต่ำกว่าค่าเฉลี่ย)</span>` : ''}
      <button type="button" class="fav-btn" aria-label="${isFav ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}" data-fav="${dorm.id}">
        ${isFav ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="dorm-info">
      <h3 class="dorm-title">${dorm.name}</h3>
      <div class="dorm-meta">
        <span>📍 ${dorm.distanceKm} กม. จาก ม.</span>
        <span>🚪 ${dorm.roomType}</span>
      </div>
      <div class="dorm-price">฿${dorm.rent.toLocaleString()} / เดือน</div>
      <div class="facilities-list">${facilitiesHTML}</div>
      <div class="dorm-actions">
        <a href="dorm.html?id=${dorm.id}" class="btn btn-secondary btn-sm" style="flex:1">รายละเอียด</a>
        <button type="button" class="btn ${isCompared ? 'btn-primary' : 'btn-outline'} btn-sm compare-btn" data-id="${dorm.id}">
          ${isCompared ? '✓ เลือกเทียบแล้ว' : '+ เปรียบเทียบ'}
        </button>
      </div>
    </div>
  `;

  // Event Listeners (No inline JS events)
  const compareBtn = card.querySelector('.compare-btn');
  compareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleCompare(dorm.id);
    const updatedList = getCompareList();
    const nowCompared = updatedList.includes(dorm.id);
    compareBtn.textContent = nowCompared ? '✓ เลือกเทียบแล้ว' : '+ เปรียบเทียบ';
    compareBtn.className = `btn ${nowCompared ? 'btn-primary' : 'btn-outline'} btn-sm compare-btn`;
  });

  const favBtn = card.querySelector('.fav-btn');
  favBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFavorite(dorm.id);
    const updatedFavs = getFavorites();
    const nowFav = updatedFavs.includes(dorm.id);
    favBtn.textContent = nowFav ? '❤️' : '🤍';
    favBtn.setAttribute('aria-label', nowFav ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด');
  });

  return card;
}

// Page Specific Initializers
document.addEventListener('DOMContentLoaded', () => {
  updateNavBadges();

  const page = document.body.dataset.page;
  if (page === 'index') {
    initIndexPage();
  } else if (page === 'dorms') {
    initDormsPage();
  } else if (page === 'dorm-detail') {
    initDormDetailPage();
  } else if (page === 'compare') {
    initComparePage();
  } else if (page === 'review') {
    initReviewPage();
  }
});

// Index Page JS
async function initIndexPage() {
  const dorms = await fetchDorms();
  const grid = document.getElementById('featured-grid');
  if (!grid || dorms.length === 0) return;

  grid.innerHTML = '';
  // Show top 3 closest dorms
  const featured = [...dorms].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);
  featured.forEach(dorm => {
    const avg = getAverageRentByType(dorms, dorm.roomType);
    grid.appendChild(createDormCard(dorm, avg));
  });
}

// Dorms Listing & Filter Page JS (F2)
async function initDormsPage() {
  const dorms = await fetchDorms();
  const grid = document.getElementById('dorm-grid');
  const countEl = document.getElementById('dorm-count');
  if (!grid) return;

  const searchInput = document.getElementById('search-input');
  const maxPriceInput = document.getElementById('max-price');
  const priceVal = document.getElementById('price-val');
  const maxDistanceInput = document.getElementById('max-distance');
  const roomTypeSelect = document.getElementById('room-type');
  const sortSelect = document.getElementById('sort-select');
  const facilityCheckboxes = document.querySelectorAll('.facility-checkbox');

  function renderFilteredDorms() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const maxPrice = maxPriceInput ? parseFloat(maxPriceInput.value) : Infinity;
    const maxDist = maxDistanceInput ? parseFloat(maxDistanceInput.value) : Infinity;
    const roomType = roomTypeSelect ? roomTypeSelect.value : 'all';
    const selectedFacilities = Array.from(facilityCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    let filtered = dorms.filter(dorm => {
      // Name match
      const matchName = dorm.name.toLowerCase().includes(query);
      // Rent range match
      const matchPrice = dorm.rent <= maxPrice;
      // Distance match
      const matchDist = isNaN(maxDist) || dorm.distanceKm <= maxDist;
      // Room type match
      const matchRoom = roomType === 'all' || dorm.roomType === roomType;
      // Facilities MUST match ALL selected checkboxes
      const matchFacilities = selectedFacilities.every(fac => dorm.facilities.includes(fac));

      return matchName && matchPrice && matchDist && matchRoom && matchFacilities;
    });

    // Sorting
    const sortVal = sortSelect ? sortSelect.value : 'rent-asc';
    if (sortVal === 'rent-asc') {
      filtered.sort((a, b) => a.rent - b.rent);
    } else if (sortVal === 'rent-desc') {
      filtered.sort((a, b) => b.rent - a.rent);
    } else if (sortVal === 'dist-asc') {
      filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    grid.innerHTML = '';
    if (countEl) countEl.textContent = `พบ ${filtered.length} แห่ง`;

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="form-panel" style="grid-column: 1 / -1; text-align: center;">ไม่พบหอพักที่ตรงกับเงื่อนไขการค้นหา</div>`;
      return;
    }

    filtered.forEach(dorm => {
      const avg = getAverageRentByType(dorms, dorm.roomType);
      grid.appendChild(createDormCard(dorm, avg));
    });
  }

  // Price slider listener
  if (maxPriceInput && priceVal) {
    maxPriceInput.addEventListener('input', () => {
      priceVal.textContent = `฿${parseFloat(maxPriceInput.value).toLocaleString()}`;
      renderFilteredDorms();
    });
  }

  // Event Listeners for Filters
  [searchInput, maxDistanceInput, roomTypeSelect, sortSelect].forEach(el => {
    if (el) el.addEventListener('input', renderFilteredDorms);
  });
  facilityCheckboxes.forEach(cb => cb.addEventListener('change', renderFilteredDorms));

  renderFilteredDorms();
}

// Dorm Detail Page JS & Monthly Calculator (F5)
async function initDormDetailPage() {
  const dorms = await fetchDorms();
  const urlParams = new URLSearchParams(window.location.search);
  const dormId = urlParams.get('id') || (dorms[0] ? dorms[0].id : null);
  const dorm = dorms.find(d => d.id === dormId);

  const container = document.getElementById('dorm-detail-container');
  if (!dorm || !container) {
    if (container) container.innerHTML = '<p>ไม่พบข้อมูลหอพักที่คุณต้องการ</p>';
    return;
  }

  const avgRent = getAverageRentByType(dorms, dorm.roomType);
  const isValue = dorm.rent < avgRent;
  const compareList = getCompareList();
  const isCompared = compareList.includes(dorm.id);

  container.innerHTML = `
    <div class="dorm-detail-grid">
      <div>
        <img src="${dorm.image}" alt="${dorm.name}" style="width:100%; height:320px; object-fit:cover; border-radius:var(--radius);" />
        <h1 style="margin-top:1rem">${dorm.name} ${isValue ? `<span style="font-size:0.9rem; background:#2f855a; color:white; padding:0.2rem 0.5rem; border-radius:4px; vertical-align:middle;">💡 คุ้มค่า</span>` : ''}</h1>
        <p style="color:var(--text-muted); margin-bottom:1rem;">📍 ระยะทาง: ${dorm.distanceKm} กม. จากมหาวิทยาลัย | 🚪 ประเภท: ${dorm.roomType}</p>
        
        <div class="form-panel">
          <h2>ข้อมูลทั่วไป</h2>
          <p><strong>ค่าเช่า:</strong> ฿${dorm.rent.toLocaleString()} / เดือน</p>
          <p><strong>เงินมัดจำ/ประกัน:</strong> ฿${dorm.deposit.toLocaleString()} บาท</p>
          <p><strong>อัตราค่าไฟ:</strong> ฿${dorm.electricRate} บาท/หน่วย</p>
          <p><strong>ค่าน้ำ:</strong> ฿${dorm.waterFlat} บาท/เดือน (เหมาจ่าย)</p>
          <p><strong>ค่าอินเทอร์เน็ต:</strong> ${dorm.internet === 0 ? 'ฟรี' : '฿' + dorm.internet + ' บาท/เดือน'}</p>
          <p><strong>ช่องทางติดต่อ:</strong> ${dorm.contact}</p>
          
          <h3 style="margin-top:1rem;">สิ่งอำนวยความสะดวก</h3>
          <div class="facilities-list">
            ${dorm.facilities.map(f => `<span class="facility-tag">${f}</span>`).join('')}
          </div>

          <div style="margin-top:1.5rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" id="detail-compare-btn" class="btn ${isCompared ? 'btn-primary' : 'btn-outline'}">
              ${isCompared ? '✓ เลือกเทียบแล้ว' : '+ เพิ่มเพื่อเปรียบเทียบ'}
            </button>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${dorm.latitude},${dorm.longitude}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
              🗺️ เส้นทางใน Google Maps
            </a>
          </div>
        </div>
      </div>

      <div>
        <!-- Monthly Cost Calculator (F5) -->
        <div class="form-panel">
          <h2>🧮 เครื่องคำนวณค่าใช้จ่ายรายเดือน</h2>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1rem;">ประมาณการค่าใช้จ่ายต่อเดือนโดยคำนวณจากหน่วยไฟและจำนวนผู้พักอาศัย</p>
          <form id="calc-form">
            <div class="form-group">
              <label for="calc-electric">จำนวนหน่วยไฟฟ้าที่คาดว่าจะใช้ (หน่วย):</label>
              <input type="number" id="calc-electric" class="form-control" value="100" min="0" required />
            </div>
            <div class="form-group">
              <label for="calc-occupants">จำนวนคนพัก (คน):</label>
              <input type="number" id="calc-occupants" class="form-control" value="1" min="1" max="4" required />
            </div>
          </form>

          <div style="background:#edf2f7; padding:1rem; border-radius:var(--radius); margin-top:1rem;">
            <p><strong>ค่าเช่าห้อง:</strong> <span id="out-rent">฿${dorm.rent.toLocaleString()}</span></p>
            <p><strong>ค่าไฟฟ้า (${dorm.electricRate}฿/หน่วย):</strong> <span id="out-electric">฿700</span></p>
            <p><strong>ค่าน้ำ:</strong> ฿${dorm.waterFlat}</p>
            <p><strong>ค่าเน็ต:</strong> ฿${dorm.internet}</p>
            <hr style="margin:0.5rem 0; border:0; border-top:1px solid var(--border-color);" />
            <p style="font-size:1.1rem; font-weight:bold; color:var(--primary);">
              ยอดรวมทั้งสิ้น: <span id="out-total">฿0</span> / เดือน
            </p>
            <p style="font-size:1.2rem; font-weight:bold; color:#2b6cb0; margin-top:0.25rem;">
              เฉลี่ยจ่ายต่อคน: <span id="out-per-person">฿0</span> / เดือน
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Dynamic Calculator Logic
  const electricInput = document.getElementById('calc-electric');
  const occupantsInput = document.getElementById('calc-occupants');

  function updateCalc() {
    const units = parseFloat(electricInput.value) || 0;
    const occupants = Math.max(1, parseInt(occupantsInput.value) || 1);

    const electricCost = units * dorm.electricRate;
    const total = dorm.rent + electricCost + dorm.waterFlat + dorm.internet;
    const perPerson = total / occupants;

    document.getElementById('out-electric').textContent = `฿${electricCost.toLocaleString()}`;
    document.getElementById('out-total').textContent = `฿${total.toLocaleString()}`;
    document.getElementById('out-per-person').textContent = `฿${Math.round(perPerson).toLocaleString()}`;
  }

  electricInput.addEventListener('input', updateCalc);
  occupantsInput.addEventListener('input', updateCalc);
  updateCalc();

  // Compare Toggle Button
  const compareBtn = document.getElementById('detail-compare-btn');
  compareBtn.addEventListener('click', () => {
    toggleCompare(dorm.id);
    const updated = getCompareList().includes(dorm.id);
    compareBtn.textContent = updated ? '✓ เลือกเทียบแล้ว' : '+ เพิ่มเพื่อเปรียบเทียบ';
    compareBtn.className = `btn ${updated ? 'btn-primary' : 'btn-outline'}`;
  });
}

// Compare Page JS (F4)
async function initComparePage() {
  const dorms = await fetchDorms();
  const compareIds = getCompareList();
  const tableContainer = document.getElementById('compare-table-container');
  if (!tableContainer) return;

  if (compareIds.length === 0) {
    tableContainer.innerHTML = `
      <div class="form-panel" style="text-align:center; padding:2rem;">
        <p>ยังไม่มีรายการหอพักที่คุณเลือกเปรียบเทียบ</p>
        <a href="dorms.html" class="btn btn-primary" style="margin-top:1rem;">ไปหน้าเลือกหอพัก</a>
      </div>
    `;
    return;
  }

  const selectedDorms = compareIds.map(id => dorms.find(d => d.id === id)).filter(Boolean);

  // Find Best Values
  const minRent = Math.min(...selectedDorms.map(d => d.rent));
  const minDist = Math.min(...selectedDorms.map(d => d.distanceKm));
  const minElec = Math.min(...selectedDorms.map(d => d.electricRate));

  let tableHTML = `
    <div class="table-responsive">
      <table class="compare-table">
        <caption>ตารางเปรียบเทียบข้อมูลหอพักที่เลือก (${selectedDorms.length} แห่ง)</caption>
        <thead>
          <tr>
            <th scope="col">หัวข้อการเปรียบเทียบ</th>
            ${selectedDorms.map(d => `
              <th scope="col" style="text-align:center">
                <img src="${d.image}" alt="${d.name}" style="width:100%; height:110px; object-fit:cover; border-radius:4px; margin-bottom:0.5rem;" />
                <div><strong>${d.name}</strong></div>
                <button type="button" class="btn btn-secondary btn-sm remove-compare-btn" data-id="${d.id}" style="margin-top:0.5rem;">✕ ลบออก</button>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">ค่าเช่ารายเดือน</th>
            ${selectedDorms.map(d => {
              const isBest = d.rent === minRent;
              return `<td class="${isBest ? 'best-cell' : ''}">
                ฿${d.rent.toLocaleString()} / เดือน
                ${isBest ? `<br><span class="best-badge">✓ ถูกที่สุด</span>` : ''}
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <th scope="row">ระยะทางจาก ม.</th>
            ${selectedDorms.map(d => {
              const isBest = d.distanceKm === minDist;
              return `<td class="${isBest ? 'best-cell' : ''}">
                ${d.distanceKm} กม.
                ${isBest ? `<br><span class="best-badge">✓ ใกล้ที่สุด</span>` : ''}
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <th scope="row">ประเภทห้อง</th>
            ${selectedDorms.map(d => `<td>${d.roomType}</td>`).join('')}
          </tr>
          <tr>
            <th scope="row">ค่ามัดจำ</th>
            ${selectedDorms.map(d => `<td>฿${d.deposit.toLocaleString()}</td>`).join('')}
          </tr>
          <tr>
            <th scope="row">อัตราค่าไฟ</th>
            ${selectedDorms.map(d => {
              const isBest = d.electricRate === minElec;
              return `<td class="${isBest ? 'best-cell' : ''}">
                ฿${d.electricRate} / หน่วย
                ${isBest ? `<br><span class="best-badge">✓ ค่าไฟถูกที่สุด</span>` : ''}
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <th scope="row">ค่าน้ำ</th>
            ${selectedDorms.map(d => `<td>฿${d.waterFlat} / เดือน</td>`).join('')}
          </tr>
          <tr>
            <th scope="row">ค่าอินเทอร์เน็ต</th>
            ${selectedDorms.map(d => `<td>${d.internet === 0 ? 'ฟรี' : '฿' + d.internet}</td>`).join('')}
          </tr>
          <tr>
            <th scope="row">สิ่งอำนวยความสะดวก</th>
            ${selectedDorms.map(d => `
              <td>${d.facilities.map(f => `<span class="facility-tag" style="margin-bottom:2px; display:inline-block;">${f}</span>`).join(' ')}</td>
            `).join('')}
          </tr>
          <tr>
            <th scope="row">การดำเนินการ</th>
            ${selectedDorms.map(d => `
              <td style="text-align:center;">
                <a href="dorm.html?id=${d.id}" class="btn btn-primary btn-sm">ดูรายละเอียด & คำนวณ</a>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;

  tableContainer.innerHTML = tableHTML;

  // Add event listener to remove buttons
  const removeBtns = tableContainer.querySelectorAll('.remove-compare-btn');
  removeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      toggleCompare(id);
      initComparePage();
    });
  });
}

// Review Page JS (F6)
async function initReviewPage() {
  const dorms = await fetchDorms();
  const selectDorm = document.getElementById('review-dorm');
  const reviewForm = document.getElementById('review-form');
  const reviewsContainer = document.getElementById('reviews-list');

  if (selectDorm) {
    selectDorm.innerHTML = '<option value="">-- กรุณาเลือกหอพัก --</option>' +
      dorms.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  }

  function renderReviews() {
    const reviews = getStoredReviews();
    if (!reviewsContainer) return;

    if (reviews.length === 0) {
      reviewsContainer.innerHTML = '<p class="text-muted">ยังไม่มีรีวิว บันทึกเป็นคนแรกเลย!</p>';
      return;
    }

    reviewsContainer.innerHTML = reviews.map(r => {
      const dormName = dorms.find(d => d.id === r.dormId)?.name || 'หอพัก';
      const stars = '⭐'.repeat(r.rating);
      return `
        <div class="form-panel" style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>${dormName}</h3>
            <span>${stars} (${r.rating}/5)</span>
          </div>
          <p style="color:var(--text-muted); font-size:0.85rem;">โดย: ${r.author} | ความสะอาด: ${r.cleanliness} | ความปลอดภัย: ${r.safety}</p>
          <p style="margin-top:0.5rem;">${r.comment}</p>
          <small style="color:var(--text-muted);">${new Date(r.date).toLocaleDateString('th-TH')}</small>
        </div>
      `;
    }).join('');
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const dormId = selectDorm.value;
      const rating = reviewForm.querySelector('input[name="rating"]:checked');
      const cleanliness = document.getElementById('cleanliness').value;
      const safety = document.getElementById('safety').value;
      const author = document.getElementById('author').value.trim();
      const comment = document.getElementById('comment').value.trim();
      const errorMsg = document.getElementById('form-error');

      if (!dormId || !rating || !cleanliness || !safety || !author || !comment) {
        if (errorMsg) errorMsg.textContent = 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง';
        return;
      }

      if (comment.length < 10) {
        if (errorMsg) errorMsg.textContent = 'ความคิดเห็นต้องมีความยาวอย่างน้อย 10 ตัวอักษร';
        return;
      }

      if (errorMsg) errorMsg.textContent = '';

      const newReview = {
        dormId,
        rating: parseInt(rating.value),
        cleanliness,
        safety,
        author,
        comment,
        date: new Date().toISOString()
      };

      const current = getStoredReviews();
      current.unshift(newReview);
      saveStoredReviews(current);

      showToast('บันทึกรีวิวของคุณเรียบร้อยแล้ว!');
      reviewForm.reset();
      renderReviews();
    });
  }

  renderReviews();
}

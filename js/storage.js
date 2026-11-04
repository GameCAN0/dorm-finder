/* ==========================================================================
   ไฟล์: js/storage.js
   หน้าที่: จัดการ localStorage ทั้งหมด (รายการเปรียบเทียบ F3, รีวิว F6, รายการโปรด)
   และอัปเดตตัวเลขจำนวนหอพักที่เลือกบนแถบเมนู <nav> ทุกหน้า
   ========================================================================== */

const STORAGE_KEYS = {
  COMPARE: 'dormFinder_compare_v1',
  REVIEWS: 'dormFinder_reviews_v1',
  FAVORITES: 'dormFinder_favorites_v1'
};

// รีวิวตั้งต้น (Seed Data) เพื่อให้หน้าเว็บแสดงคะแนนเฉลี่ยและตัวอย่างรีวิวได้ทันทีเมื่อเปิดครั้งแรก
const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    dormId: 'd01',
    reviewerName: 'ธนภัทร (นศ.ปี 2 คณะวิทย์)',
    rating: 5,
    cleanliness: 5,
    safety: 5,
    comment: 'เดินไปเรียน มรภ.บ้านสมเด็จฯ สะดวกมาก แค่ 300 เมตร มีรปภ.และคีย์การ์ดดูแลตลอด 24 ชม.',
    createdAt: '2026-10-15'
  },
  {
    id: 'rev-2',
    dormId: 'd02',
    reviewerName: 'พิมพ์ชนก (นศ.ปี 3 คณะครุศาสตร์)',
    rating: 4,
    cleanliness: 4,
    safety: 4,
    comment: 'ห้องแอร์ราคาประหยัด เงินประกันไม่แพง ใกล้ป้ายรถเมล์และวงเวียนใหญ่ หาของกินง่ายมาก',
    createdAt: '2026-10-20'
  },
  {
    id: 'rev-3',
    dormId: 'd09',
    reviewerName: 'กิตติพงศ์ (นศ.ปี 1 คณะวิทยาการจัดการ)',
    rating: 5,
    cleanliness: 4,
    safety: 5,
    comment: 'คุ้มค่าที่สุดเพราะค่าไฟหน่วยละ 5 บาท ค่าน้ำเรทการประปา เปิดแอร์อ่านหนังสือช่วงสอบได้สบายใจ',
    createdAt: '2026-10-28'
  },
  {
    id: 'rev-4',
    dormId: 'd15',
    reviewerName: 'ณัฐธิดา (นศ.ปี 2 คณะมนุษยศาสตร์ฯ)',
    rating: 5,
    cleanliness: 5,
    safety: 5,
    comment: 'หอพักสตรีสะอาดและเงียบสงบมาก ผู้ปกครองสบายใจ มีกล้องวงจรปิดและคีย์การ์ดครบ',
    createdAt: '2026-11-01'
  }
];

function safeGetStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('ไม่สามารถอ่าน localStorage ได้:', err);
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('ไม่สามารถบันทึก localStorage ได้:', err);
    return false;
  }
}

// --- จัดการรายการเปรียบเทียบ (F3: สูงสุด 3 แห่ง) ---
function getCompareList() {
  const list = safeGetStorage(STORAGE_KEYS.COMPARE, []);
  return Array.isArray(list) ? list : [];
}

function toggleCompareDorm(dormId) {
  const current = getCompareList();
  const idx = current.indexOf(dormId);

  if (idx !== -1) {
    current.splice(idx, 1);
    safeSetStorage(STORAGE_KEYS.COMPARE, current);
    updateNavCompareBadge();
    return { status: 'removed', list: current, message: 'นำหอพักออกจากรายการเปรียบเทียบแล้ว' };
  }

  if (current.length >= 3) {
    return {
      status: 'limit_exceeded',
      list: current,
      message: 'เลือกเปรียบเทียบได้สูงสุด 3 แห่งเท่านั้น กรุณานำหอพักเดิมออกก่อนเพิ่มหอใหม่'
    };
  }

  current.push(dormId);
  safeSetStorage(STORAGE_KEYS.COMPARE, current);
  updateNavCompareBadge();
  return { status: 'added', list: current, message: 'เพิ่มหอพักเข้าสู่ตารางเปรียบเทียบแล้ว (' + current.length + '/3)' };
}

function clearCompareList() {
  safeSetStorage(STORAGE_KEYS.COMPARE, []);
  updateNavCompareBadge();
}

function updateNavCompareBadge() {
  const count = getCompareList().length;
  const badges = document.querySelectorAll('.js-compare-count');
  badges.forEach(badge => {
    badge.textContent = count + '/3';
    badge.setAttribute('aria-label', 'เลือกเปรียบเทียบแล้ว ' + count + ' จาก 3 แห่ง');
  });
}

// --- จัดการรายการโปรด (ฟีเจอร์เสริม G3) ---
function getFavoritesList() {
  const list = safeGetStorage(STORAGE_KEYS.FAVORITES, []);
  return Array.isArray(list) ? list : [];
}

function toggleFavoriteDorm(dormId) {
  const current = getFavoritesList();
  const idx = current.indexOf(dormId);
  let added = false;

  if (idx !== -1) {
    current.splice(idx, 1);
  } else {
    current.push(dormId);
    added = true;
  }
  safeSetStorage(STORAGE_KEYS.FAVORITES, current);
  return { added, list: current };
}

// --- จัดการข้อมูลรีวิวและคำนวณคะแนนเฉลี่ย (F6) ---
function getReviewsList() {
  const stored = safeGetStorage(STORAGE_KEYS.REVIEWS, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    safeSetStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    return INITIAL_REVIEWS;
  }
  return stored;
}

function addDormReview(newReview) {
  const reviews = getReviewsList();
  const entry = {
    id: 'rev-' + Date.now(),
    dormId: newReview.dormId,
    reviewerName: newReview.reviewerName.trim(),
    rating: Number(newReview.rating),
    cleanliness: Number(newReview.cleanliness),
    safety: Number(newReview.safety),
    comment: newReview.comment.trim(),
    createdAt: new Date().toISOString().slice(0, 10)
  };
  reviews.unshift(entry);
  safeSetStorage(STORAGE_KEYS.REVIEWS, reviews);
  return entry;
}

function getDormRatingSummary(dormId) {
  const reviews = getReviewsList().filter(r => r.dormId === dormId);
  if (reviews.length === 0) {
    return { average: 0, count: 0, cleanlinessAvg: 0, safetyAvg: 0 };
  }
  const sumRating = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
  const sumClean = reviews.reduce((acc, r) => acc + Number(r.cleanliness), 0);
  const sumSafety = reviews.reduce((acc, r) => acc + Number(r.safety), 0);
  return {
    average: Number((sumRating / reviews.length).toFixed(1)),
    count: reviews.length,
    cleanlinessAvg: Number((sumClean / reviews.length).toFixed(1)),
    safetyAvg: Number((sumSafety / reviews.length).toFixed(1))
  };
}

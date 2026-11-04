/* ==========================================================================
   ไฟล์: js/data-service.js
   หน้าที่: ดึงข้อมูลหอพักด้วย fetch('data/dorms.json') ตามข้อกำหนด F1 & T7
   พร้อมคำนวณค่าเฉลี่ยแยกตามประเภทห้องเพื่อติดป้าย "คุ้มค่า" (ฟีเจอร์เสริม G3)
   และสร้างการ์ดหอพักด้วย DOM (createElement + addEventListener)
   ========================================================================== */

const UNIVERSITY_COORDS = {
  name: 'มหาวิทยาลัยราชภัฏบ้านสมเด็จเจ้าพระยา',
  lat: 13.7319,
  lng: 100.4895
};

const DEFAULT_ELECTRIC_UNITS = 100;

async function fetchDormsData() {
  try {
    const response = await fetch('data/dorms.json');
    if (!response.ok) {
      throw new Error('HTTP Error: ' + response.status);
    }
    const rawDorms = await response.json();
    return enrichDormsWithMetrics(rawDorms);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล data/dorms.json:', error);
    throw error;
  }
}

function calculateEstimatedMonthly(dorm, elecUnits = DEFAULT_ELECTRIC_UNITS) {
  const rent = Number(dorm.rent) || 0;
  const elec = (Number(dorm.electricRate) || 0) * elecUnits;
  const water = Number(dorm.waterFlat) || 0;
  const net = Number(dorm.internet) || 0;
  return rent + elec + water + net;
}

function enrichDormsWithMetrics(dorms) {
  // คำนวณค่าใช้จ่ายรวมต่อเดือนเฉลี่ยแยกตามประเภทห้อง (แอร์ / พัดลม) สำหรับป้าย "คุ้มค่า"
  const roomTypeTotals = {};
  const roomTypeCounts = {};

  dorms.forEach(d => {
    const est = calculateEstimatedMonthly(d, DEFAULT_ELECTRIC_UNITS);
    roomTypeTotals[d.roomType] = (roomTypeTotals[d.roomType] || 0) + est;
    roomTypeCounts[d.roomType] = (roomTypeCounts[d.roomType] || 0) + 1;
  });

  const roomTypeAvg = {};
  Object.keys(roomTypeTotals).forEach(rt => {
    roomTypeAvg[rt] = roomTypeTotals[rt] / roomTypeCounts[rt];
  });

  return dorms.map(dorm => {
    const estimatedMonthly = calculateEstimatedMonthly(dorm, DEFAULT_ELECTRIC_UNITS);
    const typeAverage = roomTypeAvg[dorm.roomType] || estimatedMonthly;
    const isBestValue = estimatedMonthly < typeAverage;
    const ratingSummary = getDormRatingSummary(dorm.id);

    return {
      ...dorm,
      estimatedMonthly,
      typeAverage: Math.round(typeAverage),
      isBestValue,
      ratingAverage: ratingSummary.average,
      reviewCount: ratingSummary.count
    };
  });
}

function getGoogleMapsDirectionsUrl(dorm) {
  if (dorm.latitude && dorm.longitude) {
    return 'https://www.google.com/maps/dir/?api=1&origin=' +
      encodeURIComponent(dorm.latitude + ',' + dorm.longitude) +
      '&destination=' + encodeURIComponent(UNIVERSITY_COORDS.lat + ',' + UNIVERSITY_COORDS.lng) +
      '&travelmode=transit';
  }
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(dorm.name + ' ' + dorm.address);
}

// สร้าง DOM การ์ดหอพัก (F1 & T6: ใช้ createElement และ addEventListener ห้ามใช้ inline onclick)
function createDormCardElement(dorm, onStatusChange) {
  const article = document.createElement('article');
  article.className = 'dorm-card';
  article.setAttribute('aria-label', dorm.name);

  // ส่วนรูปภาพและป้ายกำกับด้านบน
  const imgWrap = document.createElement('div');
  imgWrap.className = 'dorm-card-img-wrap';

  const img = document.createElement('img');
  img.className = 'dorm-card-img';
  img.src = dorm.image;
  img.alt = 'ภาพบรรยากาศห้องพักของ ' + dorm.name;
  img.loading = 'lazy';
  imgWrap.appendChild(img);

  const badgesTop = document.createElement('div');
  badgesTop.className = 'card-badges-top';

  const leftBadges = document.createElement('div');
  leftBadges.className = 'facility-tags';

  const roomBadge = document.createElement('span');
  roomBadge.className = 'badge ' + (dorm.roomType === 'แอร์' ? 'badge-room-air' : 'badge-room-fan');
  roomBadge.textContent = 'ห้อง' + dorm.roomType;
  leftBadges.appendChild(roomBadge);

  if (dorm.isBestValue) {
    const valueBadge = document.createElement('span');
    valueBadge.className = 'badge badge-value';
    valueBadge.title = 'ค่าใช้จ่ายรวมต่อเดือนต่ำกว่าค่าเฉลี่ยของห้อง' + dorm.roomType;
    valueBadge.textContent = '★ คุ้มค่า';
    leftBadges.appendChild(valueBadge);
  }

  badgesTop.appendChild(leftBadges);

  const ratingBadge = document.createElement('span');
  ratingBadge.className = 'badge badge-rating';
  ratingBadge.textContent = dorm.reviewCount > 0
    ? '★ ' + dorm.ratingAverage.toFixed(1) + ' (' + dorm.reviewCount + ' รีวิว)'
    : '★ ยังไม่มีรีวิว';
  badgesTop.appendChild(ratingBadge);

  imgWrap.appendChild(badgesTop);
  article.appendChild(imgWrap);

  // ส่วนเนื้อหาในการ์ด
  const body = document.createElement('div');
  body.className = 'dorm-card-body';

  const title = document.createElement('h3');
  title.className = 'dorm-card-title';
  title.textContent = dorm.name;
  body.appendChild(title);

  const address = document.createElement('p');
  address.className = 'dorm-card-address';
  address.textContent = dorm.address;
  body.appendChild(address);

  // รายการข้อมูลหลัก 4 ช่อง
  const metaList = document.createElement('ul');
  metaList.className = 'dorm-meta-list';

  const items = [
    { label: 'ค่าเช่าเริ่มต้น', val: dorm.rent.toLocaleString('th-TH') + ' บาท/ด.' },
    { label: 'ระยะทางจาก ม.', val: dorm.distanceKm + ' กม.' },
    { label: 'ค่าไฟ / ค่าน้ำ', val: dorm.electricRate + ' บ. / ' + dorm.waterFlat + ' บ.' },
    { label: 'รวมประมาณการ*', val: dorm.estimatedMonthly.toLocaleString('th-TH') + ' บาท/ด.' }
  ];

  items.forEach(item => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = item.label + ': ';
    li.appendChild(strong);
    li.appendChild(document.createTextNode(item.val));
    metaList.appendChild(li);
  });
  body.appendChild(metaList);

  // รายการสิ่งอำนวยความสะดวก
  const facList = document.createElement('ul');
  facList.className = 'facility-tags';
  facList.setAttribute('aria-label', 'สิ่งอำนวยความสะดวก');
  dorm.facilities.forEach(fac => {
    const li = document.createElement('li');
    li.className = 'facility-tag';
    li.textContent = fac;
    facList.appendChild(li);
  });
  body.appendChild(facList);

  // ปุ่มกด 3 ปุ่มด้านล่างการ์ด
  const actions = document.createElement('div');
  actions.className = 'dorm-card-actions';

  const detailLink = document.createElement('a');
  detailLink.className = 'btn btn-primary';
  detailLink.href = 'dorm.html?id=' + encodeURIComponent(dorm.id);
  detailLink.textContent = 'รายละเอียด / คำนวณงบ';
  actions.appendChild(detailLink);

  const compareList = getCompareList();
  const isCompared = compareList.includes(dorm.id);
  const compareBtn = document.createElement('button');
  compareBtn.type = 'button';
  compareBtn.className = 'btn btn-outline' + (isCompared ? ' is-selected' : '');
  compareBtn.setAttribute('aria-pressed', isCompared ? 'true' : 'false');
  compareBtn.textContent = isCompared ? '✓ เลือกเปรียบเทียบแล้ว' : '+ เพิ่มเพื่อเปรียบเทียบ';

  compareBtn.addEventListener('click', () => {
    const result = toggleCompareDorm(dorm.id);
    if (result.status === 'limit_exceeded') {
      if (typeof onStatusChange === 'function') {
        onStatusChange(result.message, 'error');
      }
      return;
    }
    const nowSelected = result.list.includes(dorm.id);
    compareBtn.className = 'btn btn-outline' + (nowSelected ? ' is-selected' : '');
    compareBtn.setAttribute('aria-pressed', nowSelected ? 'true' : 'false');
    compareBtn.textContent = nowSelected ? '✓ เลือกเปรียบเทียบแล้ว' : '+ เพิ่มเพื่อเปรียบเทียบ';
    if (typeof onStatusChange === 'function') {
      onStatusChange(result.message, 'info');
    }
  });
  actions.appendChild(compareBtn);

  const favList = getFavoritesList();
  const isFav = favList.includes(dorm.id);
  const favBtn = document.createElement('button');
  favBtn.type = 'button';
  favBtn.className = 'btn btn-fav' + (isFav ? ' is-fav' : '');
  favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
  favBtn.setAttribute('aria-label', 'บันทึก ' + dorm.name + ' เป็นรายการโปรด');
  favBtn.textContent = isFav ? '♥ โปรดแล้ว' : '♡ รายการโปรด';

  favBtn.addEventListener('click', () => {
    const res = toggleFavoriteDorm(dorm.id);
    favBtn.className = 'btn btn-fav' + (res.added ? ' is-fav' : '');
    favBtn.setAttribute('aria-pressed', res.added ? 'true' : 'false');
    favBtn.textContent = res.added ? '♥ โปรดแล้ว' : '♡ รายการโปรด';
    if (typeof onStatusChange === 'function') {
      onStatusChange(
        res.added ? 'เพิ่ม ' + dorm.name + ' ในรายการโปรดแล้ว' : 'นำ ' + dorm.name + ' ออกจากรายการโปรดแล้ว',
        'info'
      );
    }
  });
  actions.appendChild(favBtn);

  body.appendChild(actions);
  article.appendChild(body);
  return article;
}

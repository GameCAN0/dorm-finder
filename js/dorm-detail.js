/* ==========================================================================
   ไฟล์: js/dorm-detail.js
   หน้าที่: แสดงรายละเอียดหอพัก (dorm.html?id=...) ปุ่มนำทาง Google Maps
   และเครื่องคำนวณค่าใช้จ่ายรายเดือน (ฟีเจอร์บังคับ F5)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  updateNavCompareBadge();

  const detailContainer = document.getElementById('dorm-detail-content');
  const dormSelect = document.getElementById('calc-dorm-select');
  const calcForm = document.getElementById('cost-calculator-form');
  const elecInput = document.getElementById('elec-units');
  const roommatesInput = document.getElementById('roommates-count');
  const elecError = document.getElementById('elec-error');
  const roommatesError = document.getElementById('roommates-error');
  const statusBanner = document.getElementById('detail-status-banner');

  // ช่องแสดงผลลัพธ์การคำนวณ F5
  const resDormName = document.getElementById('res-dorm-name');
  const resRent = document.getElementById('res-rent');
  const resElec = document.getElementById('res-elec');
  const resWater = document.getElementById('res-water');
  const resInternet = document.getElementById('res-internet');
  const resTotal = document.getElementById('res-total-monthly');
  const resPerPerson = document.getElementById('res-per-person');
  const resDeposit = document.getElementById('res-deposit-note');

  let allDorms = [];
  let currentDorm = null;

  function showBanner(msg, type = 'info') {
    if (!statusBanner) return;
    statusBanner.textContent = msg;
    statusBanner.className = 'status-banner ' + type;
    statusBanner.hidden = false;
  }

  function renderDormDetail(dorm) {
    if (!detailContainer || !dorm) return;
    detailContainer.textContent = '';

    const titleRow = document.createElement('div');
    titleRow.className = 'section-header';

    const h1 = document.createElement('h1');
    h1.textContent = dorm.name;
    titleRow.appendChild(h1);

    const badgeGroup = document.createElement('div');
    badgeGroup.className = 'facility-tags';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge ' + (dorm.roomType === 'แอร์' ? 'badge-room-air' : 'badge-room-fan');
    typeBadge.textContent = 'ห้อง' + dorm.roomType;
    badgeGroup.appendChild(typeBadge);

    if (dorm.isBestValue) {
      const valBadge = document.createElement('span');
      valBadge.className = 'badge badge-value';
      valBadge.textContent = '★ คุ้มค่ากว่าค่าเฉลี่ยห้อง' + dorm.roomType;
      badgeGroup.appendChild(valBadge);
    }
    titleRow.appendChild(badgeGroup);
    detailContainer.appendChild(titleRow);

    const img = document.createElement('img');
    img.className = 'detail-hero-img';
    img.src = dorm.image;
    img.alt = 'ภาพห้องพักและอาคารของ ' + dorm.name;
    detailContainer.appendChild(img);

    const addrP = document.createElement('p');
    const addrStrong = document.createElement('strong');
    addrStrong.textContent = 'ที่ตั้ง: ';
    addrP.appendChild(addrStrong);
    addrP.appendChild(document.createTextNode(dorm.address + ' (ห่างจากมหาวิทยาลัย ' + dorm.distanceKm + ' กม.)'));
    detailContainer.appendChild(addrP);

    // ตารางข้อมูลสำคัญ <dl>
    const dl = document.createElement('dl');
    dl.className = 'info-dl';

    const specs = [
      { dt: 'ช่วงค่าเช่ารายเดือน', dd: dorm.rentRange || (dorm.rent.toLocaleString('th-TH') + ' บาท/เดือน') },
      { dt: 'เงินประกันแรกเข้า', dd: dorm.deposit.toLocaleString('th-TH') + ' บาท' },
      { dt: 'อัตราค่าไฟฟ้า', dd: dorm.electricRate + ' บาท/หน่วย' },
      { dt: 'อัตราค่าน้ำประปา', dd: dorm.waterFlat + ' บาท/เดือน (' + (dorm.waterDetail || 'เหมาจ่าย') + ')' },
      { dt: 'ค่าอินเทอร์เน็ต', dd: dorm.internet === 0 ? 'ฟรี (0 บาท)' : dorm.internet + ' บาท/เดือน' },
      { dt: 'คะแนนรีวิวเฉลี่ย', dd: dorm.reviewCount > 0 ? dorm.ratingAverage.toFixed(1) + ' / 5.0 (' + dorm.reviewCount + ' รีวิว)' : 'ยังไม่มีรีวิว' }
    ];

    specs.forEach(s => {
      const wrap = document.createElement('div');
      wrap.className = 'info-item';
      const dt = document.createElement('dt');
      dt.textContent = s.dt;
      const dd = document.createElement('dd');
      dd.textContent = s.dd;
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      dl.appendChild(wrap);
    });
    detailContainer.appendChild(dl);

    // สิ่งอำนวยความสะดวก
    const facHeading = document.createElement('h2');
    facHeading.textContent = 'สิ่งอำนวยความสะดวกภายในหอพัก';
    facHeading.className = 'dorm-card-title';
    detailContainer.appendChild(facHeading);

    const facUl = document.createElement('ul');
    facUl.className = 'facility-tags';
    dorm.facilities.forEach(f => {
      const li = document.createElement('li');
      li.className = 'facility-tag';
      li.textContent = '✓ ' + f;
      facUl.appendChild(li);
    });
    detailContainer.appendChild(facUl);

    // ช่องทางติดต่อทางการและปุ่ม Action (Google Maps, เปรียบเทียบ, แหล่งข้อมูล)
    const contactBox = document.createElement('div');
    contactBox.className = 'info-item';

    const contactTitle = document.createElement('p');
    const cStrong = document.createElement('strong');
    cStrong.textContent = 'ช่องทางติดต่อทางการ: ';
    contactTitle.appendChild(cStrong);
    contactTitle.appendChild(document.createTextNode(dorm.contact));
    contactBox.appendChild(contactTitle);

    if (dorm.sourceUrl) {
      const srcP = document.createElement('p');
      const srcLink = document.createElement('a');
      srcLink.href = dorm.sourceUrl;
      srcLink.target = '_blank';
      srcLink.rel = 'noopener noreferrer';
      srcLink.textContent = 'ดูประกาศอ้างอิงต้นฉบับบน Renthub Official ↗';
      srcP.appendChild(srcLink);
      contactBox.appendChild(srcP);
    }
    detailContainer.appendChild(contactBox);

    const btnRow = document.createElement('div');
    btnRow.className = 'dorm-card-actions';

    // ฟีเจอร์เสริม: ปุ่มเปิดเส้นทางจากหอพักไปมหาวิทยาลัยใน Google Maps
    const mapsLink = document.createElement('a');
    mapsLink.className = 'btn btn-secondary';
    mapsLink.href = getGoogleMapsDirectionsUrl(dorm);
    mapsLink.target = '_blank';
    mapsLink.rel = 'noopener noreferrer';
    mapsLink.textContent = '📍 เปิดเส้นทางไปมหาวิทยาลัยใน Google Maps';
    btnRow.appendChild(mapsLink);

    const isCompared = getCompareList().includes(dorm.id);
    const compareBtn = document.createElement('button');
    compareBtn.type = 'button';
    compareBtn.className = 'btn btn-outline' + (isCompared ? ' is-selected' : '');
    compareBtn.textContent = isCompared ? '✓ เลือกเปรียบเทียบแล้ว' : '+ เพิ่มเพื่อเปรียบเทียบ';
    compareBtn.addEventListener('click', () => {
      const res = toggleCompareDorm(dorm.id);
      if (res.status === 'limit_exceeded') {
        showBanner(res.message, 'error');
        return;
      }
      const nowSel = res.list.includes(dorm.id);
      compareBtn.className = 'btn btn-outline' + (nowSel ? ' is-selected' : '');
      compareBtn.textContent = nowSel ? '✓ เลือกเปรียบเทียบแล้ว' : '+ เพิ่มเพื่อเปรียบเทียบ';
      showBanner(res.message, 'info');
    });
    btnRow.appendChild(compareBtn);

    const reviewLink = document.createElement('a');
    reviewLink.className = 'btn btn-primary';
    reviewLink.href = 'review.html?dormId=' + encodeURIComponent(dorm.id);
    reviewLink.textContent = '✍ เขียนรีวิวหอพักนี้';
    btnRow.appendChild(reviewLink);

    detailContainer.appendChild(btnRow);
  }

  // F5: คำนวณค่าใช้จ่ายรายเดือน พร้อม Validation ทั้ง HTML และ JS
  function validateAndCalculate() {
    if (!currentDorm) return;
    let isValid = true;

    const unitsVal = elecInput.value.trim();
    const units = Number(unitsVal);
    if (unitsVal === '' || Number.isNaN(units) || units < 0 || units > 3000) {
      elecError.textContent = 'กรุณากรอกจำนวนหน่วยไฟระหว่าง 0 ถึง 3,000 หน่วย';
      elecInput.classList.add('input-error');
      isValid = false;
    } else {
      elecError.textContent = '';
      elecInput.classList.remove('input-error');
    }

    const matesVal = roommatesInput.value.trim();
    const mates = Number(matesVal);
    if (matesVal === '' || !Number.isInteger(mates) || mates < 1 || mates > 10) {
      roommatesError.textContent = 'กรุณากรอกจำนวนผู้พักเป็นจำนวนเต็มตั้งแต่ 1 ถึง 10 คน';
      roommatesInput.classList.add('input-error');
      isValid = false;
    } else {
      roommatesError.textContent = '';
      roommatesInput.classList.remove('input-error');
    }

    if (!isValid) return;

    const rentCost = currentDorm.rent;
    const elecCost = Math.round(units * currentDorm.electricRate);
    const waterCost = currentDorm.waterFlat;
    const netCost = currentDorm.internet;
    const totalMonthly = rentCost + elecCost + waterCost + netCost;
    const perPerson = Math.ceil(totalMonthly / mates);

    if (resDormName) resDormName.textContent = currentDorm.name + ' (ห้อง' + currentDorm.roomType + ')';
    if (resRent) resRent.textContent = rentCost.toLocaleString('th-TH') + ' บาท';
    if (resElec) resElec.textContent = elecCost.toLocaleString('th-TH') + ' บาท (' + units + ' หน่วย × ' + currentDorm.electricRate + ' บ.)';
    if (resWater) resWater.textContent = waterCost.toLocaleString('th-TH') + ' บาท';
    if (resInternet) resInternet.textContent = netCost === 0 ? '0 บาท (ฟรี)' : netCost.toLocaleString('th-TH') + ' บาท';
    if (resTotal) resTotal.textContent = totalMonthly.toLocaleString('th-TH') + ' บาท/เดือน';
    if (resPerPerson) resPerPerson.textContent = perPerson.toLocaleString('th-TH') + ' บาท/คน (' + mates + ' คน)';
    if (resDeposit) resDeposit.textContent = 'หมายเหตุ: มีเงินประกันแรกเข้า ' + currentDorm.deposit.toLocaleString('th-TH') + ' บาท (จ่ายครั้งเดียววันทำสัญญา)';
  }

  try {
    allDorms = await fetchDormsData();
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id') || 'd01';
    currentDorm = allDorms.find(d => d.id === requestedId) || allDorms[0];

    if (dormSelect) {
      dormSelect.textContent = '';
      allDorms.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.id.toUpperCase() + ' — ' + d.name + ' (' + d.rent.toLocaleString('th-TH') + ' บ.)';
        if (d.id === currentDorm.id) opt.selected = true;
        dormSelect.appendChild(opt);
      });

      dormSelect.addEventListener('change', () => {
        const found = allDorms.find(d => d.id === dormSelect.value);
        if (found) {
          currentDorm = found;
          renderDormDetail(currentDorm);
          validateAndCalculate();
        }
      });
    }

    renderDormDetail(currentDorm);
    validateAndCalculate();
  } catch (err) {
    showBanner('ไม่สามารถโหลดข้อมูลหอพักได้ กรุณาตรวจสอบไฟล์ data/dorms.json', 'error');
  }

  if (calcForm) {
    calcForm.addEventListener('submit', e => {
      e.preventDefault();
      validateAndCalculate();
    });
    calcForm.addEventListener('input', validateAndCalculate);
  }
});

/* ==========================================================================
   ไฟล์: js/compare.js
   หน้าที่: สร้างตารางเปรียบเทียบหอพักสูงสุด 3 แห่ง (F4)
   ใช้ <table>, <caption>, <th scope="col">, <th scope="row">
   และไฮไลต์ค่าที่ดีที่สุดของแต่ละแถวด้วยทั้งสีและข้อความกำกับ (T3 & F4)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  updateNavCompareBadge();

  const compareWrapper = document.getElementById('compare-table-wrapper');
  const clearAllBtn = document.getElementById('clear-compare-btn');
  const quickAddSelect = document.getElementById('quick-add-dorm-select');
  const quickAddBtn = document.getElementById('quick-add-dorm-btn');
  const statusBanner = document.getElementById('compare-status-banner');

  let allDorms = [];

  function showCompareBanner(msg, type = 'info') {
    if (!statusBanner) return;
    statusBanner.textContent = msg;
    statusBanner.className = 'status-banner ' + type;
    statusBanner.hidden = false;
  }

  function populateQuickAddDropdown() {
    if (!quickAddSelect) return;
    const selectedIds = getCompareList();
    quickAddSelect.textContent = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- เลือกหอพักเพื่อเพิ่มเข้าตารางเปรียบเทียบ --';
    quickAddSelect.appendChild(defaultOpt);

    allDorms.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      const already = selectedIds.includes(d.id);
      opt.textContent = d.name + ' (' + d.rent.toLocaleString('th-TH') + ' บ. / ' + d.distanceKm + ' กม.)' + (already ? ' [เลือกแล้ว]' : '');
      opt.disabled = already;
      quickAddSelect.appendChild(opt);
    });
  }

  function renderComparisonTable() {
    if (!compareWrapper) return;
    compareWrapper.textContent = '';

    const selectedIds = getCompareList();
    populateQuickAddDropdown();

    if (selectedIds.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      const p = document.createElement('p');
      p.textContent = 'ยังไม่มีหอพักในตารางเปรียบเทียบ กรุณาเลือกหอพักจากด้านบน หรือไปที่หน้ารายการหอพักทั้งหมด';
      const link = document.createElement('a');
      link.href = 'dorms.html';
      link.className = 'btn btn-primary';
      link.textContent = 'ไปเลือกหอพักจากรายการทั้งหมด';
      emptyDiv.appendChild(p);
      emptyDiv.appendChild(link);
      compareWrapper.appendChild(emptyDiv);
      return;
    }

    const selectedDorms = selectedIds
      .map(id => allDorms.find(d => d.id === id))
      .filter(Boolean);

    // คำนวณค่าที่ดีที่สุดของแต่ละแถว (F4)
    const minDistance = Math.min(...selectedDorms.map(d => d.distanceKm));
    const minRent = Math.min(...selectedDorms.map(d => d.rent));
    const minDeposit = Math.min(...selectedDorms.map(d => d.deposit));
    const minElec = Math.min(...selectedDorms.map(d => d.electricRate));
    const minWater = Math.min(...selectedDorms.map(d => d.waterFlat));
    const minEstimated = Math.min(...selectedDorms.map(d => d.estimatedMonthly));
    const maxFacilities = Math.max(...selectedDorms.map(d => d.facilities.length));
    const maxRating = Math.max(...selectedDorms.map(d => d.ratingAverage));

    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-responsive';

    const table = document.createElement('table');
    table.className = 'compare-table';

    // <caption> ตามข้อกำหนด F4
    const caption = document.createElement('caption');
    caption.textContent = 'ตารางเปรียบเทียบข้อมูลหอพักที่เลือก (' + selectedDorms.length + ' แห่ง) — ไฮไลต์สีเขียวและป้าย ★ แสดงค่าที่ดีที่สุดในแต่ละหัวข้อ';
    table.appendChild(caption);

    // <thead> พร้อม <th scope="col">
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    const cornerTh = document.createElement('th');
    cornerTh.setAttribute('scope', 'col');
    cornerTh.textContent = 'หัวข้อเปรียบเทียบ';
    headRow.appendChild(cornerTh);

    selectedDorms.forEach(d => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.textContent = d.name;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // <tbody> พร้อม <th scope="row">
    const tbody = document.createElement('tbody');

    function appendRow(rowTitle, cellRenderer) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.setAttribute('scope', 'row');
      th.textContent = rowTitle;
      tr.appendChild(th);

      selectedDorms.forEach(d => {
        const td = document.createElement('td');
        cellRenderer(td, d);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }

    appendRow('ประเภทห้องพัก', (td, d) => {
      td.textContent = 'ห้อง' + d.roomType + (d.isBestValue ? ' (★ ป้ายคุ้มค่า)' : '');
    });

    appendRow('ระยะทางจากมหาวิทยาลัย', (td, d) => {
      td.appendChild(document.createTextNode(d.distanceKm + ' กม.'));
      if (selectedDorms.length > 1 && d.distanceKm === minDistance) {
        td.classList.add('best-value-cell');
        const badge = document.createElement('span');
        badge.className = 'best-text-indicator';
        badge.textContent = '★ ใกล้ที่สุด';
        td.appendChild(badge);
      }
    });

    appendRow('ค่าเช่ารายเดือนเริ่มต้น', (td, d) => {
      td.appendChild(document.createTextNode(d.rent.toLocaleString('th-TH') + ' บาท/เดือน'));
      if (selectedDorms.length > 1 && d.rent === minRent) {
        td.classList.add('best-value-cell');
        const badge = document.createElement('span');
        badge.className = 'best-text-indicator';
        badge.textContent = '★ ถูกที่สุด';
        td.appendChild(badge);
      }
    });

    appendRow('เงินประกันแรกเข้า', (td, d) => {
      td.appendChild(document.createTextNode(d.deposit.toLocaleString('th-TH') + ' บาท'));
      if (selectedDorms.length > 1 && d.deposit === minDeposit) {
        td.classList.add('best-value-cell');
        const badge = document.createElement('span');
        badge.className = 'best-text-indicator';
        badge.textContent = '★ ประหยัดเงินก้อนแรกสุด';
        td.appendChild(badge);
      }
    });

    appendRow('อัตราค่าไฟฟ้า', (td, d) => {
      td.appendChild(document.createTextNode(d.electricRate + ' บาท/หน่วย'));
      if (selectedDorms.length > 1 && d.electricRate === minElec) {
        td.classList.add('best-value-cell');
        const badge = document.createElement('span');
        badge.className = 'best-text-indicator';
        badge.textContent = '★ ค่าไฟถูกที่สุด';
        td.appendChild(badge);
      }
    });

    appendRow('อัตราค่าน้ำประปา', (td, d) => {
      td.appendChild(document.createTextNode(d.waterFlat + ' บาท/เดือน'));
      if (selectedDorms.length > 1 && d.waterFlat === minWater) {
        td.classList.add('best-value-cell');
        const badge = document.createElement('span');
        badge.className = 'best-text-indicator';
        badge.textContent = '★ ค่าน้ำถูกที่สุด';
        td.appendChild(badge);
      }
    });

    appendRow('ค่าอินเทอร์เน็ต', (td, d) => {
      td.textContent = d.internet === 0 ? 'ฟรี (0 บาท)' : d.internet + ' บาท/เดือน';
    });

    appendRow('รวมรายเดือนประมาณการ (สมมติไฟ 100 หน่วย)', (td, d) => {
      td.appendChild(document.createTextNode(d.estimatedMonthly.toLocaleString('th-TH') + ' บาท/เดือน'));
      if (selectedDorms.length > 1 && d.estimatedMonthly === minEstimated) {
        td.classList.add('best-value-cell');
        const badge = document.createElement('span');
        badge.className = 'best-text-indicator';
        badge.textContent = '★ ประหยัดรวมที่สุด';
        td.appendChild(badge);
      }
    });

    appendRow('สิ่งอำนวยความสะดวก', (td, d) => {
      td.appendChild(document.createTextNode('มี ' + d.facilities.length + ' รายการ: ' + d.facilities.join(', ')));
      if (selectedDorms.length > 1 && d.facilities.length === maxFacilities) {
        td.classList.add('best-value-cell');
        const badge = document.createElement('span');
        badge.className = 'best-text-indicator';
        badge.textContent = '★ ครบครันที่สุด';
        td.appendChild(badge);
      }
    });

    appendRow('คะแนนรีวิวเฉลี่ย', (td, d) => {
      const txt = d.reviewCount > 0 ? d.ratingAverage.toFixed(1) + ' / 5.0 (' + d.reviewCount + ' รีวิว)' : 'ยังไม่มีรีวิว';
      td.appendChild(document.createTextNode(txt));
      if (selectedDorms.length > 1 && maxRating > 0 && d.ratingAverage === maxRating) {
        td.classList.add('best-value-cell');
        const badge = document.createElement('span');
        badge.className = 'best-text-indicator';
        badge.textContent = '★ คะแนนสูงสุด';
        td.appendChild(badge);
      }
    });

    appendRow('การจัดการ', (td, d) => {
      const btnWrap = document.createElement('div');
      btnWrap.className = 'dorm-card-actions';

      const detailBtn = document.createElement('a');
      detailBtn.className = 'btn btn-primary';
      detailBtn.href = 'dorm.html?id=' + encodeURIComponent(d.id);
      detailBtn.textContent = 'คำนวณงบหอนี้';
      btnWrap.appendChild(detailBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger';
      removeBtn.textContent = 'นำออก';
      removeBtn.addEventListener('click', () => {
        toggleCompareDorm(d.id);
        showCompareBanner('นำ ' + d.name + ' ออกจากตารางเปรียบเทียบแล้ว', 'info');
        renderComparisonTable();
      });
      btnWrap.appendChild(removeBtn);

      td.appendChild(btnWrap);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    compareWrapper.appendChild(tableContainer);
  }

  try {
    allDorms = await fetchDormsData();
    renderComparisonTable();
  } catch (err) {
    showCompareBanner('ไม่สามารถโหลดข้อมูลหอพักได้ กรุณาตรวจสอบไฟล์ data/dorms.json', 'error');
  }

  if (quickAddBtn && quickAddSelect) {
    quickAddBtn.addEventListener('click', () => {
      const dormId = quickAddSelect.value;
      if (!dormId) {
        showCompareBanner('กรุณาเลือกหอพักจากรายการก่อนกดเพิ่ม', 'error');
        return;
      }
      const res = toggleCompareDorm(dormId);
      if (res.status === 'limit_exceeded') {
        showCompareBanner(res.message, 'error');
        return;
      }
      showCompareBanner(res.message, 'success');
      renderComparisonTable();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      clearCompareList();
      showCompareBanner('ล้างตารางเปรียบเทียบทั้งหมดเรียบร้อยแล้ว', 'info');
      renderComparisonTable();
    });
  }
});

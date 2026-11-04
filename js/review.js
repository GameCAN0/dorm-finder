/* ==========================================================================
   ไฟล์: js/review.js
   หน้าที่: ควบคุมหน้า review.html (F6 ฟอร์มรีวิวหอพัก คะแนน 1-5 ด้วย radio,
   ความสะอาด/ความปลอดภัยด้วย select, ความคิดเห็นด้วย textarea,
   Validation ทั้ง HTML + JS, บันทึกด้วย localStorage และคำนวณคะแนนเฉลี่ยรายหอ)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  updateNavCompareBadge();

  const reviewForm = document.getElementById('dorm-review-form');
  const dormSelect = document.getElementById('review-dorm-id');
  const nameInput = document.getElementById('reviewer-name');
  const cleanSelect = document.getElementById('cleanliness-score');
  const safetySelect = document.getElementById('safety-score');
  const commentInput = document.getElementById('review-comment');
  const filterDormSelect = document.getElementById('filter-review-dorm');
  const reviewsContainer = document.getElementById('reviews-list-container');
  const avgSummaryBox = document.getElementById('dorm-rating-summary-box');
  const statusBanner = document.getElementById('review-status-banner');

  // Error message containers
  const errDorm = document.getElementById('err-review-dorm');
  const errName = document.getElementById('err-reviewer-name');
  const errRating = document.getElementById('err-rating-radio');
  const errClean = document.getElementById('err-cleanliness');
  const errSafety = document.getElementById('err-safety');
  const errComment = document.getElementById('err-comment');

  let allDorms = [];

  function showReviewBanner(msg, type = 'success') {
    if (!statusBanner) return;
    statusBanner.textContent = msg;
    statusBanner.className = 'status-banner ' + type;
    statusBanner.hidden = false;
  }

  function renderAverageSummary(selectedDormId) {
    if (!avgSummaryBox) return;
    avgSummaryBox.textContent = '';

    const reviews = getReviewsList();
    if (!selectedDormId || selectedDormId === 'all') {
      const totalCount = reviews.length;
      const overallAvg = totalCount > 0
        ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / totalCount).toFixed(1)
        : '0.0';
      const p = document.createElement('p');
      p.textContent = 'คะแนนเฉลี่ยรวมทุกหอพัก: ★ ' + overallAvg + ' / 5.0 (จากรีวิวทั้งหมด ' + totalCount + ' รายการ)';
      avgSummaryBox.appendChild(p);
      return;
    }

    const dorm = allDorms.find(d => d.id === selectedDormId);
    const summary = getDormRatingSummary(selectedDormId);
    const title = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = dorm ? dorm.name : selectedDormId;
    title.appendChild(strong);

    const detail = document.createElement('p');
    if (summary.count === 0) {
      detail.textContent = 'ยังไม่มีรีวิวสำหรับหอพักนี้ ร่วมเป็นคนแรกที่เขียนรีวิว!';
    } else {
      detail.textContent = 'คะแนนเฉลี่ยรวม: ★ ' + summary.average.toFixed(1) + ' / 5.0 (' + summary.count + ' รีวิว) | ความสะอาดเฉลี่ย: ' + summary.cleanlinessAvg.toFixed(1) + ' | ความปลอดภัยเฉลี่ย: ' + summary.safetyAvg.toFixed(1);
    }
    avgSummaryBox.appendChild(title);
    avgSummaryBox.appendChild(detail);
  }

  function renderReviewsList() {
    if (!reviewsContainer) return;
    reviewsContainer.textContent = '';

    const selectedDormId = filterDormSelect ? filterDormSelect.value : 'all';
    renderAverageSummary(selectedDormId);

    const reviews = getReviewsList().filter(r => selectedDormId === 'all' || r.dormId === selectedDormId);

    if (reviews.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'ยังไม่มีรายการรีวิวในหมวดที่เลือก';
      reviewsContainer.appendChild(empty);
      return;
    }

    reviews.forEach(r => {
      const dorm = allDorms.find(d => d.id === r.dormId);
      const card = document.createElement('article');
      card.className = 'review-item';

      const header = document.createElement('div');
      header.className = 'review-item-header';

      const left = document.createElement('div');
      const dormTitle = document.createElement('strong');
      dormTitle.textContent = dorm ? dorm.name : r.dormId;
      const bySpan = document.createElement('span');
      bySpan.textContent = ' — รีวิวโดย ' + r.reviewerName + ' (' + r.createdAt + ')';
      left.appendChild(dormTitle);
      left.appendChild(bySpan);

      const badge = document.createElement('span');
      badge.className = 'badge badge-rating';
      badge.textContent = '★ คะแนนรวม ' + r.rating + '/5 | สะอาด ' + r.cleanliness + '/5 | ปลอดภัย ' + r.safety + '/5';

      header.appendChild(left);
      header.appendChild(badge);
      card.appendChild(header);

      const commentP = document.createElement('p');
      commentP.textContent = r.comment;
      card.appendChild(commentP);

      reviewsContainer.appendChild(card);
    });
  }

  try {
    allDorms = await fetchDormsData();
    const params = new URLSearchParams(window.location.search);
    const preselectedDormId = params.get('dormId') || '';

    if (dormSelect) {
      allDorms.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name + ' (ห้อง' + d.roomType + ')';
        if (d.id === preselectedDormId) opt.selected = true;
        dormSelect.appendChild(opt);
      });
    }

    if (filterDormSelect) {
      allDorms.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        if (d.id === preselectedDormId) opt.selected = true;
        filterDormSelect.appendChild(opt);
      });
      filterDormSelect.addEventListener('change', renderReviewsList);
    }

    renderReviewsList();
  } catch (err) {
    showReviewBanner('ไม่สามารถโหลดรายชื่อหอพักจาก data/dorms.json ได้', 'error');
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      // 1. ตรวจหอพัก
      if (!dormSelect.value) {
        errDorm.textContent = 'กรุณาเลือกหอพักที่ต้องการรีวิว';
        dormSelect.classList.add('input-error');
        valid = false;
      } else {
        errDorm.textContent = '';
        dormSelect.classList.remove('input-error');
      }

      // 2. ตรวจชื่อผู้รีวิว
      const reviewerName = nameInput.value.trim();
      if (reviewerName.length < 2) {
        errName.textContent = 'กรุณาระบุชื่อหรือนามแฝงอย่างน้อย 2 ตัวอักษร';
        nameInput.classList.add('input-error');
        valid = false;
      } else {
        errName.textContent = '';
        nameInput.classList.remove('input-error');
      }

      // 3. ตรวจคะแนน 1-5 ด้วย radio
      const checkedRadio = reviewForm.querySelector('input[name="rating"]:checked');
      if (!checkedRadio) {
        errRating.textContent = 'กรุณาเลือกคะแนนความพึงพอใจภาพรวม (1–5 คะแนน)';
        valid = false;
      } else {
        errRating.textContent = '';
      }

      // 4. ตรวจความสะอาดด้วย select
      if (!cleanSelect.value) {
        errClean.textContent = 'กรุณาเลือกระดับความสะอาดของหอพัก';
        cleanSelect.classList.add('input-error');
        valid = false;
      } else {
        errClean.textContent = '';
        cleanSelect.classList.remove('input-error');
      }

      // 5. ตรวจความปลอดภัยด้วย select
      if (!safetySelect.value) {
        errSafety.textContent = 'กรุณาเลือกระดับความปลอดภัยของหอพัก';
        safetySelect.classList.add('input-error');
        valid = false;
      } else {
        errSafety.textContent = '';
        safetySelect.classList.remove('input-error');
      }

      // 6. ตรวจความคิดเห็นด้วย textarea
      const commentText = commentInput.value.trim();
      if (commentText.length < 10) {
        errComment.textContent = 'กรุณาเขียนความคิดเห็นอย่างน้อย 10 ตัวอักษร เพื่อเป็นประโยชน์ต่อเพื่อนนักศึกษา';
        commentInput.classList.add('input-error');
        valid = false;
      } else {
        errComment.textContent = '';
        commentInput.classList.remove('input-error');
      }

      if (!valid) {
        showReviewBanner('กรุณาตรวจสอบและกรอกข้อมูลในช่องที่มีข้อความแจ้งเตือนสีแดงให้ครบถ้วน', 'error');
        return;
      }

      const saved = addDormReview({
        dormId: dormSelect.value,
        reviewerName,
        rating: checkedRadio.value,
        cleanliness: cleanSelect.value,
        safety: safetySelect.value,
        comment: commentText
      });

      if (filterDormSelect) {
        filterDormSelect.value = saved.dormId;
      }

      reviewForm.reset();
      showReviewBanner('บันทึกรีวิวเรียบร้อยแล้ว! ข้อมูลถูกจัดเก็บใน localStorage และอัปเดตคะแนนเฉลี่ยแล้ว', 'success');
      renderReviewsList();
    });
  }
});

// الحصول على معلومات المنتج من URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('product');

let product = null;

document.addEventListener('DOMContentLoaded', async function () {
  // انتظر تحميل المنتجات من products.js
  try {
    await productsReady;
  } catch (err) {
    console.error('فشل تحميل قائمة المنتجات', err);
    alert('حدث خطأ أثناء تحميل قائمة المنتجات. يرجى المحاولة لاحقاً.');
    window.location.href = 'index.html';
    return;
  }

  product = getProductById(productId);

  // تحقق من المنتج
  if (!product) {
    alert('المنتج غير موجود!');
    window.location.href = 'index.html';
    return;
  }

  // عرض معلومات المنتج
  const productInfo = document.getElementById('product-info');
  if (productInfo) {
    productInfo.innerHTML = `
      <img src="images/fish-icon.svg" alt="${product.name}" loading="lazy">
      <div>
        <h3>${product.name}</h3>
        <p class="product-price">${formatPrice(product.price)}</p>
      </div>
    `;
  }

  // إضافة مستمعات الأحداث
  const qtyPlusBtn = document.getElementById('qty-plus');
  const qtyMinusBtn = document.getElementById('qty-minus');
  const quantityInput = document.getElementById('quantity');
  const orderForm = document.getElementById('order-form');
  const prepRadios = document.querySelectorAll('input[name="preparation"]');

  if (qtyPlusBtn) qtyPlusBtn.addEventListener('click', increaseQuantity);
  if (qtyMinusBtn) qtyMinusBtn.addEventListener('click', decreaseQuantity);
  if (quantityInput) quantityInput.addEventListener('input', calculateTotal);

  prepRadios.forEach(radio => radio.addEventListener('change', calculateTotal));
  if (orderForm) orderForm.addEventListener('submit', handleSubmit);

  // حساب الإجمالي عند التحميل
  calculateTotal();
});

// زيادة الكمية
function increaseQuantity() {
  const quantityInput = document.getElementById('quantity');
  let currentValue = parseFloat(quantityInput?.value) || 1;
  currentValue += 0.5;
  if (quantityInput) quantityInput.value = currentValue.toFixed(1);
  calculateTotal();
}

// تقليل الكمية
function decreaseQuantity() {
  const quantityInput = document.getElementById('quantity');
  let currentValue = parseFloat(quantityInput?.value) || 1;
  if (currentValue > 0.5) {
    currentValue -= 0.5;
    if (quantityInput) quantityInput.value = currentValue.toFixed(1);
    calculateTotal();
  }
}

// حساب الإجمالي
function calculateTotal() {
  const quantityInput = document.getElementById('quantity');
  const quantity = parseFloat(quantityInput?.value) || 1;

  const selectedPrep = document.querySelector('input[name="preparation"]:checked');
  const prepCost = parseInt(selectedPrep?.dataset?.price || "0", 10) || 0;

  // حساب سعر المنتج
  const productTotal = product.price * quantity;

  // حساب تكلفة التحضير (للكمية الكاملة)
  const totalPrepCost = prepCost * quantity;

  // الإجمالي النهائي (بدون رسوم توصيل)
  const total = productTotal + totalPrepCost;

  // تحديث العرض
  const productTotalEl = document.getElementById('product-total');
  const prepCostRowEl = document.getElementById('prep-cost-row');
  const prepCostEl = document.getElementById('prep-cost');
  const totalAmountEl = document.getElementById('total-amount');

  if (productTotalEl) productTotalEl.textContent = formatPrice(productTotal);

  if (prepCostRowEl && prepCostEl) {
    if (totalPrepCost > 0) {
      prepCostRowEl.style.display = 'flex';
      prepCostEl.textContent = formatPrice(totalPrepCost);
    } else {
      prepCostRowEl.style.display = 'none';
    }
  }

  if (totalAmountEl) totalAmountEl.textContent = formatPrice(total);
}

// معالجة إرسال النموذج
function handleSubmit(e) {
  e.preventDefault();

  const quantityInput = document.getElementById('quantity');
  const customerNameInput = document.getElementById('customerName');
  const streetInput = document.getElementById('street');
  const landmarkInput = document.getElementById('landmark');
  const phoneInput = document.getElementById('phone');

  const quantity = parseFloat(quantityInput?.value);
  const customerName = (customerNameInput?.value || "").trim();
  const street = (streetInput?.value || "").trim();
  const landmark = (landmarkInput?.value || "").trim();
  const phone = (phoneInput?.value || "").trim();

  const selectedPrep = document.querySelector('input[name="preparation"]:checked');
  const prepName = selectedPrep?.parentElement?.querySelector('.prep-name')?.textContent || "بدون";
  const prepCost = parseInt(selectedPrep?.dataset?.price || "0", 10) || 0;

  // التحقق من الكمية
  if (!quantity || quantity < 0.5) {
    alert('يرجى إدخال كمية صحيحة (على الأقل 0.5 كيلو)');
    return;
  }

  // التحقق من رقم الهاتف
  if (!phone || phone.length < 9) {
    alert('يرجى إدخال رقم هاتف صحيح');
    phoneInput?.focus();
    return;
  }

  // حساب الإجمالي
  const productTotal = product.price * quantity;
  const totalPrepCost = prepCost * quantity;
  const total = productTotal + totalPrepCost;

  // رسالة واتساب
  let message = `🐟 *طلب جديد من موقع وقت السمك*\n\n`;
  message += `━━━━━━━━━━━━━━━━\n`;
  message += `👤 *معلومات العميل:*\n`;
  message += `• الاسم: ${customerName}\n`;
  message += `• الهاتف: ${phone}\n`;
  message += `• الشارع: ${street}\n`;
  message += `• معلم قريب: ${landmark}\n\n`;
  message += `━━━━━━━━━━━━━━━━\n`;
  message += `🛒 *تفاصيل الطلب:*\n`;
  message += `• المنتج: ${product.name}\n`;
  message += `• الكمية: ${quantity} كيلو\n`;
  message += `• التحضير: ${prepName}\n\n`;
  message += `━━━━━━━━━━━━━━━━\n`;
  message += `💰 *الفاتورة:*\n`;
  message += `• سعر المنتج: ${formatPrice(productTotal)}\n`;

  if (totalPrepCost > 0) {
    message += `• تكلفة التحضير: ${formatPrice(totalPrepCost)}\n`;
  }

  message += `• رسوم التوصيل: حسب المسافة\n\n`;
  message += `💵 *الإجمالي: ${formatPrice(total)}*\n`;
  message += `━━━━━━━━━━━━━━━━`;

  // إرسال إلى واتساب
  const whatsappNumber = '967739768973';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  const whatsappWindow = window.open(whatsappUrl, '_blank');

  if (whatsappWindow) {
    alert('✅ تم إعداد طلبك! سيتم فتح واتساب الآن لإرساله.');
  } else {
    alert('⚠️ يرجى السماح بالنوافذ المنبثقة لإكمال الطلب عبر واتساب');
    window.location.href = whatsappUrl;
  }
}

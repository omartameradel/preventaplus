// ==========================================
// استدعاء مكتبات Firebase (الإصدار الحديث v10)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// إعدادات مشروعك
const firebaseConfig = {
    apiKey: "AIzaSyAA-iRIXpM_xkN3btGyr7elW8mwiuDbTLo",
    authDomain: "wallet-tamer-adel.firebaseapp.com",
    projectId: "wallet-tamer-adel",
    storageBucket: "wallet-tamer-adel.firebasestorage.app",
    messagingSenderId: "51007948250",
    appId: "1:51007948250:web:e1f6eaaebb4202b8aface3"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 1. إعدادات الوضع الليلي / النهاري
// ==========================================
const body = document.body;
if (localStorage.getItem('theme') === 'dark') {
    body.setAttribute('data-theme', 'dark');
}

// دالة تحويل الروابط في النص إلى روابط قابلة للضغط
function linkify(text) {
    if (!text) return "";
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function (url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

// ==========================================
// انتظار تحميل محتوى الصفحة (DOM)
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    
    // --- تشغيل زر الوضع الليلي ---
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        
        if (body.getAttribute('data-theme') === 'dark' && icon) {
            icon.classList.replace('fa-moon', 'fa-sun');
        }

        themeToggle.addEventListener('click', () => {
            if (body.getAttribute('data-theme') === 'dark') {
                body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                if(icon) icon.classList.replace('fa-sun', 'fa-moon');
            } else {
                body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if(icon) icon.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }

    // --- جلب الأخبار من Firebase وعرضها في السلايدر ---
    const newsGrid = document.getElementById('newsGrid');
    if (newsGrid) {
        const newsRef = collection(db, "news");
        const qNews = query(newsRef, orderBy("createdAt", "desc"));

        onSnapshot(qNews, (snapshot) => {
            newsGrid.innerHTML = ""; 
            
            if (snapshot.empty) {
                newsGrid.innerHTML = "<div class='swiper-slide'><p style='text-align:center; width:100%;'>لا توجد أخبار حالياً.</p></div>";
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const formattedDescription = linkify(data.description);

                const cardHTML = `
                    <div class="swiper-slide">
                        <div class="news-card">
                            <img src="${data.imageUrl}" alt="${data.title}" class="card-img">
                            <div class="card-content">
                                <h3 class="card-title">${data.title}</h3>
                                <p class="card-desc">${formattedDescription}</p>
                            </div>
                        </div>
                    </div>
                `;
                newsGrid.innerHTML += cardHTML;
            });

            if (window.newsSwiperInstance) {
                window.newsSwiperInstance.update();
            }
        }, (error) => {
            console.error("خطأ في جلب الأخبار:", error);
            newsGrid.innerHTML = "<div class='swiper-slide'><p style='text-align:center;'>حدث خطأ في تحميل الأخبار.</p></div>";
        });
    }

    // --- تشغيل سلايدر الأخبار ---
    if (document.querySelector('.news-slider')) {
        window.newsSwiperInstance = new Swiper('.news-slider', {
            slidesPerView: 1, 
            loop: true, 
            grabCursor: true, 
            autoplay: {
                delay: 4000, 
                disableOnInteraction: false, 
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            observer: true, 
            observeParents: true,
        });
    }

    // --- تسجيل الدخول ---
    const loginForm = document.getElementById('firebase-login-form');
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember');
        const submitBtn = document.getElementById('loginBtn');

        const savedEmail = localStorage.getItem("rememberedEmail");
        const savedPassword = localStorage.getItem("rememberedPassword");
        if (savedEmail && savedPassword) {
            emailInput.value = savedEmail;
            passwordInput.value = savedPassword;
            rememberCheckbox.checked = true;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = "<span>جاري التحقق...</span>";
            submitBtn.disabled = true;

            const email = emailInput.value;
            const password = passwordInput.value;
            const rememberMe = rememberCheckbox.checked;

            if (rememberMe) {
                localStorage.setItem("rememberedEmail", email);
                localStorage.setItem("rememberedPassword", password);
            } else {
                localStorage.removeItem("rememberedEmail");
                localStorage.removeItem("rememberedPassword");
            }

            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("email", "==", email), where("password", "==", password));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    alert("البريد الإلكتروني أو كلمة المرور غير صحيحة!");
                    return;
                }

                let userData = null;
                querySnapshot.forEach((docItem) => {
                    userData = docItem.data();
                    userData.id = docItem.id;
                });

                if (userData.isActive === false) {
                    alert("عذراً، تم تعطيل حسابك من قبل الإدارة. يرجى التواصل مع الدعم الفني.");
                } else {
                    sessionStorage.setItem("loggedInUser", JSON.stringify(userData));
                    window.location.href = "dashboard.html"; 
                }
            } catch (error) {
                console.error("Error during login:", error);
                alert("حدث خطأ أثناء محاولة تسجيل الدخول. تأكد من اتصالك بالإنترنت.");
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- تشغيل سلايدر الخدمات ---
    if (document.querySelector('.services-slider')) {
        new Swiper('.services-slider', {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                768: { slidesPerView: 2, spaceBetween: 30 },
                1024: { slidesPerView: 3, spaceBetween: 30 }
            }
        });
    }

    // --- تشغيل سلايدر التقييمات ---
    if (document.querySelector('.reviews_top') || document.querySelector('.reviews_bottom')) {
        const sliderSettings = {
            direction: 'vertical',
            spaceBetween: 20,
            slidesPerView: 'auto',
            loop: true,
            speed: 4000,
            allowTouchMove: false,
        };

        if (document.querySelector('.reviews_top')) {
            new Swiper('.reviews_top', {
                ...sliderSettings,
                autoplay: { delay: 0, disableOnInteraction: false, reverseDirection: false },
            });
        }

        if (document.querySelector('.reviews_bottom')) {
            new Swiper('.reviews_bottom', {
                ...sliderSettings,
                autoplay: { delay: 0, disableOnInteraction: false, reverseDirection: true },
            });
        }
    }

    // --- الأسئلة الشائعة (FAQ) ---
    const faqLinks = document.querySelectorAll('.faq-link');
    faqLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            this.classList.toggle('collapsed');
            const targetId = this.getAttribute('href');
            const targetPanel = document.querySelector(targetId);
            if (targetPanel) {
                targetPanel.classList.toggle('show');
            }
        });
    });

    // --- مترجم جوجل المخصص ---
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        function changeLanguage(lang) {
            const googleSelect = document.querySelector('.goog-te-combo');
            if (googleSelect) {
                googleSelect.value = lang;
                googleSelect.dispatchEvent(new Event('change'));
                
                if (lang === 'en') {
                    document.documentElement.dir = 'ltr';
                    document.documentElement.lang = 'en';
                } else {
                    document.documentElement.dir = 'rtl';
                    document.documentElement.lang = 'ar';
                }
            }
        }

        langSelect.addEventListener('change', function () {
            changeLanguage(this.value);
        });

        setTimeout(function () {
            let cookie = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
            let currentLang = cookie ? cookie[1].split('/')[2] : 'ar';
            
            if (currentLang === 'en') {
                langSelect.value = 'en';
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = 'en';
            } else {
                langSelect.value = 'ar';
                document.documentElement.dir = 'rtl';
                document.documentElement.lang = 'ar';
            }
        }, 1000);
    }
});

// ==========================================
// جلب الصفحة وعرضها داخل الـ iframe ديناميكياً
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const pageName = urlParams.get('page') || 'index_page'; 

const renderFrame = document.getElementById('renderFrame');
if (renderFrame) {
    const pageRef = doc(db, "pages", pageName);

    onSnapshot(pageRef, (docSnap) => {
        if (docSnap.exists()) {
            renderFrame.srcdoc = docSnap.data().source_code;
        } else {
            renderFrame.srcdoc = "<h1>الصفحة غير موجودة 404</h1>";
        }
    });
}
const newsForm = document.getElementById('news-form');
const newsIdInput = document.getElementById('newsId');
const titleInput = document.getElementById('newsTitle');
const imageInput = document.getElementById('newsImage');
const descInput = document.getElementById('newsDesc');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const newsTableBody = document.getElementById('newsTableBody');
const formTitle = document.getElementById('formTitle');

let newsArray = []; // مصفوفة لحفظ البيانات محلياً لتسهيل التعديل

// ==========================================
// 1. جلب الأخبار وعرضها في الجدول (لحظياً)
// ==========================================
const newsRef = collection(db, "news");
const q = query(newsRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    newsTableBody.innerHTML = ""; // تفريغ الجدول
    newsArray = []; // تفريغ المصفوفة

    if (snapshot.empty) {
        newsTableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>لا توجد أخبار مضافة حالياً.</td></tr>";
        return;
    }

    snapshot.forEach((documentSnapshot) => {
        const data = documentSnapshot.data();
        const id = documentSnapshot.id;
        
        // حفظ البيانات في المصفوفة
        newsArray.push({ id, ...data });

        // تحويل التاريخ ليكون مقروءاً
        const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن';

        // إنشاء صف الجدول
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${data.imageUrl}" alt="صورة الخبر"></td>
            <td>${data.title}</td>
            <td>${date}</td>
            <td>
                <button class="action-btn btn-edit" data-id="${id}"><i class="fa-solid fa-pen"></i> تعديل</button>
                <button class="action-btn btn-delete" data-id="${id}"><i class="fa-solid fa-trash"></i> حذف</button>
            </td>
        `;
        newsTableBody.appendChild(tr);
    });
});

// ==========================================
// 2. إضافة أو تعديل خبر (عند الضغط على نشر)
// ==========================================
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.innerHTML = "جاري الحفظ... <i class='fa-solid fa-spinner fa-spin'></i>";
    submitBtn.disabled = true;

    const id = newsIdInput.value;
    const title = titleInput.value;
    const imageUrl = imageInput.value;
    const description = descInput.value;

    try {
        if (id) {
            // حالة التعديل: تحديث الخبر الموجود
            const docRef = doc(db, "news", id);
            await updateDoc(docRef, {
                title: title,
                imageUrl: imageUrl,
                description: description
                // لا نقوم بتحديث createdAt للحفاظ على تاريخ النشر الأصلي
            });
            alert("تم تعديل الخبر بنجاح!");
            resetForm();
        } else {
            // حالة الإضافة: إضافة خبر جديد
            await addDoc(collection(db, "news"), {
                title: title,
                imageUrl: imageUrl,
                description: description,
                createdAt: serverTimestamp() // يضيف تاريخ السيرفر تلقائياً
            });
            alert("تمت إضافة الخبر بنجاح!");
            newsForm.reset();
        }
    } catch (error) {
        console.error("خطأ:", error);
        alert("حدث خطأ أثناء حفظ الخبر.");
    } finally {
        submitBtn.innerHTML = "نشر الخبر <i class='fa-solid fa-paper-plane'></i>";
        submitBtn.disabled = false;
    }
});

// ==========================================
// 3. الاستماع لأزرار الحذف والتعديل داخل الجدول
// ==========================================
newsTableBody.addEventListener('click', async (e) => {
    // حالة زر الحذف
    if (e.target.closest('.btn-delete')) {
        const id = e.target.closest('.btn-delete').dataset.id;
        const confirmDelete = confirm("هل أنت متأكد من حذف هذا الخبر نهائياً؟");
        if (confirmDelete) {
            try {
                await deleteDoc(doc(db, "news", id));
                alert("تم حذف الخبر بنجاح.");
            } catch (error) {
                console.error("خطأ في الحذف:", error);
                alert("حدث خطأ أثناء الحذف.");
            }
        }
    }

    // حالة زر التعديل
    if (e.target.closest('.btn-edit')) {
        const id = e.target.closest('.btn-edit').dataset.id;
        
        // البحث عن الخبر في المصفوفة
        const newsItem = newsArray.find(item => item.id === id);
        if (newsItem) {
            // تعبئة الفورم بالبيانات
            newsIdInput.value = newsItem.id;
            titleInput.value = newsItem.title;
            imageInput.value = newsItem.imageUrl;
            descInput.value = newsItem.description;

            // تغيير شكل الفورم
            formTitle.innerText = "تعديل الخبر الحالي";
            submitBtn.innerHTML = "حفظ التعديلات <i class='fa-solid fa-check'></i>";
            cancelEditBtn.style.display = "block"; // إظهار زر الإلغاء
            
            // عمل Scroll ناعم للفورم لأعلى
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});

// ==========================================
// 4. زر إلغاء التعديل
// ==========================================
cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
    newsForm.reset();
    newsIdInput.value = "";
    formTitle.innerText = "إضافة خبر جديد";
    submitBtn.innerHTML = "نشر الخبر <i class='fa-solid fa-paper-plane'></i>";
    cancelEditBtn.style.display = "none";
}
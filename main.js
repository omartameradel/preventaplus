// ==========================================
// استدعاء مكتبات Firebase
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
const auth = getAuth(app); // تمت إضافة المصادقة للتتبع

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

            let visibleNewsCount = 0;
            snapshot.forEach((docSnap) => {
                if (docSnap.data().isVisible === false) return;
                visibleNewsCount += 1;
            });

            if (visibleNewsCount === 0) {
                newsGrid.innerHTML = "<div class='swiper-slide'><p style='text-align:center; width:100%;'>لا توجد أخبار حالياً.</p></div>";
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.isVisible === false) return;
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
            loop: false,
            grabCursor: true, 
            autoplay: {
                delay: 15000, 
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

    // ==========================================
    // --- نظام تسجيل الدخول (محاكاة Firebase عبر Local Storage) ---
    // ==========================================
    const loginForm = document.getElementById('firebase-login-form');
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember');
        const submitBtn = document.getElementById('loginBtn');
        const togglePassword = document.getElementById('togglePassword');

        const savedEmail = localStorage.getItem("rememberedEmail");
        if (savedEmail) {
            emailInput.value = savedEmail;
            rememberCheckbox.checked = true;
        }

        togglePassword?.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePassword.setAttribute('aria-label', isPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
            togglePassword.setAttribute('aria-pressed', String(isPassword));
            togglePassword.querySelector('svg')?.classList.toggle('is-visible', isPassword);
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = "<span>جاري التحقق من البيانات... <i class='fa-solid fa-spinner fa-spin'></i></span>";
            submitBtn.disabled = true;

            const enteredEmail = emailInput.value.trim();
            const enteredPassword = passwordInput.value;
            const rememberMe = rememberCheckbox.checked;

            try {
                const usersRef = collection(db, "users");
                const q = query(
                    usersRef, 
                    where("email", "==", enteredEmail), 
                    where("password", "==", enteredPassword)
                );
                
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data();

                    if (userData.isActive === true) {
                        if (rememberMe) {
                            localStorage.setItem("rememberedEmail", enteredEmail);
                        } else {
                            localStorage.removeItem("rememberedEmail");
                        }

                        const userSession = {
                            uid: userDoc.id,
                            email: userData.email,
                            name: userData.name
                        };
                        sessionStorage.setItem("loggedInUser", JSON.stringify(userSession));
                        localStorage.setItem("loggedInUser", JSON.stringify(userSession));

                        submitBtn.innerHTML = "<span>تم تسجيل الدخول بنجاح <i class='fa-solid fa-check'></i></span>";
                        window.location.href = "dashboard.html"; 

                    } else {
                        alert("عذراً، هذا الحساب معطل حالياً. يرجى التواصل مع الإدارة.");
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                    }

                } else {
                    alert("خطأ: البريد الإلكتروني أو كلمة المرور غير صحيحة.");
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                }

            } catch (error) {
                console.error("خطأ في الاتصال بقاعدة البيانات: ", error);
                alert("حدث خطأ أثناء التحقق من البيانات. تأكد من اتصالك بالإنترنت.");
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

// ==========================================
// إدارة الأخبار (إضافة، تعديل، حذف)
// ==========================================
const newsForm = document.getElementById('news-form');
const newsIdInput = document.getElementById('newsId');
const titleInput = document.getElementById('newsTitle');
const imageInput = document.getElementById('newsImage');
const descInput = document.getElementById('newsDesc');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const newsTableBody = document.getElementById('newsTableBody');
const formTitle = document.getElementById('formTitle');

let newsArray = [];

if (newsForm && newsTableBody) {
    const newsRef = collection(db, "news");
    const q = query(newsRef, orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        newsTableBody.innerHTML = ""; 
        newsArray = []; 

        if (snapshot.empty) {
            newsTableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>لا توجد أخبار مضافة حالياً.</td></tr>";
            return;
        }

        snapshot.forEach((documentSnapshot) => {
            const data = documentSnapshot.data();
            const id = documentSnapshot.id;
            
            newsArray.push({ id, ...data });

            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن';

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
                const docRef = doc(db, "news", id);
                await updateDoc(docRef, {
                    title: title,
                    imageUrl: imageUrl,
                    description: description
                });
                alert("تم تعديل الخبر بنجاح!");
                resetForm();
            } else {
                await addDoc(collection(db, "news"), {
                    title: title,
                    imageUrl: imageUrl,
                    description: description,
                    createdAt: serverTimestamp()
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

    newsTableBody.addEventListener('click', async (e) => {
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

        if (e.target.closest('.btn-edit')) {
            const id = e.target.closest('.btn-edit').dataset.id;
            const newsItem = newsArray.find(item => item.id === id);
            
            if (newsItem) {
                newsIdInput.value = newsItem.id;
                titleInput.value = newsItem.title;
                imageInput.value = newsItem.imageUrl;
                descInput.value = newsItem.description;

                formTitle.innerText = "تعديل الخبر الحالي";
                submitBtn.innerHTML = "حفظ التعديلات <i class='fa-solid fa-check'></i>";
                cancelEditBtn.style.display = "block"; 
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });

    cancelEditBtn.addEventListener('click', resetForm);

    function resetForm() {
        newsForm.reset();
        newsIdInput.value = "";
        formTitle.innerText = "إضافة خبر جديد";
        submitBtn.innerHTML = "نشر الخبر <i class='fa-solid fa-paper-plane'></i>";
        cancelEditBtn.style.display = "none";
    }
}

// ==========================================
// نظام تتبع المستخدمين النشطين (Live Tracking)
// ==========================================
// ==========================================
// نظام تتبع المستخدمين النشطين (النسخة الاحترافية الخالية من الأخطاء)
// ==========================================

// ==========================================
// نظام تتبع المستخدمين المسجلين فقط (بدون زوار نهائياً)
// ==========================================

function getDeviceInfo() {
    const ua = navigator.userAgent;
    let browser = "Chrome", os = "Windows", deviceType = "Desktop";

    if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
    else if (/windows/i.test(ua)) os = "Windows";
    else if (/mac/i.test(ua)) os = "MacOS";
    else if (/linux/i.test(ua)) os = "Linux";

    if (/mobile/i.test(ua)) deviceType = "Mobile";
    else if (/tablet/i.test(ua)) deviceType = "Tablet";

    if (/chrome|crios/i.test(ua) && !/edge|opr\//i.test(ua)) browser = "Chrome";
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/edg/i.test(ua)) browser = "Edge";
    else if (/opr\//i.test(ua)) browser = "Opera";

    return { os, browser, deviceType };
}

// جلب الـ IP والموقع بسرعة وبدائل متعددة لمنع "مخفي"
async function getLocationData() {
    const cached = sessionStorage.getItem('validUserLocation');
    if (cached) return JSON.parse(cached);

    const apis = [
        'https://get.geojs.io/v1/ip/geo.json',
        'https://ipwho.is/',
        'https://api.db-ip.com/v2/free/self'
    ];

    for (let api of apis) {
        try {
            const res = await fetch(api);
            const data = await res.json();
            const ip = data.ip || data.ipAddress;
            if (ip) {
                let location = data.country || data.countryName || "غير محدد";
                if (data.city || data.cityName) location += ` - ${data.city || data.cityName}`;
                const result = { ip, location };
                sessionStorage.setItem('validUserLocation', JSON.stringify(result));
                return result;
            }
        } catch (e) {}
    }

    // بديل طوارئ لجلب الـ IP الصافي إذا تعطلت الخدمات الجغرافية
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if (data.ip) {
            const result = { ip: data.ip, location: "متاح" };
            sessionStorage.setItem('validUserLocation', JSON.stringify(result));
            return result;
        }
    } catch(e) {}

    return { ip: "متاح", location: "غير محدد" };
}

function getCurrentPageName() {
    let url = decodeURIComponent(window.location.href).toLowerCase();
    
    if (url.includes("ministerial")) return "القرارات الوزارية";
    if (url.includes("forms")) return "النماذج";
    if (url.includes("prevention-designs")) return "التصميمات الوقائية";
    if (url.includes("library")) return "المكتبة";
    if (url.includes("news") || url.includes("fhfk6iuof")) return "الأخبار";
    if (url.includes("articles")) return "المقالات";
    if (url.includes("meetings")) return "الاجتماعات";
    if (url.includes("support")) return "الدعم الفني";
    if (url.includes("community")) return "المجتمع";
    if (url.includes("tests")) return "الاختبارات";
    if (url.includes("profile")) return "الملف الشخصي";
    if (url.includes("mm6ops")) return "إدارة المستخدمين";
    if (url.includes("dashboard") || url.includes("addash")) return "لوحة التحكم";
    if (url.includes("index") || url.endsWith("/")) return "الرئيسية";
    
    let path = window.location.pathname.split("/").pop().replace(".html", "");
    return path || "الرئيسية";
}

async function trackUserPresence() {
    try {
        // 1. التحقق من وجود مستخدم مسجل دخول حقيقي
        const loggedInStr = localStorage.getItem("loggedInUser") || sessionStorage.getItem("loggedInUser");
        if (!loggedInStr) {
            // خروج فوري: الزوار غير المسجلين لن يتم تسجيلهم نهائياً في قاعدة البيانات
            return; 
        }

        let currentUser = null;
        try {
            currentUser = JSON.parse(loggedInStr);
        } catch (e) {
            return;
        }

        // إذا لم يكن لديه اسم أو بريد حقيقي، لا تسجله
        if (!currentUser || !currentUser.name || currentUser.name.startsWith("زائر")) {
            return;
        }

        // استخدام معرّف الحساب الحقيقي لربط جلسة المستخدم
        const userId = currentUser.uid || currentUser.email.replace(/[^a-zA-Z0-9]/g, "_");
        const userDocRef = doc(db, "dashboardPresence", userId);

        // 2. جلب جميع البيانات معاً (الـ IP + الموقع + الصفحة + الجهاز)
        const [locationInfo, deviceInfo] = await Promise.all([
            getLocationData(),
            Promise.resolve(getDeviceInfo())
        ]);
        const currentPage = getCurrentPageName();

        // 3. إرسال البيانات كاملة في نفس اللحظة (لن يظهر واحد قبل الآخر)
        await setDoc(userDocRef, {
            id: userId,
            name: currentUser.name,
            email: currentUser.email || "بدون بريد",
            role: currentUser.role || "user",
            deviceType: deviceInfo.deviceType,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            ip: locationInfo.ip,
            location: locationInfo.location,
            currentPage: currentPage,
            lastSeenAt: serverTimestamp(),
            sessionStartAt: serverTimestamp(),
            online: true
        }, { merge: true });

        // 4. تحديث الصفحة والحالة كل 15 ثانية
        setInterval(() => {
            setDoc(userDocRef, { 
                lastSeenAt: serverTimestamp(),
                currentPage: getCurrentPageName(),
                online: true
            }, { merge: true });
        }, 15000);

        // إغلاق الجلسة عند مغادرة الموقع
        window.addEventListener("beforeunload", () => {
            setDoc(userDocRef, { online: false, lastSeenAt: serverTimestamp() }, { merge: true });
        });

    } catch (error) {
        console.error("خطأ في تتبع الحضور:", error);
    }
}

// بدء التتبع
trackUserPresence();

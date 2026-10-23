// ==========================================
// استدعاء مكتبات Firebase
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, deleteUser, getAuth, setPersistence, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
const auth = getAuth(app);

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
                const formattedDescription = linkify(data.description || "");
                const descriptionText = (data.description || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
                const shouldShowToggle = descriptionText.length > 170;

                const cardHTML = `
                    <div class="swiper-slide">
                        <div class="news-card">
                            <img src="${data.imageUrl}" alt="${data.title}" class="card-img">
                            <div class="card-content">
                                <h3 class="card-title">${data.title}</h3>
                                <p class="card-desc ${shouldShowToggle ? "is-collapsed" : "is-expanded"}">${formattedDescription}</p>
                                ${shouldShowToggle ? `<button class="news-toggle" type="button" aria-expanded="false">عرض المزيد</button>` : ""}
                            </div>
                        </div>
                    </div>
                `;
                newsGrid.innerHTML += cardHTML;
            });

            const toggleButtons = newsGrid.querySelectorAll('.news-toggle');
            toggleButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const description = button.previousElementSibling;
                    const isExpanded = button.getAttribute('aria-expanded') === 'true';
                    description.classList.toggle('is-expanded', !isExpanded);
                    description.classList.toggle('is-collapsed', isExpanded);
                    button.textContent = isExpanded ? 'عرض المزيد' : 'عرض القليل';
                    button.setAttribute('aria-expanded', String(!isExpanded));
                });
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
    // --- تسجيل الدخول وإنشاء الحسابات ---
    // ==========================================
    const loginForm = document.getElementById('firebase-login-form');
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember');
        const submitBtn = document.getElementById('loginBtn');
        const togglePassword = document.getElementById('togglePassword');
        const signupForm = document.getElementById('signup-form');
        const signupSubmitButton = document.getElementById('createAccountBtn');
        const signupCaptchaQuestion = document.getElementById('signup-captcha-question');
        const signupCaptchaAnswer = document.getElementById('signup-captcha-answer');
        const refreshSignupCaptchaButton = document.getElementById('refreshSignupCaptchaBtn');
        const authMessage = document.getElementById('auth-message');
        const signupSwitch = document.getElementById('showSignupBtn');
        const loginSwitch = document.getElementById('showLoginBtn');
        let signupCaptchaAnswerExpected = null;

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

        function showAuthMessage(text, isError = false) {
            if (!authMessage) return;
            authMessage.textContent = text;
            authMessage.classList.toggle("is-error", isError);
            authMessage.classList.toggle("is-success", !isError);
        }

        function setSignupMode(isSignup) {
            loginForm.hidden = isSignup;
            signupForm.hidden = !isSignup;
            signupSwitch.hidden = isSignup;
            loginSwitch.hidden = !isSignup;
            showAuthMessage("");
        }

        function loadSignupCaptcha() {
            const numbers = new Uint32Array(2);
            window.crypto.getRandomValues(numbers);
            const firstNumber = (numbers[0] % 8) + 2;
            const secondNumber = (numbers[1] % 8) + 2;
            signupCaptchaAnswerExpected = String(firstNumber + secondNumber);
            signupCaptchaQuestion.textContent = `كم حاصل جمع ${firstNumber} + ${secondNumber}؟`;
            signupCaptchaAnswer.value = "";
            signupCaptchaAnswer.removeAttribute("aria-invalid");
            signupCaptchaAnswer.focus();
        }

        signupSwitch?.addEventListener("click", () => {
            setSignupMode(true);
            loadSignupCaptcha();
        });
        refreshSignupCaptchaButton?.addEventListener("click", loadSignupCaptcha);
        signupCaptchaAnswer?.addEventListener("input", () => {
            signupCaptchaAnswer.removeAttribute("aria-invalid");
        });
        loginSwitch?.addEventListener("click", () => {
            setSignupMode(false);
            signupForm.reset();
            signupCaptchaAnswerExpected = null;
        });

        document.querySelectorAll(".signup-password-toggle").forEach((button) => {
            button.addEventListener("click", () => {
                const input = document.getElementById(button.dataset.target);
                const visible = input.type === "password";
                input.type = visible ? "text" : "password";
                button.setAttribute("aria-label", visible ? "إخفاء كلمة السر" : "إظهار كلمة السر");
                button.querySelector("i").className = visible ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
            });
        });

        signupForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const password = document.getElementById("signup-password").value;
            const confirmPassword = document.getElementById("signup-confirm-password").value;
            if (password !== confirmPassword) {
                showAuthMessage("كلمتا السر غير متطابقتين.", true);
                return;
            }
            if (password.length < 6) {
                showAuthMessage("يجب أن تتكون كلمة السر من 6 أحرف على الأقل.", true);
                return;
            }

            if (!signupCaptchaAnswerExpected) {
                loadSignupCaptcha();
                showAuthMessage("أجب عن سؤال التحقق ثم أنشئ الحساب.");
                return;
            }
            const captchaAnswer = signupCaptchaAnswer.value.trim()
                .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
                .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
            if (captchaAnswer !== signupCaptchaAnswerExpected) {
                signupCaptchaAnswer.setAttribute("aria-invalid", "true");
                signupCaptchaAnswer.value = "";
                loadSignupCaptcha();
                showAuthMessage("الإجابة غير صحيحة. جرّب سؤال التحقق الجديد.", true);
                return;
            }
            signupCaptchaAnswerExpected = null;

            const email = document.getElementById("signup-email").value.trim().toLowerCase();
            const signupDetails = {
                name: document.getElementById("signup-name").value.trim(),
                phone: document.getElementById("signup-phone").value.trim(),
                jobTitle: document.getElementById("signup-job").value.trim(),
                governorate: document.getElementById("signup-governorate").value.trim(),
                workAdministration: document.getElementById("signup-management").value.trim(),
                email
            };

            signupSubmitButton.disabled = true;
            showAuthMessage("جارٍ إنشاء الحساب...");
            let createdUser = null;
            try {
                await setPersistence(auth, browserSessionPersistence);
                const credential = await createUserWithEmailAndPassword(auth, email, password);
                createdUser = credential.user;
                await setDoc(doc(db, "users", credential.user.uid), {
                    uid: credential.user.uid,
                    ...signupDetails,
                    status: "pending",
                    isActive: false,
                    allowedPages: [],
                    createdAt: serverTimestamp()
                });
                createdUser = null;
                signupForm.reset();
                setSignupMode(false);
                try {
                    await signOut(auth);
                    showAuthMessage("تم إرسال طلبك بنجاح. ستتمكن من الدخول بعد موافقة الإدارة.");
                } catch (signOutError) {
                    console.error("Could not sign out after successful signup:", signOutError);
                    showAuthMessage("تم إرسال طلبك بنجاح. أغلق الصفحة لإكمال تسجيل الخروج.");
                }
            } catch (error) {
                console.error("Signup request failed:", error);
                if (createdUser) {
                    try {
                        await deleteUser(createdUser);
                    } catch (cleanupError) {
                        console.error("Could not remove incomplete signup account:", cleanupError);
                    }
                    try {
                        await signOut(auth);
                    } catch (cleanupError) {
                        console.error("Could not sign out after incomplete signup:", cleanupError);
                    }
                }
                const errorMessage = error?.code === "auth/email-already-in-use"
                    ? "هذا البريد مرتبط بحساب موجود بالفعل."
                    : error?.code === "auth/weak-password"
                        ? "يجب أن تتكون كلمة السر من 6 أحرف على الأقل."
                        : error?.code === "auth/invalid-email"
                            ? "البريد الإلكتروني غير صالح."
                            : error?.code === "permission-denied"
                                ? "تعذر حفظ طلب التسجيل. تحقق من قواعد Firestore."
                                : "تعذر إنشاء الحساب الآن. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
                showAuthMessage(errorMessage, true);
            } finally {
                signupSubmitButton.disabled = false;
                if (!signupForm.hidden) {
                    loadSignupCaptcha();
                }
            }
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
                await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
                const credential = await signInWithEmailAndPassword(auth, enteredEmail, enteredPassword);
                const userSnapshot = await getDoc(doc(db, "users", credential.user.uid));
                if (!userSnapshot.exists()) {
                    await signOut(auth);
                    throw new Error("profile-not-found");
                }
                const userData = userSnapshot.data();
                if (userData.status === "pending") {
                    await signOut(auth);
                    showAuthMessage("حسابك قيد المراجعة. ستتمكن من الدخول بعد موافقة الإدارة.", true);
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }
                if (userData.status === "rejected") {
                    await signOut(auth);
                    showAuthMessage("لم تتم الموافقة على طلب الحساب. يرجى التواصل مع الإدارة.", true);
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }
                if (userData.isActive !== true) {
                    await signOut(auth);
                    showAuthMessage("عذرًا، هذا الحساب غير مفعل حاليًا. يرجى التواصل مع الإدارة.", true);
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }

                if (rememberMe) localStorage.setItem("rememberedEmail", enteredEmail);
                else localStorage.removeItem("rememberedEmail");
                const userSession = { uid: credential.user.uid, email: userData.email, name: userData.name };
                sessionStorage.setItem("loggedInUser", JSON.stringify(userSession));
                localStorage.setItem("loggedInUser", JSON.stringify(userSession));
                submitBtn.innerHTML = "<span>تم تسجيل الدخول بنجاح <i class='fa-solid fa-check'></i></span>";
                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("خطأ في الاتصال بقاعدة البيانات: ", error);
                if (error?.code === "auth/invalid-credential" || error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password") {
                    showAuthMessage("البريد الإلكتروني أو كلمة السر غير صحيحة.", true);
                } else if (error?.message === "profile-not-found") {
                    showAuthMessage("لا توجد بيانات حساب مرتبطة بهذا البريد. يرجى التواصل مع الإدارة.", true);
                } else {
                    showAuthMessage("حدث خطأ أثناء التحقق من البيانات. تأكد من اتصالك بالإنترنت.", true);
                }
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
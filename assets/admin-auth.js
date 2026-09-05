import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

export function requireAdmin(requiredRole = "admin") {
  return new Promise((resolve) => {
    setPersistence(auth, browserLocalPersistence).catch((error) => console.warn("Could not set auth persistence", error)).finally(() => onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.replace("admin-login.html"); return; }
      try {
        const snapshot = await getDoc(doc(db, "admins", user.uid));
        const admin = snapshot.exists() ? snapshot.data() : null;
        if (!admin || admin.active === false || (requiredRole !== "admin" && admin.role !== requiredRole && admin.role !== "admin")) {
          await signOut(auth);
          window.location.replace("admin-login.html");
          return;
        }
        document.documentElement.classList.add("admin-authorized");
        resolve({ user, admin });
      } catch (error) {
        console.error("Admin authorization failed", error);
        document.documentElement.classList.add("admin-authorized");
        document.body.innerHTML = `<main style="max-width:680px;margin:60px auto;padding:28px;font-family:Arial,sans-serif;direction:rtl;background:#fff;border:1px solid #e5caca;border-radius:14px"><h2 style="color:#9b2727">تعذر التحقق من صلاحية الأدمن</h2><p>تأكد من نشر قواعد Firestore وإنشاء المستند admins/{UID} بالقيمة role=admin و active=true.</p><p style="color:#777;direction:ltr;text-align:left">${error.code || error.message}</p><a href="admin-login.html">العودة لتسجيل دخول الأدمن</a></main>`;
      }
    }));
  });
}

export { auth };

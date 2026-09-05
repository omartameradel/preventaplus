
        import { db } from "./firebase-config.js"; 
        import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

        const iframe = document.getElementById('contentIframe');
        const loadingDiv = document.getElementById('loading');
        const pageRef = doc(db, "pages", "index_page");
        
        onSnapshot(pageRef, (docSnap) => {
            if (docSnap.exists()) {
                iframe.srcdoc = docSnap.data().source_code;
            } else {
                iframe.srcdoc = "<h1 style='text-align:center; font-family:sans-serif; margin-top:20%; direction:rtl;'>لم يتم نشر أي موقع بعد.</h1>";
            }
            loadingDiv.style.display = 'none';
        }, (error) => {
            console.error("Error: ", error);
            loadingDiv.innerHTML = "<h2 style='color:red;'>حدث خطأ أثناء تحميل الصفحة</h2>";
        });

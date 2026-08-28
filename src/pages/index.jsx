import React, { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default function IndexPage() {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pageRef = doc(db, "pages", "index_page");
    const unsubscribe = onSnapshot(pageRef, (docSnap) => {
      if (docSnap.exists()) {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = docSnap.data().source_code;
        }
      } else {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = "<h1 style='text-align:center; font-family:sans-serif; margin-top:20%'>لم يتم نشر أي كود بعد.</h1>";
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return React.createElement(
    'div',
    { style: { width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: 'white' } },
    loading && React.createElement(
      'div',
      { style: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 } },
      React.createElement('h2', { style: { color: '#2563eb', fontFamily: 'sans-serif' } }, "جاري تحميل الصفحة...")
    ),
    React.createElement('iframe', {
      ref: iframeRef,
      style: { width: '100%', height: '100%', border: 'none', display: 'block' },
      title: "Dynamic Content"
    })
  );
}

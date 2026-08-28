import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js'; 

export default function Dashboard() {
  const [sourceCode, setSourceCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadCurrentCode = async () => {
      const pageRef = doc(db, "pages", "index_page");
      const docSnap = await getDoc(pageRef);
      if (docSnap.exists()) {
        setSourceCode(docSnap.data().source_code);
      }
    };
    
    loadCurrentCode();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pageRef = doc(db, "pages", "index_page");
      await setDoc(pageRef, { source_code: sourceCode });
      alert("تم تحديث الكود بنجاح!");
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("حدث خطأ أثناء الحفظ.");
    } finally {
      setIsSaving(false);
    }
  };

  return React.createElement(
    'div',
    { style: { fontFamily: 'system-ui', padding: '20px', direction: 'rtl' } },
    React.createElement('h2', null, "محرر كود صفحة Index"),
    React.createElement('textarea', {
      id: "codeEditor",
      value: sourceCode,
      onChange: (e) => setSourceCode(e.target.value),
      placeholder: "اكتب كود HTML/CSS/JS هنا...",
      style: { width: '100%', height: '400px', padding: '10px', fontFamily: 'monospace', direction: 'ltr' }
    }),
    React.createElement('br', null),
    React.createElement(
      'button',
      {
        id: "saveBtn",
        onClick: handleSave,
        disabled: isSaving,
        style: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px', fontSize: '16px' }
      },
      isSaving ? "جاري الحفظ..." : "حفظ ونشر الكود"
    )
  );
}

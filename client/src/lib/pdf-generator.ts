import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateLessonPDF(video: any, metadata: any) {
  // 1. Create a temporary container for the PDF layout
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // A4 width in px (approx at 96dpi)
  container.style.minHeight = '1123px'; // A4 height
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.direction = 'rtl';
  container.style.fontFamily = 'Vazirmatn, sans-serif';
  container.style.color = '#333';
  
  // 2. Build the HTML content
  const vocabRows = metadata.vocabulary?.map((v: any, i: number) => `
    <tr style="border-bottom: 1px solid #eee; background-color: ${i % 2 === 0 ? '#f9fafb' : '#fff'};">
      <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 14px; color: #0f766e;">${v.word}</td>
      <td style="padding: 12px; text-align: left; font-family: sans-serif; font-size: 12px; color: #6b7280;">${v.pronunciation || ''}</td>
      <td style="padding: 12px; text-align: right; font-size: 14px;">${v.meaning}</td>
    </tr>
  `).join('') || '';

  const phrasesRows = metadata.phrases?.map((p: any, i: number) => `
    <tr style="border-bottom: 1px solid #eee; background-color: ${i % 2 === 0 ? '#f9fafb' : '#fff'};">
      <td style="padding: 12px; text-align: left; font-weight: bold; direction: ltr; font-size: 14px; color: #ea580c;">${p.phrase}</td>
      <td style="padding: 12px; text-align: right; font-size: 14px;">${p.meaning}</td>
    </tr>
  `).join('') || '';

  container.innerHTML = `
    <div style="border: 2px solid #0f766e; border-radius: 16px; overflow: hidden; height: 100%; position: relative;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); padding: 30px; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 900;">${video.title}</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">جزوه آموزشی و نکات کلیدی درس</p>
        </div>
        <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; font-weight: bold;">
          Say It English
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 30px;">
        
        <!-- Vocabulary Section -->
        ${metadata.vocabulary?.length ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #0f766e; font-size: 18px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
              <span>📚</span> لغات جدید
            </h2>
            <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f0fdfa; color: #134e4a;">
                  <th style="padding: 10px; text-align: right;">لغت</th>
                  <th style="padding: 10px; text-align: left;">تلفظ</th>
                  <th style="padding: 10px; text-align: right;">معنی</th>
                </tr>
              </thead>
              <tbody>
                ${vocabRows}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Phrases Section -->
        ${metadata.phrases?.length ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #ea580c; font-size: 18px; border-bottom: 2px solid #ffedd5; padding-bottom: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
              <span>💬</span> اصطلاحات کاربردی
            </h2>
            <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #fff7ed; color: #7c2d12;">
                  <th style="padding: 10px; text-align: left;">اصطلاح</th>
                  <th style="padding: 10px; text-align: right;">کاربرد / معنی</th>
                </tr>
              </thead>
              <tbody>
                ${phrasesRows}
              </tbody>
            </table>
          </div>
        ` : ''}

      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
        <p style="margin: 0;">یادگیری زبان انگلیسی با طعم سرگرمی | www.sayitenglish.ir</p>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    // 3. Render to Canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false
    });

    // 4. Create PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Lesson-${video.id}-SayItEnglish.pdf`);

  } catch (error) {
    console.error("PDF Generation Failed:", error);
    alert("متاسفانه در ساخت PDF مشکلی پیش آمد.");
  } finally {
    // 5. Cleanup
    document.body.removeChild(container);
  }
}

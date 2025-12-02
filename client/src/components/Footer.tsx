export function Footer() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center text-white mt-8">
      <p className="text-lg mb-2">💡 건의사항이나 문의사항이 있으신가요?</p>
      <a 
        href="mailto:varietyquizquiz@gmail.com" 
        className="text-xl font-semibold hover:text-yellow-300 transition-colors underline"
        data-testid="link-contact-email"
      >
        varietyquizquiz@gmail.com
      </a>
      <p className="text-sm mt-2 opacity-80">언제든지 연락주세요!</p>
    </div>
  );
}

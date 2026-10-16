/* A deliberate fixture. Every line below breaks a rule in the example
   config, and this comment must NOT be reported — it names bg-indigo-500
   and uses an em dash — which is exactly the case the comment stripper
   exists for. */
const accept = "image/*"; // this attribute once opened a comment that ate the file

export const Violations = () => (
  <section className="bg-white border-t border-gray-200">
    <h1 className="text-[13px] bg-clip-text text-gray-400">Pricing — simple</h1>
    <p className="text-[#4f46e5] bg-violet-500 border-l-4 rounded-3xl text-purple-700">Retired hues, two ways</p>
    <Icon size={22} strokeWidth={2} />
    <button className="aria-disabled:opacity-50">Not the pair</button>
    <span aria-hidden className="text-gray-400">Decorative, so exempt</span>
  </section>
);
